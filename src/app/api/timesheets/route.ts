import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TimesheetService } from '@/lib/services/timesheet.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const result = await TimesheetService.list({
      companyId: session.user.companyId,
      userId: searchParams.get('userId') ? Number(searchParams.get('userId')) : undefined,
      jobId: searchParams.get('jobId') ? Number(searchParams.get('jobId')) : undefined,
      jobNumber: searchParams.get('jobNumber') || undefined,
      status: searchParams.get('status') || undefined,
      statuses: searchParams.get('statuses')
        ? searchParams.get('statuses')!.split(',')
        : undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      engineerId: searchParams.get('engineerId') ? Number(searchParams.get('engineerId')) : undefined,
      customerId: searchParams.get('customerId') ? Number(searchParams.get('customerId')) : undefined,
      equipmentType: searchParams.get('equipmentType') || undefined,
      inspectionResult: searchParams.get('inspectionResult') || undefined,
      timesheetType: searchParams.get('timesheetType') || undefined,
      timesheetNumber: searchParams.get('timesheetNumber') || undefined,
      page: Number(searchParams.get('page') || '1'),
      pageSize: Number(searchParams.get('pageSize') || '20'),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    return NextResponse.json({ error: 'Failed to fetch timesheets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.date || !body.startTime || !body.endTime) {
      return NextResponse.json({ error: 'date, startTime, and endTime are required' }, { status: 400 });
    }

    // Duplicate prevention
    if (body.jobId) {
      const isDuplicate = await TimesheetService.checkDuplicate(
        Number(body.jobId),
        body.userId || session.user.id,
        session.user.companyId,
        new Date(body.date)
      );
      if (isDuplicate) {
        return NextResponse.json({ error: 'A timesheet for this job, engineer, and date already exists' }, { status: 409 });
      }
    }

    const timesheet = await TimesheetService.create({
      companyId: session.user.companyId,
      userId: body.userId || session.user.id,
      jobId: body.jobId ? Number(body.jobId) : undefined,
      jobServiceId: body.jobServiceId ? Number(body.jobServiceId) : undefined,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      breakMinutes: body.breakMinutes,
      travelTimeMinutes: body.travelTimeMinutes,
      additionalWork: body.additionalWork,
      workCompletionStatus: body.workCompletionStatus,
      inspectionResult: body.inspectionResult,
      workLocation: body.workLocation,
      description: body.description,
      timesheetType: body.timesheetType || 'INSPECTION',
      equipmentItems: body.equipmentItems || [],
    });

    return NextResponse.json(timesheet, { status: 201 });
  } catch (error) {
    console.error('Error creating timesheet:', error);
    const message = error instanceof Error ? error.message : 'Failed to create timesheet';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
