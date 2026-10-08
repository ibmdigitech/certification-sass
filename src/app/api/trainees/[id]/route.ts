import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { traineeService, type UpdateTraineeInput } from '@/lib/services';

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
    const trainee = await traineeService.findById(parseInt(id), session.user.companyId);
    
    if (!trainee) {
      return NextResponse.json({ error: 'Trainee not found' }, { status: 404 });
    }

    return NextResponse.json(trainee);
  } catch (error) {
    console.error('Error fetching trainee:', error);
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
    const body: UpdateTraineeInput = await request.json();

    const trainee = await traineeService.update({
      ...body,
      id: parseInt(id),
      hireDate: body.hireDate ? new Date(body.hireDate) : undefined,
    });

    return NextResponse.json(trainee);
  } catch (error: any) {
    console.error('Error updating trainee:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A trainee with this email or employee ID already exists' }, { status: 409 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Trainee not found' }, { status: 404 });
    }
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
    await traineeService.delete(parseInt(id), session.user.companyId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting trainee:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Trainee not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}