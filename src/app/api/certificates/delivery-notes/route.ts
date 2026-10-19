import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const url = new URL(request.url);
    const certificateId = url.searchParams.get('certificateId');
    const search = url.searchParams.get('search');

    let where: any = { companyId };

    if (certificateId) {
      where.deliveryLog = { certificateId: parseInt(certificateId) };
    }

    if (search) {
      where.noteNumber = { contains: search, mode: 'insensitive' };
    }

    const deliveryNotes = await (prisma as any).deliveryNote.findMany({
      where,
      include: {
        deliveryLog: {
          include: {
            certificate: {
              select: {
                number: true,
                jobNumber: true,
                certificateType: true,
                holderName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(deliveryNotes);
  } catch (error) {
    console.error('Error fetching delivery notes:', error);
    return NextResponse.json({ error: 'Failed to fetch delivery notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const userId = parseInt(session.user.id, 10);
    const body = await request.json();
    const { certificateId, title, description, notes, deliveryMethod } = body;

    if (!certificateId) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
    }

    const certificate = await prisma.certificate.findFirst({
      where: { id: certificateId, companyId },
      select: { id: true, number: true, jobNumber: true },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const deliveryLog = await (prisma as any).deliveryLog.create({
      data: {
        companyId,
        certificateId,
        userId,
        deliveryDate: new Date(),
        method: deliveryMethod || null,
        status: 'PENDING',
        notes: notes || null,
      },
    });

    const noteCount = await (prisma as any).deliveryNote.count({ where: { companyId } });
    const noteNumber = `DN-${new Date().getFullYear()}-${String(noteCount + 1).padStart(4, '0')}`;

    const deliveryNote = await (prisma as any).deliveryNote.create({
      data: {
        companyId,
        deliveryLogId: deliveryLog.id,
        noteNumber,
        title: title || null,
        description: description || null,
        notes: notes || null,
        status: 'PENDING',
        deliveredAt: new Date(),
      },
    });

    return NextResponse.json(deliveryNote, { status: 201 });
  } catch (error) {
    console.error('Error creating delivery note:', error);
    return NextResponse.json({ error: 'Failed to create delivery note' }, { status: 500 });
  }
}
