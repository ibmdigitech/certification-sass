import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';

const moduleContentSchema = z.object({
  courseTitle: z.string().min(1),
  moduleTitle: z.string().min(1),
  moduleDescription: z.string().optional(),
  duration: z.number().optional(),
  topics: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = moduleContentSchema.parse(body);

    const content = await aiService.generateTrainingModuleContent(input);

    return NextResponse.json({ content });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Generate module content error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate module content' },
      { status: 500 }
    );
  }
}