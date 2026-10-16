import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { JobService, CreateJobInput } from '@/lib/services/job.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const customerId = searchParams.get('customerId') ? Number(searchParams.get('customerId')) : undefined;
    const engineerId = searchParams.get('engineerId') ? Number(searchParams.get('engineerId')) : undefined;
    const serviceType = searchParams.get('serviceType') || undefined;
    const jobNumber = searchParams.get('jobNumber') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');

    const result = await JobService.listJobs(companyId, {
      status,
      customerId,
      engineerId,
      serviceType,
      jobNumber,
      search,
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const body = await request.json();

    if (!body.customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    const job = await JobService.createJob({
      companyId,
      customerId: Number(body.customerId),
      locationId: body.locationId ? Number(body.locationId) : undefined,
      customerReference: body.customerReference,
      quotationId: body.quotationId,
      priority: body.priority,
      site: body.site,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
      engineerId: body.engineerId ? Number(body.engineerId) : undefined,
      inspectorId: body.inspectorId ? Number(body.inspectorId) : undefined,
      assets: body.assets,
      notes: body.notes,
      scope: body.scope,
      internalRemarks: body.internalRemarks,
      jobNumber: body.jobNumber,
      services: body.services,
      type: body.type,
    } as CreateJobInput);

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    const message = error instanceof Error ? error.message : 'Failed to create job';
    const status = message.includes('already exists') || message.includes('not found') || message.includes('valid') || message.includes('required') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
