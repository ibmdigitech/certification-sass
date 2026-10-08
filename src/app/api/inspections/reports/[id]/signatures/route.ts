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
    const reportId = parseInt(id);

    const signatures = await InspectionReportService.getSignatures(reportId, companyId);

    return NextResponse.json(signatures);
  } catch (error) {
    console.error('Error fetching signatures:', error);
    return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { companyId, userId, role, signatureData, ipAddress, userAgent } = body;
    const reportId = parseInt(id);

    if (!companyId || !userId || !role || !signatureData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const signature = await InspectionReportService.addSignature({
      companyId,
      reportId,
      userId,
      role,
      signatureData,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(signature, { status: 201 });
  } catch (error) {
    console.error('Error adding signature:', error);
    return NextResponse.json({ error: 'Failed to add signature' }, { status: 500 });
  }
}