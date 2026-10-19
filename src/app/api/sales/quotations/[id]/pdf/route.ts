import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QuotationPDFService } from '@/lib/services/quotation-pdf.service';

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
    const quotationId = parseInt(id);

    if (isNaN(quotationId)) {
      return NextResponse.json({ error: 'Invalid quotation ID' }, { status: 400 });
    }

    const pdfBuffer = await QuotationPDFService.generateQuotationPDF(quotationId, companyId, 'buffer');

    return new NextResponse(new Uint8Array(pdfBuffer as Buffer), {
      headers: QuotationPDFService.getPDFDownloadHeaders(`quotation-${quotationId}`),
    });
  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
