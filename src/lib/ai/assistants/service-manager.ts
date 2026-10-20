import { ZodSchema } from 'zod';
import { AIServiceFactory } from '../provider-factory';
import { AIProvider, AICompletionResponse } from '../provider.interface';
import {
  AssistantType,
  ASSISTANT_SCHEMAS,
} from './schemas';
import { ASSISTANT_SYSTEM_PROMPTS } from './prompts';
import { prisma } from '@/lib/prisma';

// ─── Cost Estimation (per 1M tokens) ───────────────────────────────

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'anthropic/claude-3.5-sonnet': { input: 3.0, output: 15.0 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  'openai/gpt-4o': { input: 2.5, output: 10.0 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.6 },
  'google/gemini-pro-1.5': { input: 1.25, output: 5.0 },
  'mock-llm-v1': { input: 0, output: 0 },
};

function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const costs = MODEL_COSTS[model] || { input: 5.0, output: 15.0 };
  return (
    (promptTokens / 1_000_000) * costs.input +
    (completionTokens / 1_000_000) * costs.output
  );
}

// ─── AIServiceManager ──────────────────────────────────────────────

export interface AIExecutionContext {
  companyId: number;
  userId: number;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIExecutionResult<T> {
  data: T;
  transactionLogId: number;
  stagedOutputId: number;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUSD: number;
  };
  durationMs: number;
}

export class AIServiceManager {
  private provider: AIProvider;

  constructor(provider?: AIProvider) {
    this.provider = provider || AIServiceFactory.getProvider();
  }

