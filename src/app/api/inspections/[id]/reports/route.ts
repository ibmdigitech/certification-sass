import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { InspectionReportService } from '@/lib/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { id } = await params;
    const inspectionId = parseInt(id);

    const reports = await InspectionReportService.getReportsByInspection(inspectionId, companyId);

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports by inspection:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
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
    const companyId = session.user.companyId;
    const { id } = await params;
    const body = await request.json();
    const { templateId, title, generatedBy, content, findings, recommendations } = body;
    const inspectionId = parseInt(id);

    if (!title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get inspection to find jobId
    const inspection = await (prisma as any).inspection.findFirst({
      where: { id: inspectionId, companyId },
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    const report = await InspectionReportService.createInspectionReport({
      companyId,
      jobId: inspection.jobId,
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
    console.error('Error creating report for inspection:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}