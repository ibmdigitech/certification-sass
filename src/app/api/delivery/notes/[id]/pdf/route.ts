import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DeliveryNotePDFService } from '@/lib/services/delivery-note-pdf.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const noteId = parseInt(params.id, 10);
    if (isNaN(noteId)) {
      return NextResponse.json({ error: 'Invalid delivery note ID' }, { status: 400 });
    }

    const pdfBuffer = (await DeliveryNotePDFService.generateDeliveryNotePDF(
      noteId,
      session.user.companyId,
      'buffer'
    )) as Buffer;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="DN-${noteId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error rendering Delivery Note PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
