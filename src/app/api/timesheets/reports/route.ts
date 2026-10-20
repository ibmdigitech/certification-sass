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

    const summary = await TimesheetService.getSummary(session.user.companyId);

    const statuses = searchParams.get('statuses')
      ? searchParams.get('statuses')!.split(',')
      : undefined;

    const result = await TimesheetService.list({
      companyId: session.user.companyId,
      statuses,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      engineerId: searchParams.get('engineerId') ? Number(searchParams.get('engineerId')) : undefined,
      customerId: searchParams.get('customerId') ? Number(searchParams.get('customerId')) : undefined,
      page: Number(searchParams.get('page') || '1'),
      pageSize: Number(searchParams.get('pageSize') || '50'),
    });

    return NextResponse.json({
      summary,
      timesheets: result.timesheets,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error('Error fetching timesheet summary:', error);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
