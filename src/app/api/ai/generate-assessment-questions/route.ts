import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';

const assessmentQuestionsSchema = z.object({
  topic: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionType: z.enum(['multiple_choice', 'true_false', 'short_answer']),
  learningObjective: z.string().optional(),
  count: z.number().min(1).max(50).default(10),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = assessmentQuestionsSchema.parse(body);

    const questions = await aiService.generateAssessmentQuestions(input);

    return NextResponse.json({ questions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Generate assessment questions error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate assessment questions' },
      { status: 500 }
    );
  }
}