import { NextRequest, NextResponse } from 'next/server';
import { VerificationService } from '@/lib/services/certificate/verification.service';
import { CertificateService } from '@/lib/services/certificate.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateNumber: string }> }
) {
  try {
    const { certificateNumber } = await params;

    const certificate = await CertificateService.getCertificateByNumber(certificateNumber, 0);

    if (!certificate) {
      return NextResponse.json(
        { valid: false, error: 'Certificate not found', certificateNumber },
        { status: 404 }
      );
    }

    const verification = await VerificationService.verifyCertificate({
      certificateNumber,
      verifiedBy: 'Public Verification',
      method: 'qr',
    });

    const certificateData = {
        number: certificate.number,
        jobNumber: certificate.jobNumber,
        status: certificate.status,
        complianceAuthority: certificate.complianceAuthority,
        issuedAt: certificate.createdAt,
      };

    const response = {
      valid: verification.valid,
      certificate: verification.valid ? certificateData : undefined,
      verification: {
        verifiedAt: verification.verifiedAt,
        method: verification.method,
        details: verification.details,
      },
    };

    if (!verification.valid) {
      return NextResponse.json(response, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in public verification:', error);
    return NextResponse.json(
      { valid: false, error: 'Verification failed', certificateNumber: '' },
      { status: 500 }
    );
  }
}