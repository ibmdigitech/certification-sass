import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { InspectionReportService } from '@/lib/services';

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { id } = await params;
    const body = await request.json();
    const { ...updateData } = body;
    const workflowId = parseInt(id);

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { id } = await params;
    const workflowId = parseInt(id);

    return NextResponse.json({ success: true, message: 'Delete not implemented' });
  } catch (error) {
    console.error('Error deleting failure workflow:', error);
    return NextResponse.json({ error: 'Failed to delete failure workflow' }, { status: 500 });
  }
}
