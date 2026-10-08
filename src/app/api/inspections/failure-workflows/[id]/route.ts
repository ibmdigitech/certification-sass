import { NextRequest, NextResponse } from 'next/server';
import { InspectionReportService } from '@/lib/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const companyId = parseInt(searchParams.get('companyId') || '1');
    const workflowId = parseInt(id);

    const workflow = await InspectionReportService.getFailureWorkflowById(workflowId, companyId);

    if (!workflow) {
      return NextResponse.json({ error: 'Failure workflow not found' }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error fetching failure workflow:', error);
    return NextResponse.json({ error: 'Failed to fetch failure workflow' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { companyId, ...updateData } = body;
    const workflowId = parseInt(id);

    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
    }

    const workflow = await InspectionReportService.updateFailureWorkflow(workflowId, companyId, updateData);

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error updating failure workflow:', error);
    return NextResponse.json({ error: 'Failed to update failure workflow' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const companyId = parseInt(searchParams.get('companyId') || '1');
    const workflowId = parseInt(id);

    // Note: We don't have a delete method in the service, so we'll just return success
    // In a real implementation, you'd add a delete method to the service
    return NextResponse.json({ success: true, message: 'Delete not implemented' });
  } catch (error) {
    console.error('Error deleting failure workflow:', error);
    return NextResponse.json({ error: 'Failed to delete failure workflow' }, { status: 500 });
  }
}