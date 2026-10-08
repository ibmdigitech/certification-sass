import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { traineeService, type CreateTraineeInput, type TraineeFilters } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const department = searchParams.get('department') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    const filters: TraineeFilters = {
      companyId: session.user.companyId,
      search,
      status,
      department,
      page,
      pageSize,
      sortBy,
      sortOrder,
    };

    const result = await traineeService.findMany(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching trainees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateTraineeInput = await request.json();
    
    if (!body.firstName || !body.lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    const trainee = await traineeService.create({
      ...body,
      companyId: session.user.companyId,
    });

    return NextResponse.json(trainee, { status: 201 });
  } catch (error: any) {
    console.error('Error creating trainee:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A trainee with this email or employee ID already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}