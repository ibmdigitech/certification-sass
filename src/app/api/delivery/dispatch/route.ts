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

    // Fetch delivery logs that have bundled dispatch items
    const dispatches = await prisma.deliveryLog.findMany({
      where: { companyId },
      include: {
        certificate: {
          select: { id: true, number: true, status: true, holderName: true },
        },
        dispatchItems: {
          include: {
            certificate: {
              select: { id: true, number: true, status: true, holderName: true },
            },
          },
        },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, dispatches });
  } catch (error) {
    console.error('Error fetching delivery dispatches:', error);
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
    const { 
      certificateIds, 
      recipientName, 
      recipientPhone, 
      deliveryMethod, 
      trackingNumber, 
      notes 
    } = body;

    if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one certificate must be selected for dispatch' },
        { status: 400 }
      );
    }

    const firstCertId = Number(certificateIds[0]);

    // Create parent DeliveryLog and child DeliveryDispatchItems atomically
    const dispatch = await prisma.deliveryLog.create({
      data: {
        companyId,
        certificateId: firstCertId, // Primary reference for backward compatibility
        userId,
        method: deliveryMethod || 'HAND_DELIVERY',
        status: 'DISPATCHED',
        deliveryDate: new Date(),
        notes: [
          recipientName ? `Recipient: ${recipientName}` : '',
          recipientPhone ? `Phone: ${recipientPhone}` : '',
          trackingNumber ? `Tracking: ${trackingNumber}` : '',
          notes || '',
        ].filter(Boolean).join(' | ') || null,
        dispatchItems: {
          create: certificateIds.map((cId: number) => ({
            certificateId: Number(cId),
            itemType: 'CERTIFICATE',
            referenceNumber: `CERT-${cId}`,
          })),
        },
      },
      include: {
        dispatchItems: {
          include: { certificate: true },
        },
      },
    });

    return NextResponse.json({ success: true, dispatch }, { status: 201 });
  } catch (error) {
    console.error('Error creating multi-certificate dispatch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
