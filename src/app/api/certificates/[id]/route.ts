import { NextRequest, NextResponse } from 'next/server';
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
    const companyId = 1; // Default company for testing
    const { id } = await params;
    const certificateId = parseInt(id);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    const result = await CertificateManager.getCertificateWithDetails(certificateId, companyId, baseUrl);

    if (!result) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = 1; // Default company for testing
    const { id } = await params;
    const certificateId = parseInt(id);
    const body = await request.json();
    const { action, reason, newExpiryDate } = body;

    const validActions = ['issue', 'revoke', 'expire', 'renew', 'reissue', 'archive'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await BulkCertificateService.performLifecycleAction({
      certificateId,
      action,
      reason,
      performedBy: 'System',
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
    const companyId = 1; // Default company for testing
    const { id } = await params;
    const certificateId = parseInt(id);

    await BulkCertificateService.performLifecycleAction({
      certificateId,
      action: 'archive',
      performedBy: 'System',
      reason: 'Certificate deleted via API',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}