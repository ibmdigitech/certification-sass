import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;

    const inquiries = await prisma.salesInquiry.findMany({
      where: { companyId },
      include: {
        customer: { select: { id: true, name: true, contact: true } },
        salesPerson: { select: { id: true, name: true } },
        _count: { select: { quotations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('Error fetching sales inquiries:', error);
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
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

    const { customerId, salesPersonId, subject, scope, source } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { id: Number(customerId), companyId },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found or not accessible' }, { status: 404 });
    }

    const count = await prisma.salesInquiry.count({ where: { companyId } });
    const inquiryNumber = `INQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const newInquiry = await prisma.salesInquiry.create({
      data: {
        companyId,
        inquiryNumber,
        customerId: Number(customerId),
        salesPersonId: salesPersonId ? Number(salesPersonId) : null,
        subject,
        scope,
        source: source || 'Direct',
        status: 'NEW',
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json({ inquiry: newInquiry }, { status: 201 });
  } catch (error) {
    console.error('Error creating sales inquiry:', error);
    return NextResponse.json({ error: 'Failed to create inquiry' }, { status: 500 });
  }
}
