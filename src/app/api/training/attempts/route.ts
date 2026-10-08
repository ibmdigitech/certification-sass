import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssessmentAttemptService } from '@/lib/services/enrollment.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const assessmentId = searchParams.get('assessmentId');
    const traineeId = searchParams.get('traineeId');
    const enrollmentId = searchParams.get('enrollmentId');

    const result = await AssessmentAttemptService.listAttempts(session.user.companyId, {
      assessmentId: assessmentId ? parseInt(assessmentId) : undefined,
      traineeId: traineeId ? parseInt(traineeId) : undefined,
      enrollmentId: enrollmentId ? parseInt(enrollmentId) : undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing attempts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    let result;
    if (action === 'start') {
      result = await AssessmentAttemptService.startAttempt({
        companyId: session.user.companyId,
        ...data,
      });
    } else if (action === 'submit') {
      result = await AssessmentAttemptService.submitAttempt({
        companyId: session.user.companyId,
        ...data,
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating attempt:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}