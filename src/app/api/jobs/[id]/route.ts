import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/services/job.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = Number(request.nextUrl.searchParams.get('companyId') || '1');
    const job = await JobService.getJobById(Number(id), companyId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = Number(request.nextUrl.searchParams.get('companyId') || '1');
    const body = await request.json();

    const job = await JobService.updateJob(Number(id), companyId, body);

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = Number(request.nextUrl.searchParams.get('companyId') || '1');

    await JobService.deleteJob(Number(id), companyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}