import { NextRequest, NextResponse } from 'next/server';
import { InspectionReportService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = parseInt(searchParams.get('companyId') || '1');
    const jobId = searchParams.get('jobId') ? parseInt(searchParams.get('jobId')!) : undefined;
    const inspectionId = searchParams.get('inspectionId') ? parseInt(searchParams.get('inspectionId')!) : undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await InspectionReportService.listReports(companyId, {
      jobId,
      inspectionId,
      status,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, jobId, inspectionId, templateId, title, generatedBy, content, findings, recommendations } = body;

    if (!companyId || !jobId || !inspectionId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const report = await InspectionReportService.createInspectionReport({
      companyId,
      jobId,
      inspectionId,
      templateId,
      title,
      generatedBy,
      content,
      findings,
      recommendations,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}