import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const currentUserId = Number(session.user.id);
    const collectionId = parseInt(params.id, 10);

    const collection = await (prisma as any).paymentCollection.findFirst({
      where: { id: collectionId, companyId },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection record not found' }, { status: 404 });
    }

    // Segregation of Duties Gate: Collector cannot verify their own cash handover
    if (collection.receivedBy === currentUserId) {
      return NextResponse.json(
        {
          error:
            'Financial Segregation of Duties Violation: You cannot verify a payment collection that you personally collected at site. Verification must be performed by Accounts/Finance.',
        },
        { status: 403 }
      );
    }

    const updated = await (prisma as any).paymentCollection.update({
      where: { id: collectionId },
      data: {
        status: 'VERIFIED',
        verifiedBy: currentUserId,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, collection: updated });
  } catch (error) {
    console.error('Error verifying collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
