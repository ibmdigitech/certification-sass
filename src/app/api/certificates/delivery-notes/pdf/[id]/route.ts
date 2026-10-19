import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DeliveryNotePDFService } from '@/lib/services/delivery-note-pdf.service';

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
    const noteId = parseInt(id);

    if (isNaN(noteId)) {
      return NextResponse.json({ error: 'Invalid delivery note ID' }, { status: 400 });
    }

    const pdfBuffer = await DeliveryNotePDFService.generateDeliveryNotePDF(noteId, companyId, 'buffer');

    return new NextResponse(new Uint8Array(pdfBuffer as Buffer), {
      headers: DeliveryNotePDFService.getPDFDownloadHeaders(`delivery-note-${noteId}`),
    });
  } catch (error) {
    console.error('Error generating delivery note PDF:', error);
    if (error instanceof Error && error.message === 'Delivery note not found') {
      return NextResponse.json({ error: 'Delivery note not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
