import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TimesheetService } from '@/lib/services/timesheet.service';
import type { TimesheetEquipmentItemInput } from '@/lib/services/timesheet.service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;
    const equipmentItemId = Number(itemId);
    const body = await request.json();

    const input: TimesheetEquipmentItemInput = {
      equipmentId: body.equipmentId ? Number(body.equipmentId) : undefined,
      equipmentType: body.equipmentType,
      equipmentDescription: body.equipmentDescription,
      manufacturer: body.manufacturer,
      model: body.model,
      serialNumber: body.serialNumber,
      equipmentCode: body.equipmentCode,
      quantity: body.quantity,
      inspectionResult: body.inspectionResult,
      inspectionDate: body.inspectionDate,
      remarks: body.remarks,
      certificateStatus: body.certificateStatus,
      reportStatus: body.reportStatus,
    };

    const item = await TimesheetService.updateEquipmentItem(equipmentItemId, session.user.companyId, input);

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating equipment item:', error);
    const message = error instanceof Error ? error.message : 'Failed to update equipment item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await params;
    const equipmentItemId = Number(itemId);

    await TimesheetService.deleteEquipmentItem(equipmentItemId, session.user.companyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting equipment item:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete equipment item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
