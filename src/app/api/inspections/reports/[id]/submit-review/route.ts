import { NextRequest, NextResponse } from 'next/server';
import { InspectionReportService } from '@/lib/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { companyId, reviewedBy } = body;
    const reportId = parseInt(id);

    if (!companyId || !reviewedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const report = await InspectionReportService.submitForReview(reportId, companyId, reviewedBy);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error submitting report for review:', error);
    return NextResponse.json({ error: 'Failed to submit report for review' }, { status: 500 });
  }
}