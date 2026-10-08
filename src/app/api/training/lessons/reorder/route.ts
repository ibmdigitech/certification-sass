import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TrainingLessonService } from '@/lib/services/training.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId } = await params;
    const body = await request.json();
    const { lessonIds } = body;

    if (!Array.isArray(lessonIds)) {
      return NextResponse.json({ error: 'lessonIds must be an array' }, { status: 400 });
    }

    await TrainingLessonService.reorderLessons(parseInt(moduleId), session.user.companyId, lessonIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering lessons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}