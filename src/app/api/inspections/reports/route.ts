import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { InspectionReportService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const body = await request.json();
    const { jobId, inspectionId, templateId, title, generatedBy, content, findings, recommendations } = body;

    if (!companyId || !jobId || !inspectionId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure companyId matches session companyId for security
    if (body.companyId && body.companyId !== companyId) {
      return NextResponse.json({ error: 'Cannot use a different tenant' }, { status: 403 });
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