import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const { id } = await params;
    const body = await request.json();
    const { role, signatureData, ipAddress, userAgent } = body;
    const reportId = parseInt(id);

    if (!role || !signatureData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const signature = await InspectionReportService.addSignature({
      companyId,
      reportId,
      userId: Number(userId),
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
