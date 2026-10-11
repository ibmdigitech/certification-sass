import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';

const courseOutlineSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  duration: z.number().optional(),
  targetAudience: z.string().optional(),
  prerequisites: z.string().optional(),
  learningObjectives: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = courseOutlineSchema.parse(body);

    const outline = await aiService.generateTrainingCourseOutline(input);

    return NextResponse.json({ outline });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Generate course outline error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate course outline' },
      { status: 500 }
    );
  }
}