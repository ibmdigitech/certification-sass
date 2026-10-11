import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { JobService } from '@/lib/services/job.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { id } = await params;

    const services = await JobService.getJobServices(Number(id), companyId);

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching job services:', error);
    return NextResponse.json({ error: 'Failed to fetch job services' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { id } = await params;
    const body = await request.json();

    const service = await JobService.createJobService(Number(id), companyId, body);

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating job service:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create job service' }, { status: 500 });
  }
}