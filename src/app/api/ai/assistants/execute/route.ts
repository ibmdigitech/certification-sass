import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  AIServiceManager,
  AssistantType,
  ASSISTANT_REGISTRY,
} from '@/lib/ai/assistants';

/**
 * POST /api/ai/assistants/execute
 * Execute any of the 8 specialized AI assistants.
 * All outputs are staged for human review — zero autonomous writes.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assistantType, userPrompt, inputSummary, model, temperature, maxTokens } = body;

    // Validate assistant type
    if (!assistantType || !Object.values(AssistantType).includes(assistantType)) {
      return NextResponse.json(
        {
          error: `Invalid assistantType. Must be one of: ${Object.values(AssistantType).join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'userPrompt is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const manager = new AIServiceManager();
    const result = await manager.executeAssistant(
      assistantType as AssistantType,
      userPrompt,
      {
        companyId: session.user.companyId,
        userId: Number(session.user.id),
        model,
        temperature,
        maxTokens,
      },
      inputSummary
    );

    return NextResponse.json({
      success: true,
      data: result.data,
      stagedOutputId: result.stagedOutputId,
      transactionLogId: result.transactionLogId,
      model: result.model,
      usage: result.usage,
      durationMs: result.durationMs,
      message: 'AI output staged for human review. No authoritative data modified.',
    });
  } catch (error) {
    console.error('AI assistant execution error:', error);
    const message = error instanceof Error ? error.message : 'AI execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/ai/assistants/execute
 * List available AI assistants and their metadata.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      assistants: ASSISTANT_REGISTRY,
    });
  } catch (error) {
    console.error('Error listing assistants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
