import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { InvoicePDFService } from '@/lib/services/invoice-pdf.service';

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
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    const pdfBuffer = await InvoicePDFService.generateInvoicePDF(invoiceId, companyId, 'buffer');

    return new NextResponse(new Uint8Array(pdfBuffer as Buffer), {
      headers: InvoicePDFService.getPDFDownloadHeaders(`invoice-${invoiceId}`),
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    if (error instanceof Error && error.message === 'Invoice not found') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
