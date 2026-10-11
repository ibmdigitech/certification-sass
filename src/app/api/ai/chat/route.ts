import { NextRequest, NextResponse } from 'next/server';
import { openRouter, type OpenRouterRequest, type OpenRouterMessage } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { messages, model, temperature, maxTokens, topP, stream } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (!openRouter.isConfigured()) {
      return NextResponse.json(
        { error: 'AI service not configured. Please set OPENROUTER_API_KEY.' },
        { status: 503 }
      );
    }

    const validatedMessages: OpenRouterMessage[] = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const requestData: OpenRouterRequest = {
      model: model || openRouter.defaultModel,
      messages: validatedMessages,
      temperature: temperature ?? 0.7,
      maxTokens,
      topP,
      stream: stream ?? false,
    };

    if (stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await openRouter.chatCompletionStream(requestData, (chunk) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
            });
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const response = await openRouter.chatCompletion(requestData);

    return NextResponse.json({
      content: response.choices[0]?.message?.content || '',
      usage: response.usage,
      model: response.model,
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}