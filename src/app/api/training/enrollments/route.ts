import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EnrollmentService } from '@/lib/services/enrollment.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const courseId = searchParams.get('courseId');
    const traineeId = searchParams.get('traineeId');
    const status = searchParams.get('status');

    const result = await EnrollmentService.listEnrollments(session.user.companyId, {
      courseId: courseId ? parseInt(courseId) : undefined,
      traineeId: traineeId ? parseInt(traineeId) : undefined,
      status: status || undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing enrollments:', error);
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
    const enrollment = await EnrollmentService.createEnrollment({
      companyId: session.user.companyId,
      ...body,
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}