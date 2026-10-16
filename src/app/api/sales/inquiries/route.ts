import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const companyId = session?.user?.companyId ?? Number(searchParams.get('companyId') || '1');

    const inquiries = await (prisma as any).salesInquiry.findMany({
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
    const body = await request.json();
    const companyId = session?.user?.companyId ?? body.companyId ?? 1;

    const { customerId, salesPersonId, subject, scope, source } = body;

    const count = await (prisma as any).salesInquiry.count({ where: { companyId } });
    const inquiryNumber = `INQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const newInquiry = await (prisma as any).salesInquiry.create({
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