  /**
   * Execute an AI assistant task with full governance:
   * 1. Build messages from system prompt + user data
   * 2. Call AI provider
   * 3. Parse output through Zod schema (with 1 automatic retry on failure)
   * 4. Log transaction (tokens, cost, duration)
   * 5. Stage output for human review (no autonomous writes)
   */
  async executeAssistant<T>(
    assistantType: AssistantType,
    userPrompt: string,
    context: AIExecutionContext,
    inputSummary?: string
  ): Promise<AIExecutionResult<T>> {
    const startTime = Date.now();
    const systemPrompt = ASSISTANT_SYSTEM_PROMPTS[assistantType];
    const schema = ASSISTANT_SCHEMAS[assistantType] as unknown as ZodSchema<T>;

    if (!systemPrompt) {
      throw new Error(`No system prompt registered for assistant: ${assistantType}`);
    }
    if (!schema) {
      throw new Error(`No Zod schema registered for assistant: ${assistantType}`);
    }

    // Check if AI is enabled for this company
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { companyId: context.companyId },
    });

    if (aiConfig && !aiConfig.enabled) {
      throw new Error(
        'AI features are disabled for this company. Enable in Settings > AI Configuration.'
      );
    }

    // Resolve provider from company config if available
    if (aiConfig?.provider) {
      this.provider = AIServiceFactory.getProvider(aiConfig.provider);
    }

    const model = context.model || aiConfig?.defaultModel || 'anthropic/claude-3.5-sonnet';
    const temperature = context.temperature ?? aiConfig?.temperature ?? 0.1;
    const maxTokens = context.maxTokens ?? aiConfig?.maxTokens ?? 4096;

    let completion: AICompletionResponse;
    let parsed: T;
    let logStatus = 'SUCCESS';
    let errorMessage: string | undefined;

    try {
      // First attempt
      completion = await this.provider.generateCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { model, temperature, maxTokens }
      );

      // Parse through Zod
      const parseResult = schema.safeParse(JSON.parse(completion.content));

      if (parseResult.success) {
        parsed = parseResult.data;
      } else {
        // Single automatic retry with validation error feedback
        const retryPrompt = `Your previous response failed schema validation with the following errors:\n${JSON.stringify(parseResult.error.issues, null, 2)}\n\nPlease correct your output and try again. Output only valid JSON matching the exact schema requirements.`;

        completion = await this.provider.generateCompletion(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
            { role: 'assistant', content: completion.content },
            { role: 'user', content: retryPrompt },
          ],
          { model, temperature: 0.05, maxTokens }
        );

        const retryResult = schema.safeParse(JSON.parse(completion.content));
        if (!retryResult.success) {
          throw new Error(
            `AI output failed Zod validation after retry: ${JSON.stringify(retryResult.error.issues)}`
          );
        }
        parsed = retryResult.data;
      }
    } catch (error) {
      logStatus = 'ERROR';
      errorMessage = error instanceof Error ? error.message : String(error);

      // Still log the failed transaction
      const durationMs = Date.now() - startTime;
      await prisma.aITransactionLog.create({
        data: {
          companyId: context.companyId,
          userId: context.userId,
          assistantType,
          model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCostUSD: 0,
          durationMs,
          status: logStatus,
          errorMessage,
        },
      });

      throw error;
    }

    const durationMs = Date.now() - startTime;
    const usage = completion.usage || {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    const estimatedCostUSD = estimateCost(
      completion.model,
      usage.promptTokens,
      usage.completionTokens
    );

    // Stage output for human review — NO autonomous writes to authoritative tables
    const stagedOutput = await prisma.aIStagedOutput.create({
      data: {
        companyId: context.companyId,
        assistantType,
        inputSummary: inputSummary || `${assistantType} analysis`,
        outputJson: parsed as object,
        status: 'PENDING_REVIEW',
        requestedById: context.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Log transaction with token accounting
    const transactionLog = await prisma.aITransactionLog.create({
      data: {
        companyId: context.companyId,
        userId: context.userId,
        assistantType,
        model: completion.model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        estimatedCostUSD,
        durationMs,
        status: logStatus,
        stagedOutputId: stagedOutput.id,
      },
    });

    return {
      data: parsed,
      transactionLogId: transactionLog.id,
      stagedOutputId: stagedOutput.id,
      model: completion.model,
      usage: {
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        estimatedCostUSD,
      },
      durationMs,
    };
  }

  /**
   * Approve a staged AI output — human-in-the-loop gate
   */
  static async approveOutput(
    stagedOutputId: number,
    reviewedById: number,
    companyId?: number,
    reviewNotes?: string
  ) {
    if (companyId) {
      const existing = await prisma.aIStagedOutput.findFirst({
        where: { id: stagedOutputId, companyId },
      });
      if (!existing) {
        throw new Error('Staged output not found or unauthorized');
      }
    }

    return prisma.aIStagedOutput.update({
      where: { id: stagedOutputId },
      data: {
        status: 'APPROVED',
        reviewedById,
        reviewNotes,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Reject a staged AI output
   */
  static async rejectOutput(
    stagedOutputId: number,
    reviewedById: number,
    companyId?: number,
    reviewNotes?: string
  ) {
    if (companyId) {
      const existing = await prisma.aIStagedOutput.findFirst({
        where: { id: stagedOutputId, companyId },
      });
      if (!existing) {
        throw new Error('Staged output not found or unauthorized');
      }
    }

    return prisma.aIStagedOutput.update({
      where: { id: stagedOutputId },
      data: {
        status: 'REJECTED',
        reviewedById,
        reviewNotes: reviewNotes || 'Rejected by reviewer',
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Get pending staged outputs for a company, optionally filtered by assistant type
   */
  static async getPendingOutputs(companyId: number, assistantType?: AssistantType) {
    return prisma.aIStagedOutput.findMany({
      where: {
        companyId,
        status: 'PENDING_REVIEW',
        ...(assistantType ? { assistantType } : {}),
      },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get AI usage analytics for a company
   */
  static async getUsageAnalytics(companyId: number, daysBack: number = 30) {
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const logs = await prisma.aITransactionLog.findMany({
      where: {
        companyId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCost = logs.reduce((sum, l) => sum + l.estimatedCostUSD, 0);
    const totalTokens = logs.reduce((sum, l) => sum + l.totalTokens, 0);
    const successRate =
      logs.length > 0
        ? (logs.filter((l) => l.status === 'SUCCESS').length / logs.length) * 100
        : 0;

    const byAssistant = logs.reduce(
      (acc, l) => {
        if (!acc[l.assistantType]) {
          acc[l.assistantType] = { count: 0, cost: 0, tokens: 0 };
        }
        acc[l.assistantType].count++;
        acc[l.assistantType].cost += l.estimatedCostUSD;
        acc[l.assistantType].tokens += l.totalTokens;
        return acc;
      },
      {} as Record<string, { count: number; cost: number; tokens: number }>
    );

    return {
      period: `Last ${daysBack} days`,
      totalTransactions: logs.length,
      totalTokens,
      totalCostUSD: Math.round(totalCost * 10000) / 10000,
      successRatePercent: Math.round(successRate * 100) / 100,
      byAssistant,
      recentTransactions: logs.slice(0, 20),
    };
  }
}
