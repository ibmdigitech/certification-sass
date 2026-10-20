import { AIProvider, AIMessage, AICompletionOptions, AICompletionResponse } from './provider.interface';
import { openRouter } from './openrouter';

export class OpenRouterAIProvider implements AIProvider {
  name = 'openrouter';

  async generateCompletion(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResponse> {
    const res = await openRouter.chatCompletion({
      model: options?.model || openRouter.defaultModel,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.1,
      maxTokens: options?.maxTokens ?? 4096,
    });

    const choice = res.choices[0];
    if (!choice) {
      throw new Error('No completion choices returned by OpenRouter');
    }

    return {
      content: choice.message.content,
      model: res.model,
      usage: res.usage,
    };
  }
}

export class MockDevelopmentAIProvider implements AIProvider {
  name = 'mock';

  async generateCompletion(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResponse> {
    // Generates deterministic structured responses when API keys are not yet configured
    const userMsg = messages.find((m) => m.role === 'user')?.content || '';
    
    return {
      content: JSON.stringify({
        status: 'MOCK_VERIFIED',
        note: 'Mock assistant response for offline development',
        summary: `Analyzed query containing ${userMsg.length} characters.`,
      }),
      model: 'mock-llm-v1',
      usage: { promptTokens: 10, completionTokens: 25, totalTokens: 35 },
    };
  }
}

export class AIServiceFactory {
  static getProvider(providerName?: string): AIProvider {
    if (providerName === 'openrouter' && process.env.OPENROUTER_API_KEY) {
      return new OpenRouterAIProvider();
    }
    // Safe fallback for testing and offline environments
    return new MockDevelopmentAIProvider();
  }
}
