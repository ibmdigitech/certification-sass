import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';

const improveTextSchema = z.object({
  text: z.string().min(1),
  goal: z.enum(['clarity', 'professional', 'concise', 'technical', 'persuasive']),
  audience: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = improveTextSchema.parse(body);

    const improved = await aiService.improveText(input);

    return NextResponse.json({ improved });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Improve text error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to improve text' },
      { status: 500 }
    );
  }
}