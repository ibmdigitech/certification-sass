import { NextRequest, NextResponse } from 'next/server';
import { InspectionReportService } from '@/lib/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { companyId, stepNumber, title, description, assignedTo } = body;
    const workflowId = parseInt(id);

    if (!companyId || !stepNumber || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const step = await InspectionReportService.addFailureWorkflowStep({
      companyId,
      workflowId,
      stepNumber,
      title,
      description,
      assignedTo,
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error('Error adding failure workflow step:', error);
    return NextResponse.json({ error: 'Failed to add failure workflow step' }, { status: 500 });
  }
}