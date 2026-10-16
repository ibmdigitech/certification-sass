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
    const status = searchParams.get('status') || undefined;

    const where: any = { companyId };
    if (status) where.status = status;

    const deliveries = await prisma.deliveryLog.findMany({
      where,
      include: {
        certificate: {
          include: {
            job: {
              select: {
                id: true,
                jobNumber: true,
                customer: { select: { id: true, contact: true, email: true, phone: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingCount = deliveries.filter((d) => d.status === 'PENDING' || !d.status).length;
    const dispatchedCount = deliveries.filter((d) => d.status === 'DISPATCHED' || d.status === 'IN_TRANSIT').length;
    const deliveredCount = deliveries.filter((d) => d.status === 'DELIVERED').length;

    return NextResponse.json({
      deliveries,
      stats: {
        total: deliveries.length,
        pendingCount,
        dispatchedCount,
        deliveredCount,
      },
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json({ error: 'Failed to fetch delivery logs' }, { status: 500 });
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

    if (!body.certificateId) {
      return NextResponse.json({ error: 'certificateId is required' }, { status: 400 });
    }

    const cert = await prisma.certificate.findFirst({
      where: { id: Number(body.certificateId), companyId },
    });
    if (!cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const delivery = await prisma.deliveryLog.create({
      data: {
        companyId,
        certificateId: cert.id,
        method: body.method || 'COURIER',
        status: body.status || 'DISPATCHED',
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : new Date(),
      },
    });

    return NextResponse.json(delivery, { status: 201 });
  } catch (error) {
    console.error('Error recording delivery log:', error);
    return NextResponse.json({ error: 'Failed to record delivery log' }, { status: 500 });
  }
}
