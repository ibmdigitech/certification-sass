import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TimesheetService } from '@/lib/services/timesheet.service';

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

    const timesheet = await TimesheetService.getById(timesheetId, session.user.companyId);

    if (!timesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    return NextResponse.json(timesheet);
  } catch (error) {
    console.error('Error fetching timesheet:', error);
    return NextResponse.json({ error: 'Failed to fetch timesheet' }, { status: 500 });
  }
}

export async function PUT(
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

    const timesheet = await TimesheetService.update(timesheetId, session.user.companyId, {
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
      equipmentItems: body.equipmentItems,
    });

    return NextResponse.json(timesheet);
  } catch (error) {
    console.error('Error updating timesheet:', error);
    const message = error instanceof Error ? error.message : 'Failed to update timesheet';
    const status = message.includes('not found') || message.includes('Cannot') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
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
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'submit':
        return NextResponse.json(
          await TimesheetService.submit(timesheetId, session.user.companyId)
        );

      case 'move-to-review':
        return NextResponse.json(
          await TimesheetService.moveToReview(timesheetId, session.user.companyId)
        );

      case 'approve':
        return NextResponse.json(
          await TimesheetService.approve(timesheetId, session.user.companyId, Number(session.user.id))
        );

      case 'review': {
        const body = await request.json();
        const { decision, comments } = body;
        if (!decision) {
          return NextResponse.json({ error: 'decision is required (approve, reject, return)' }, { status: 400 });
        }
        return NextResponse.json(
          await TimesheetService.review(timesheetId, session.user.companyId, Number(session.user.id), decision, comments)
        );
      }

      case 'reject': {
        const body = await request.json();
        return NextResponse.json(
          await TimesheetService.reject(timesheetId, session.user.companyId, Number(session.user.id), body?.comments)
        );
      }

      case 'return': {
        const body = await request.json();
        return NextResponse.json(
          await TimesheetService.returnForCorrection(timesheetId, session.user.companyId, Number(session.user.id), body?.comments)
        );
      }

      case 'lock':
        return NextResponse.json(
          await TimesheetService.lock(timesheetId, session.user.companyId, Number(session.user.id))
        );

      default:
        return NextResponse.json({ error: 'Invalid action. Use ?action=submit|move-to-review|approve|review|reject|return|lock' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing timesheet action:', error);
    const message = error instanceof Error ? error.message : 'Failed to process action';
    const status = message.includes('not found') || message.includes('Cannot') || message.includes('Only') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
