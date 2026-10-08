import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TrainingModuleService } from '@/lib/services/training.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const body = await request.json();
    const { moduleIds } = body;

    if (!Array.isArray(moduleIds)) {
      return NextResponse.json({ error: 'moduleIds must be an array' }, { status: 400 });
    }

    await TrainingModuleService.reorderModules(parseInt(courseId), session.user.companyId, moduleIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering modules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}