import { NextRequest, NextResponse } from 'next/server';
import { InspectionReportService } from '@/lib/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { companyId, approvedBy } = body;
    const reportId = parseInt(id);

    if (!companyId || !approvedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const report = await InspectionReportService.approveReport(reportId, companyId, approvedBy);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error approving report:', error);
    return NextResponse.json({ error: 'Failed to approve report' }, { status: 500 });
  }
}