import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';

const translateSchema = z.object({
  text: z.string().min(1),
  targetLanguage: z.string().min(1),
  context: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = translateSchema.parse(body);

    const translation = await aiService.translateText(input);

    return NextResponse.json({ translation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Translate text error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to translate text' },
      { status: 500 }
    );
  }
}