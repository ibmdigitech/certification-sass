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

    const collections = await (prisma as any).paymentCollection.findMany({
      where: { companyId },
      include: {
        payment: {
          include: {
            job: { select: { id: true, jobNumber: true, customer: { select: { name: true } } } },
          },
        },
        invoice: { select: { id: true, invoiceNumber: true, total: true } },
        receivedByUser: { select: { id: true, name: true } },
        verifiedByUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, collections });
  } catch (error) {
    console.error('Error fetching payment collections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const userId = Number(session.user.id);

    const body = await request.json();
    const { paymentId, invoiceId, amount, reference, evidence, notes } = body;

    if (!paymentId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const collection = await (prisma as any).paymentCollection.create({
      data: {
        companyId,
        paymentId: Number(paymentId),
        invoiceId: invoiceId ? Number(invoiceId) : null,
        amount: parseFloat(amount),
        receivedBy: userId,
        status: 'RECEIVED',
        submittedAt: new Date(),
        submittedBy: userId,
        reference: reference || null,
        evidence: evidence || null,
        notes: notes || null,
      },
      include: {
        receivedByUser: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, collection }, { status: 201 });
  } catch (error) {
    console.error('Error logging payment collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
