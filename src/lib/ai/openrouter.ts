const openRouterConfig = {
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet',
};

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenRouterMessage;
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface OpenRouterError {
  error: {
    message: string;
    type: string;
    code: string | null;
  };
}

class OpenRouterClient {
  private apiKey: string;
  private _baseUrl: string;
  private _defaultModel: string;

  constructor() {
    this.apiKey = openRouterConfig.apiKey;
    this._baseUrl = openRouterConfig.baseUrl;
    this._defaultModel = openRouterConfig.defaultModel;
  }

  get defaultModel(): string {
    return this._defaultModel;
  }

  get baseUrl(): string {
    return this._baseUrl;
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async chatCompletion(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch(`${this._baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'CertAI',
      },
      body: JSON.stringify({
        model: request.model || this._defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty,
        stream: request.stream ?? false,
      }),
    });

    if (!response.ok) {
      const error: OpenRouterError = await response.json();
      throw new Error(`OpenRouter API error: ${error.error.message}`);
    }

    return response.json();
  }

  async chatCompletionStream(
    request: OpenRouterRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch(`${this._baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'CertAI',
      },
      body: JSON.stringify({
        model: request.model || this._defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error: OpenRouterError = await response.json();
      throw new Error(`OpenRouter API error: ${error.error.message}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  }

  async generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    options?: Partial<OpenRouterRequest>
  ): Promise<string> {
    const response = await this.chatCompletion({
      model: options?.model || this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  }
}

export const openRouter = new OpenRouterClient();

export const AI_MODELS = {
  CLAUDE_3_5_SONNET: 'anthropic/claude-3.5-sonnet',
  CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku',
  CLAUDE_3_OPUS: 'anthropic/claude-3-opus',
  GPT_4O: 'openai/gpt-4o',
  GPT_4O_MINI: 'openai/gpt-4o-mini',
  GPT_4_TURBO: 'openai/gpt-4-turbo',
  GEMINI_1_5_PRO: 'google/gemini-1.5-pro',
  GEMINI_1_5_FLASH: 'google/gemini-1.5-flash',
  LLAMA_3_1_405B: 'meta-llama/llama-3.1-405b-instruct',
  LLAMA_3_1_70B: 'meta-llama/llama-3.1-70b-instruct',
  MIXTRAL_8X7B: 'mistralai/mixtral-8x7b-instruct',
} as const;

export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS];

export function getRecommendedModel(task: 'fast' | 'balanced' | 'quality' | 'reasoning'): AIModel {
  switch (task) {
    case 'fast':
      return AI_MODELS.GPT_4O_MINI;
    case 'balanced':
      return AI_MODELS.CLAUDE_3_5_SONNET;
    case 'quality':
      return AI_MODELS.CLAUDE_3_OPUS;
    case 'reasoning':
      return AI_MODELS.GPT_4O;
    default:
      return AI_MODELS.CLAUDE_3_5_SONNET;
  }
}