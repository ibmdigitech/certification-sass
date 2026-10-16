import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = Number(session.user.companyId);
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId') ? Number(searchParams.get('jobId')) : undefined;
    const status = searchParams.get('status') || undefined;

    const where: any = { companyId };
    if (jobId) where.jobId = jobId;
    if (status) where.status = status;

    const [payments, invoices] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              jobNumber: true,
              customer: { select: { id: true, contact: true, email: true, phone: true } },
            },
          },
          invoices: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.findMany({
        where: { companyId },
        include: {
          payment: {
            include: {
              job: {
                select: {
                  id: true,
                  jobNumber: true,
                  customer: { select: { id: true, contact: true, email: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Aggregate stats
    const totalBilled = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const paidCount = payments.filter((p) => p.status === 'PAID' || p.status === 'completed').length;
    const pendingCount = payments.filter((p) => p.status !== 'PAID' && p.status !== 'completed').length;

    return NextResponse.json({
      payments,
      invoices,
      stats: {
        totalBilled,
        paidCount,
        pendingCount,
        totalInvoices: invoices.length,
      },
    });
  } catch (error) {
    console.error('Error fetching payments & accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch financial records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = Number(session.user.companyId);
    const body = await request.json();

    if (!body.jobId || body.amount === undefined) {
      return NextResponse.json({ error: 'jobId and amount are required' }, { status: 400 });
    }

    const job = await prisma.job.findFirst({ where: { id: Number(body.jobId), companyId } });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          companyId,
          jobId: job.id,
          amount: parseFloat(body.amount),
          method: body.method || 'BANK_TRANSFER',
          status: body.status || 'PENDING',
        },
      });

      // Optionally auto-generate invoice
      if (body.createInvoice !== false) {
        const invoiceCount = await tx.invoice.count({ where: { companyId } });
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;
        await tx.invoice.create({
          data: {
            companyId,
            paymentId: p.id,
            invoiceNumber,
          },
        });
      }

      return p;
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
