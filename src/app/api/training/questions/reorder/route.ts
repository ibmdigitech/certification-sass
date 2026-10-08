import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QuestionService } from '@/lib/services/training.service';

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
    const { questionIds } = body;

    if (!Array.isArray(questionIds)) {
      return NextResponse.json({ error: 'questionIds must be an array' }, { status: 400 });
    }

    await QuestionService.reorderQuestions(parseInt(assessmentId), session.user.companyId, questionIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}