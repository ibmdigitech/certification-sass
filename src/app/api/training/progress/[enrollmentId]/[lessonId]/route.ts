import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LessonProgressService } from '@/lib/services/enrollment.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string; lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enrollmentId, lessonId } = await params;
    const progress = await LessonProgressService.getLessonProgress(
      parseInt(enrollmentId),
      parseInt(lessonId),
      session.user.companyId
    );
    
    if (!progress) {
      return NextResponse.json({ error: 'Progress not found' }, { status: 404 });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string; lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enrollmentId, lessonId } = await params;
    const body = await request.json();
    const { action, timeSpent } = body;

    let progress;
    if (action === 'start') {
      progress = await LessonProgressService.startLesson(
        parseInt(enrollmentId),
        parseInt(lessonId),
        session.user.companyId
      );
    } else if (action === 'complete') {
      progress = await LessonProgressService.completeLesson(
        parseInt(enrollmentId),
        parseInt(lessonId),
        session.user.companyId,
        timeSpent || 0
      );
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}