import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { VerificationService } from '@/lib/services/certificate/verification.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const verifiedBy = session.user.name || session.user.email || 'System';

    const body = await request.json();
    const { certificateNumber, method = 'api', notes } = body;

    if (!certificateNumber) {
      return NextResponse.json({ error: 'Certificate number is required' }, { status: 400 });
    }

    const result = await VerificationService.verifyCertificate({
      certificateNumber,
      companyId,
      verifiedBy,
      method,
      notes,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('certificateId') ? parseInt(searchParams.get('certificateId')!) : undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const method = searchParams.get('method') ?? undefined;
    const format = searchParams.get('format') ?? 'json';

    if (certificateId) {
      const history = await VerificationService.getVerificationHistory(certificateId, companyId);
      return NextResponse.json(history);
    }

    if (format === 'csv') {
      const report = await VerificationService.generateVerificationReport(companyId, { startDate, endDate, format: 'csv' }) as string;
      return new NextResponse(report, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="verification-report-${Date.now()}.csv"`,
        },
      });
    }

    const stats = await VerificationService.getVerificationStats(companyId, { startDate, endDate, method });
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching verification data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}