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
    const job = await JobService.getJobById(Number(id), companyId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const normalized = {
      ...job,
      jobServices: (job.jobServices ?? []).map((js: any) => ({
        id: js.id,
        jobId: js.jobId,
        serviceType: js.serviceType,
        serviceCode: js.serviceCode,
        description: js.description,
        status: js.status,
        requestedDate: js.requestedDate,
        scheduledStart: js.scheduledStart,
        scheduledEnd: js.scheduledEnd,
        assignedResponsibleId: js.assignedResponsibleId,
        completionDate: js.completionDate,
        inspection: js.inspections?.[0] ?? null,
        trainingSession: js.trainingSessions?.[0] ?? null,
      })),
    };

    return NextResponse.json(normalized);
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { id } = await params;
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { id } = await params;

    await JobService.deleteJob(Number(id), companyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
