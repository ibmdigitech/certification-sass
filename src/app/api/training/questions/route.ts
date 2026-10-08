import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QuestionService } from '@/lib/services/training.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assessmentId } = await params;
    const questions = await QuestionService.listQuestions(parseInt(assessmentId), session.user.companyId);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error listing questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assessmentId } = await params;
    const body = await request.json();
    const { questions } = body;

    if (Array.isArray(questions)) {
      await QuestionService.bulkCreateQuestions(parseInt(assessmentId), session.user.companyId, questions);
      return NextResponse.json({ success: true, count: questions.length }, { status: 201 });
    }

    const question = await QuestionService.createQuestion({
      companyId: session.user.companyId,
      assessmentId: parseInt(assessmentId),
      ...body,
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}