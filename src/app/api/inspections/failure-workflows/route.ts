import { NextRequest, NextResponse } from 'next/server';
import { InspectionReportService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = parseInt(searchParams.get('companyId') || '1');
    const jobId = searchParams.get('jobId') ? parseInt(searchParams.get('jobId')!) : undefined;
    const reportId = searchParams.get('reportId') ? parseInt(searchParams.get('reportId')!) : undefined;
    const status = searchParams.get('status') || undefined;
    const assignedTo = searchParams.get('assignedTo') ? parseInt(searchParams.get('assignedTo')!) : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await InspectionReportService.listFailureWorkflows(companyId, {
      jobId,
      reportId,
      status,
      assignedTo,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching failure workflows:', error);
    return NextResponse.json({ error: 'Failed to fetch failure workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, reportId, jobId, type, title, description, priority, assignedTo, dueDate, rootCause, correctiveAction, preventiveAction } = body;

    if (!companyId || !reportId || !jobId || !type || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const workflow = await InspectionReportService.createFailureWorkflow({
      companyId,
      reportId,
      jobId,
      type,
      title,
      description,
      priority,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      rootCause,
      correctiveAction,
      preventiveAction,
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error('Error creating failure workflow:', error);
    return NextResponse.json({ error: 'Failed to create failure workflow' }, { status: 500 });
  }
}