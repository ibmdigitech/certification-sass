import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BulkCertificateService } from '@/lib/services/certificate/bulk-certificate.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const performedBy = session.user.name || session.user.email || 'System';
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create': {
        const { jobId, traineeIds, complianceAuthority, templateId, generatePDF, generateQRCode, generateSignature, status } = data;

        if (!jobId || !traineeIds || !Array.isArray(traineeIds)) {
          return NextResponse.json({ error: 'Job ID and trainee IDs array are required' }, { status: 400 });
        }

        const result = await BulkCertificateService.bulkCreateCertificates({
          companyId,
          jobId,
          traineeIds,
          complianceAuthority,
          templateId,
          generatePDF,
          generateQRCode,
          generateSignature,
          status,
        });

        return NextResponse.json(result);
      }

      case 'generate-pdfs': {
        const { certificateIds, templateId } = data;

        if (!certificateIds || !Array.isArray(certificateIds)) {
          return NextResponse.json({ error: 'Certificate IDs array is required' }, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
        const result = await BulkCertificateService.bulkGeneratePDFs(certificateIds, templateId ?? 'default', baseUrl);

        return NextResponse.json(result);
      }

      case 'generate-qrcodes': {
        const { certificateIds } = data;

        if (!certificateIds || !Array.isArray(certificateIds)) {
          return NextResponse.json({ error: 'Certificate IDs array is required' }, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
        const result = await BulkCertificateService.bulkGenerateQRCodes(certificateIds, baseUrl);

        return NextResponse.json(result);
      }

      case 'sign': {
        const { certificateIds } = data;

        if (!certificateIds || !Array.isArray(certificateIds)) {
          return NextResponse.json({ error: 'Certificate IDs array is required' }, { status: 400 });
        }

        const result = await BulkCertificateService.bulkSignCertificates(certificateIds);

        return NextResponse.json(result);
      }

      case 'lifecycle': {
        const { actions } = data;

        if (!actions || !Array.isArray(actions)) {
          return NextResponse.json({ error: 'Actions array is required' }, { status: 400 });
        }

        const lifecycleActions = actions.map((a: { certificateId: number; action: 'issue' | 'revoke' | 'expire' | 'renew' | 'reissue' | 'archive'; reason?: string; newExpiryDate?: string }) => ({
          certificateId: a.certificateId,
          companyId,
          action: a.action,
          reason: a.reason,
          performedBy,
          newExpiryDate: a.newExpiryDate ? new Date(a.newExpiryDate) : undefined,
        }));

        const result = await BulkCertificateService.bulkLifecycleAction(lifecycleActions);

        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Invalid bulk action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in bulk certificate operation:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
