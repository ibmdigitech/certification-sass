import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { InspectionReportService } from '@/lib/services';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { stepId } = await params;
    const body = await request.json();
    const { status, completedBy, notes } = body;

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
