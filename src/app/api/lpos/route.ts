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

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');

    const where: any = { companyId };
    if (customerId) where.customerId = Number(customerId);
    if (status) where.status = status;

    const lpos = await prisma.lPO.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, code: true } },
        job: { select: { id: true, jobNumber: true, type: true } },
        invoices: { select: { id: true, invoiceNumber: true, totalAmount: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, lpos });
  } catch (error) {
    console.error('Error fetching LPOs:', error);
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

    const body = await request.json();
    const { lpoNumber, customerId, jobId, amount, currency, issueDate, expiryDate, documentUrl } = body;

    if (!lpoNumber || !customerId) {
      return NextResponse.json({ error: 'LPO Number and Customer ID are required' }, { status: 400 });
    }

    const existing = await prisma.lPO.findUnique({
      where: {
        companyId_lpoNumber: {
          companyId,
          lpoNumber,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'An LPO with this number already exists for your company' }, { status: 409 });
    }

    const lpo = await prisma.lPO.create({
      data: {
        companyId,
        lpoNumber,
        customerId: Number(customerId),
        jobId: jobId ? Number(jobId) : null,
        amount: amount ? parseFloat(amount) : null,
        currency: currency || 'AED',
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        documentUrl: documentUrl || null,
        status: 'ACTIVE',
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, lpo }, { status: 201 });
  } catch (error) {
    console.error('Error creating LPO:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
