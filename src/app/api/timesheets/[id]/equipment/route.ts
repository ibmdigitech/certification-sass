import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TimesheetService } from '@/lib/services/timesheet.service';
import type { TimesheetEquipmentItemInput } from '@/lib/services/timesheet.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const timesheetId = Number(id);

    const items = await TimesheetService.getEquipmentItems(timesheetId, session.user.companyId);

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching equipment items:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch equipment items';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const timesheetId = Number(id);
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

    const item = await TimesheetService.addEquipmentItem(timesheetId, session.user.companyId, input);

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error adding equipment item:', error);
    const message = error instanceof Error ? error.message : 'Failed to add equipment item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
