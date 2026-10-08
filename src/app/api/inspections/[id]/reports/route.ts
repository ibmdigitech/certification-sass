import { NextRequest, NextResponse } from 'next/server';
import { InspectionReportService } from '@/lib/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const companyId = parseInt(searchParams.get('companyId') || '1');
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
    const { id } = await params;
    const body = await request.json();
    const { companyId, templateId, title, generatedBy, content, findings, recommendations } = body;
    const inspectionId = parseInt(id);

    if (!companyId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get inspection to find jobId
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const inspection = await prisma.inspection.findFirst({
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