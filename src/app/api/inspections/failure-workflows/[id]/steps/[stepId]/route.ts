import { NextRequest, NextResponse } from 'next/server';
import { InspectionReportService } from '@/lib/services';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { stepId } = await params;
    const body = await request.json();
    const { companyId, status, completedBy, notes } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
    }

    let step;
    if (status === 'completed' && completedBy) {
      step = await InspectionReportService.completeFailureWorkflowStep(
        parseInt(stepId),
        companyId,
        completedBy,
        notes
      );
    } else {
      step = await InspectionReportService.updateFailureWorkflowStep(parseInt(stepId), companyId, {
        status,
        completedAt: status === 'completed' ? new Date() : undefined,
        completedBy,
        notes,
      });
    }

    return NextResponse.json(step);
  } catch (error) {
    console.error('Error updating failure workflow step:', error);
    return NextResponse.json({ error: 'Failed to update failure workflow step' }, { status: 500 });
  }
}