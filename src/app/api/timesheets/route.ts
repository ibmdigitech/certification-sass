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
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
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

    const timesheet = await TimesheetService.create({
      companyId: session.user.companyId,
      userId: body.userId || session.user.id,
      jobId: body.jobId ? Number(body.jobId) : undefined,
      jobServiceId: body.jobServiceId ? Number(body.jobServiceId) : undefined,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      breakMinutes: body.breakMinutes,
      description: body.description,
    });

    return NextResponse.json(timesheet, { status: 201 });
  } catch (error) {
    console.error('Error creating timesheet:', error);
    const message = error instanceof Error ? error.message : 'Failed to create timesheet';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
