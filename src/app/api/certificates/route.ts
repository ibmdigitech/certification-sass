import { NextRequest, NextResponse } from 'next/server';
import { CertificateManager } from '@/lib/services/certificate/certificate-manager';
import { CertificateService } from '@/lib/services/certificate.service';

export async function GET(request: NextRequest) {
  try {
    const companyId = 1; // Default company for testing

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const jobId = searchParams.get('jobId') ? parseInt(searchParams.get('jobId')!) : undefined;
    const status = searchParams.get('status') ?? undefined;
    const query = searchParams.get('q') ?? undefined;

    let result;
    if (query) {
      result = await CertificateManager.searchCertificates(companyId, query, { status, jobId, page, limit });
    } else {
      result = await CertificateService.listCertificates(companyId, { jobId, status, page, limit });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = 1; // Default company for testing
    const body = await request.json();

    const { jobId, traineeId, complianceAuthority, templateId, generatePDF, generateQRCode, generateSignature, status } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const result = await CertificateManager.createCompleteCertificate({
      companyId,
      jobId,
      traineeId: traineeId ?? 0,
      complianceAuthority,
      templateId,
      generatePDF,
      generateQRCode,
      generateSignature,
      status,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating certificate:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}