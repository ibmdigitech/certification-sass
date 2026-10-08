import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/services/job.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = Number(searchParams.get('companyId') || '1');
    const status = searchParams.get('status') || undefined;
    const customerId = searchParams.get('customerId') ? Number(searchParams.get('customerId')) : undefined;
    const engineerId = searchParams.get('engineerId') ? Number(searchParams.get('engineerId')) : undefined;
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');

    const result = await JobService.listJobs(companyId, {
      status,
      customerId,
      engineerId,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, customerId, type, scheduledDate, engineerId, jobNumber } = body;

    if (!companyId || !customerId) {
      return NextResponse.json({ error: 'companyId and customerId are required' }, { status: 400 });
    }

    const job = await JobService.createJob({
      companyId,
      customerId,
      type,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      engineerId,
      jobNumber,
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create job' }, { status: 500 });
  }
}