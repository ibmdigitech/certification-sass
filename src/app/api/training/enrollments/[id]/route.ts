import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EnrollmentService } from '@/lib/services/enrollment.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const enrollment = await EnrollmentService.getEnrollmentById(parseInt(id), session.user.companyId);
    
    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const enrollment = await EnrollmentService.updateEnrollmentStatus(parseInt(id), session.user.companyId, status);

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await EnrollmentService.deleteEnrollment(parseInt(id), session.user.companyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}