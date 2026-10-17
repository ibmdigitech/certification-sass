import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const userId = Number(session.user.id) || 0;
    const body = await request.json();

    const { sourceCustomerId, targetCustomerId } = body;

    if (!sourceCustomerId || !targetCustomerId) {
      return NextResponse.json({ error: 'Both Source and Target customers are required' }, { status: 400 });
    }

    if (Number(sourceCustomerId) === Number(targetCustomerId)) {
      return NextResponse.json({ error: 'Cannot merge a customer into itself' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const src = await tx.customer.findUnique({
        where: { id: Number(sourceCustomerId) },
        include: { _count: { select: { sites: true, assets: true, jobs: true } } },
      });

      const tgt = await tx.customer.findUnique({
        where: { id: Number(targetCustomerId) },
      });

      if (!src || !tgt) {
        throw new Error('Customer record not found');
      }

      if (src.companyId !== companyId || tgt.companyId !== companyId) {
        throw new Error('Tenant isolation mismatch');
      }

      // Reassign sites
      const sitesMoved = await tx.customerSite.updateMany({
        where: { customerId: src.id },
        data: { customerId: tgt.id },
      });

      // Reassign assets
      const assetsMoved = await tx.customerAsset.updateMany({
        where: { customerId: src.id },
        data: { customerId: tgt.id },
      });

      // Reassign jobs
      const jobsMoved = await tx.job.updateMany({
        where: { customerId: src.id },
        data: { customerId: tgt.id },
      });

      // Reassign inquiries
      if (tx.salesInquiry) {
        await tx.salesInquiry.updateMany({
          where: { customerId: src.id },
          data: { customerId: tgt.id },
        });
      }

      // Reassign quotations
      if (tx.salesQuotation) {
        await tx.salesQuotation.updateMany({
          where: { customerId: src.id },
          data: { customerId: tgt.id },
        });
      }

      // Archive source customer
      await tx.customer.update({
        where: { id: src.id },
        data: {
          status: 'merged_archived',
        },
      });

      // Write Immutable Audit Log
      await tx.auditLog.create({
        data: {
          companyId,
          userId: Number(userId),
          action: 'CUSTOMER_MERGE',
          entityType: 'Customer',
          entityId: src.id,
          tenantId: companyId,
          previousValue: { id: src.id, name: src.name, status: src.status },
          newValue: {
            mergedIntoCustomerId: tgt.id,
            targetName: tgt.name,
            sitesMoved: sitesMoved.count,
            assetsMoved: assetsMoved.count,
            jobsMoved: jobsMoved.count,
          },
        },
      });

      return {
        success: true,
        sourceName: src.name || src.contact,
        targetName: tgt.name || tgt.contact,
        sitesMoved: sitesMoved.count,
        assetsMoved: assetsMoved.count,
        jobsMoved: jobsMoved.count,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error executing customer merge:', error);
    return NextResponse.json({ error: error.message || 'Customer merge failed' }, { status: 500 });
  }
}
