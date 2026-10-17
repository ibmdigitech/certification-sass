import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { JobServiceType } from '@prisma/client';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;

    const quotations = await prisma.salesQuotation.findMany({
      where: { companyId },
      include: {
        customer: { select: { id: true, name: true, contact: true } },
        salesPerson: { select: { id: true, name: true } },
        items: true,
        convertedJob: { select: { id: true, jobNumber: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ quotations });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
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

    const { inquiryId, customerId, salesPersonId, title, items, action, quotationId } = body;

    // Validate customer belongs to the authenticated tenant
    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: Number(customerId), companyId },
      });
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found or not accessible' }, { status: 404 });
      }
    }

    // Handle Quotation to Job conversion action
    if (action === 'convert_to_job' && quotationId) {
      const jobResult = await prisma.$transaction(async (tx) => {
        const q = await tx.salesQuotation.findUnique({
          where: { id: Number(quotationId), companyId },
          include: { items: true, customer: { include: { sites: true } } },
        });

        if (!q) throw new Error('Quotation not found');

        // Idempotency: return existing job if already converted
        if (q.convertedJobId) {
          const existingJob = await tx.job.findUnique({
            where: { id: q.convertedJobId },
          });
          return existingJob;
        }

        const count = await tx.job.count({ where: { companyId: q.companyId } });
        const jobNumber = `TSC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
        const primarySiteId = q.customer?.sites?.[0]?.id ?? null;

        const newJob = await tx.job.create({
          data: {
            companyId: q.companyId,
            customerId: q.customerId,
            jobNumber,
            status: 'PLANNED',
            scope: q.title,
            quotationId: q.quotationNumber,
            customerReference: `Approved QT #${q.quotationNumber}`,
            siteId: primarySiteId,
            jobServices: {
              create: q.items.map((item: any) => ({
                companyId: q.companyId,
                serviceType: item.serviceType === 'TRAINING' ? JobServiceType.TRAINING : JobServiceType.INSPECTION,
                serviceCode: item.serviceType === 'TRAINING' ? 'TRN-SRV' : 'INS-SRV',
                description: item.description,
                status: 'PLANNED',
              })),
            },
          },
        });

        await tx.salesQuotation.update({
          where: { id: q.id },
          data: {
            convertedJobId: newJob.id,
            status: 'CONVERTED',
          },
        });

        return newJob;
      });

      return NextResponse.json({ success: true, job: jobResult });
    }

    // Otherwise create quotation
    const count = await prisma.salesQuotation.count({ where: { companyId } });
    const quotationNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let subtotal = 0;
    const quotationItems = (items || []).map((it: any) => {
      const total = Number(it.quantity || 1) * Number(it.unitPrice || 0);
      subtotal += total;
      return {
        serviceType: it.serviceType || 'INSPECTION',
        description: it.description,
        quantity: Number(it.quantity || 1),
        unitPrice: Number(it.unitPrice || 0),
        totalPrice: total,
      };
    });

    const taxAmount = subtotal * 0.05;
    const totalAmount = subtotal + taxAmount;

    const newQuotation = await prisma.salesQuotation.create({
      data: {
        companyId,
        quotationNumber,
        inquiryId: inquiryId ? Number(inquiryId) : null,
        customerId: Number(customerId),
        salesPersonId: salesPersonId ? Number(salesPersonId) : null,
        title: title || 'Service Quotation',
        status: 'APPROVED',
        subtotal,
        taxRate: 5.0,
        taxAmount,
        totalAmount,
        items: {
          create: quotationItems,
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ quotation: newQuotation }, { status: 201 });
  } catch (error: any) {
    console.error('Error in quotations API:', error);
    return NextResponse.json({ error: error.message || 'Failed to process quotation' }, { status: 500 });
  }
}
