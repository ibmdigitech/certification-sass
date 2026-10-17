import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CertificateManager } from '@/lib/services/certificate/certificate-manager';
import { CertificateService } from '@/lib/services/certificate.service';
import { PDFGenerationService } from '@/lib/services/certificate/pdf-generation.service';
import { QRCodeService } from '@/lib/services/certificate/qr-code.service';
import { DigitalSignatureService } from '@/lib/services/certificate/digital-signature.service';
import { VerificationService } from '@/lib/services/certificate/verification.service';
import { BulkCertificateService } from '@/lib/services/certificate/bulk-certificate.service';

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
    const certificateId = parseInt(id);

    if (isNaN(certificateId)) {
      return NextResponse.json({ error: 'Invalid certificate ID' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    const result = await CertificateManager.getCertificateWithDetails(certificateId, companyId, baseUrl);

    if (!result) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const performedBy = session.user.name || session.user.email || 'System';
    const { id } = await params;
    const certificateId = parseInt(id);
    const body = await request.json();
    const { action, reason, newExpiryDate } = body;

    if (isNaN(certificateId)) {
      return NextResponse.json({ error: 'Invalid certificate ID' }, { status: 400 });
    }

    const validActions = ['issue', 'revoke', 'expire', 'renew', 'reissue', 'archive'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await BulkCertificateService.performLifecycleAction({
      certificateId,
      companyId,
      action,
      reason,
      performedBy,
      newExpiryDate: newExpiryDate ? new Date(newExpiryDate) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating certificate:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const performedBy = session.user.name || session.user.email || 'System';
    const { id } = await params;
    const certificateId = parseInt(id);

    if (isNaN(certificateId)) {
      return NextResponse.json({ error: 'Invalid certificate ID' }, { status: 400 });
    }

    await BulkCertificateService.performLifecycleAction({
      certificateId,
      companyId,
      action: 'archive',
      performedBy,
      reason: 'Certificate deleted via API',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
