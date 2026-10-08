import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TrainingCourseService } from '@/lib/services/training.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const course = await TrainingCourseService.publishCourse(parseInt(id), session.user.companyId);

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error publishing course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}