import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssessmentService } from '@/lib/services/training.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const lessonId = searchParams.get('lessonId');

    const result = await AssessmentService.listAssessments(session.user.companyId, {
      lessonId: lessonId ? parseInt(lessonId) : undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing assessments:', error);
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
    const assessment = await AssessmentService.createAssessment({
      companyId: session.user.companyId,
      ...body,
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}