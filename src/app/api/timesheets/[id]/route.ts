import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TimesheetService } from '@/lib/services/timesheet.service';

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

    case 'approve':
          return NextResponse.json(
            await TimesheetService.approve(timesheetId, session.user.companyId, Number(session.user.id))
          );

      case 'lock':
          return NextResponse.json(
            await TimesheetService.lock(timesheetId, session.user.companyId, Number(session.user.id))
          );

      default:
        return NextResponse.json({ error: 'Invalid action. Use ?action=submit|approve|lock' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing timesheet action:', error);
    const message = error instanceof Error ? error.message : 'Failed to process action';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
