import { NextRequest, NextResponse } from 'next/server';
import { InspectionReportService } from '@/lib/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { companyId, resolvedBy, rootCause, correctiveAction, preventiveAction } = body;
    const workflowId = parseInt(id);

    if (!companyId || !resolvedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const workflow = await InspectionReportService.resolveFailureWorkflow(
      workflowId,
      companyId,
      resolvedBy,
      rootCause,
      correctiveAction,
      preventiveAction
    );

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error resolving failure workflow:', error);
    return NextResponse.json({ error: 'Failed to resolve failure workflow' }, { status: 500 });
  }
}