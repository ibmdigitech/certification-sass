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
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const certificateNumber = searchParams.get('certificateNumber') ?? undefined;
    const holderName = searchParams.get('holderName') ?? undefined;
    const jobNumber = searchParams.get('jobNumber') ?? undefined;
    const salesPerson = searchParams.get('salesPerson') ?? undefined;
    const paymentMethod = searchParams.get('paymentMethod') ?? undefined;
    const printedBy = searchParams.get('printedBy') ?? undefined;
    const dateFrom = searchParams.get('dateFrom') ?? undefined;
    const dateTo = searchParams.get('dateTo') ?? undefined;
    const status = searchParams.get('status') ?? undefined;

    const where: Record<string, unknown> = { companyId };

    // Build complex where clause with relations
    if (certificateNumber) {
      where.certificate = { number: { contains: certificateNumber, mode: 'insensitive' } };
    }
    if (holderName) {
      where.certificate = { ...(where.certificate as object), holderName: { contains: holderName, mode: 'insensitive' } };
    }
    if (jobNumber) {
      where.certificate = { ...(where.certificate as object), job: { jobNumber: { contains: jobNumber, mode: 'insensitive' } } };
    }
    if (salesPerson) {
      where.certificate = { ...(where.certificate as object), job: { engineer: { name: { contains: salesPerson, mode: 'insensitive' } } } };
    }
    if (printedBy) {
      where.user = { name: { contains: printedBy, mode: 'insensitive' } };
    }
    if (paymentMethod) {
      where.certificate = { ...(where.certificate as object), job: { payments: { some: { method: { equals: paymentMethod, mode: 'insensitive' } } } } };
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Record<string, Date>).lte = new Date(dateTo);
    }
    if (status) {
      where.status = status;
    }

    const [logs, total] = await Promise.all([
      (prisma as any).deliveryLog.findMany({
        where,
        include: {
          certificate: {
            include: {
              job: {
                include: {
                  customer: { select: { name: true, customerNumber: true } },
                  engineer: { select: { id: true, name: true, email: true } },
                  inspector: { select: { id: true, name: true, email: true } },
                  location: { select: { id: true, name: true, code: true } },
                  payments: { select: { method: true, amount: true, status: true } },
                },
              },
              course: { select: { title: true, code: true } },
              inspection: { select: { id: true, scheduledDate: true, status: true } },
            },
          },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).deliveryLog.count({ where }),
    ]);

    // Transform data for frontend
    const transformedLogs = logs.map(log => ({
      id: log.id,
      certificateNumber: log.certificate?.number,
      certificateType: log.certificate?.certificateType,
      holderName: log.certificate?.holderName,
      holderCompany: log.certificate?.holderCompany,
      course: log.certificate?.course?.title,
      courseCode: log.certificate?.course?.code,
      inspectionDate: log.certificate?.inspection?.scheduledDate,
      jobNumber: log.certificate?.job?.jobNumber,
      customerName: log.certificate?.job?.customer?.name,
      customerNumber: log.certificate?.job?.customer?.customerNumber,
      salesPerson: log.certificate?.job?.engineer?.name,
      salesPersonEmail: log.certificate?.job?.engineer?.email,
      inspector: log.certificate?.job?.inspector?.name,
      location: log.certificate?.job?.location?.name,
      locationCode: log.certificate?.job?.location?.code,
      paymentMethod: log.certificate?.job?.payments?.[0]?.method,
      paymentAmount: log.certificate?.job?.payments?.[0]?.amount,
      paymentStatus: log.certificate?.job?.payments?.[0]?.status,
      printedBy: log.user?.name,
      printedByEmail: log.user?.email,
      deliveryDate: log.deliveryDate,
      method: log.method,
      status: log.status,
      notes: log.notes,
      createdAt: log.createdAt,
    }));

    return NextResponse.json({
      logs: transformedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching delivery logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}