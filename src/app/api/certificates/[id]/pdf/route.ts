import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PDFGenerationService } from '@/lib/services/certificate/pdf-generation.service';
import { QRCodeService } from '@/lib/services/certificate/qr-code.service';

/**
 * GET /api/certificates/[id]/pdf
 * Streams or generates on-demand the certificate PDF buffer.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const certificateId = parseInt(id, 10);
    if (isNaN(certificateId)) {
      return NextResponse.json({ error: 'Invalid certificate ID' }, { status: 400 });
    }

    const certificate = await prisma.certificate.findFirst({
      where: { id: certificateId, companyId: session.user.companyId },
      select: { id: true, number: true, pdfUrl: true },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    let pdfBuffer: Buffer;

    if (certificate.pdfUrl && certificate.pdfUrl.startsWith('data:application/pdf;base64,')) {
      const base64Data = certificate.pdfUrl.replace('data:application/pdf;base64,', '');
      pdfBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Generate on-demand if pdfUrl not pre-rendered
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
      const generated = await PDFGenerationService.generateCertificateFromDB(
        certificateId,
        'default',
        baseUrl,
        { includeQRCode: true, includeDigitalSignature: true, outputFormat: 'buffer' }
      );
      pdfBuffer = generated as Buffer;

      // Cache base64 back to database asynchronously
      const base64Data = pdfBuffer.toString('base64');
      prisma.certificate.update({
        where: { id: certificateId },
        data: { pdfUrl: `data:application/pdf;base64,${base64Data}` },
      }).catch(err => console.error('Failed to cache generated PDF URL:', err));
    }

    // Record print / download event
    if (session.user.id) {
      prisma.deliveryLog.create({
        data: {
          companyId: session.user.companyId,
          certificateId,
          userId: Number(session.user.id),
          deliveryDate: new Date(),
          method: 'DOWNLOAD',
          status: 'PRINTED',
        },
      }).catch(err => console.error('Failed to log print event:', err));
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${certificate.number}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating/downloading certificate PDF:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to download certificate PDF' },
      { status: 500 }
    );
  }
}
