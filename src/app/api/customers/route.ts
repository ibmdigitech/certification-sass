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
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '50')));

    const whereClause: Record<string, any> = { companyId };
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contact: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { trnNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      (prisma as any).customer.findMany({
        where: whereClause,
        include: {
          sites: { select: { id: true, name: true, emirate: true } },
          _count: {
            select: {
              sites: true,
              assets: true,
              jobs: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).customer.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
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

    const { name, code, contact, email, phone, address, creditTerms, trnNumber, siteName, emirate } = body;

    if (!name && !contact) {
      return NextResponse.json({ error: 'Customer name or contact is required' }, { status: 400 });
    }

    const customerName = (name || contact || '').toString().trim();

    // Duplicate detection: same company must not have an active customer with the same name, code, email, or TRN
    const existing = await (prisma as any).customer.findFirst({
      where: {
        companyId,
        OR: [
          customerName ? { name: { equals: customerName, mode: 'insensitive' } } : undefined,
          code ? { code: { equals: code, mode: 'insensitive' } } : undefined,
          email ? { email: { equals: email, mode: 'insensitive' } } : undefined,
          trnNumber ? { trnNumber: { equals: trnNumber, mode: 'insensitive' } } : undefined,
        ].filter(Boolean) as any,
      } as any,
      select: { id: true, name: true, code: true, status: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `A customer record already exists for "${existing.name || existing.code}" (ID #${existing.id}). Use the existing record or the Customers Merge tool instead of creating a duplicate.`,
          existing,
        },
        { status: 409 }
      );
    }

    const newCustomer = await (prisma as any).customer.create({
      data: {
        companyId,
        name: customerName,
        code: code || `CUST-${Date.now().toString().slice(-4)}`,
        contact,
        email,
        phone,
        address,
        creditTerms: creditTerms || '30 Days',
        trnNumber,
        status: 'active',
        sites: siteName
          ? {
              create: {
                companyId,
                name: siteName,
                emirate: emirate || 'Dubai',
              },
            }
          : undefined,
      },
      include: {
        sites: true,
      },
    });

    await (prisma as any).auditLog.create({
      data: {
        companyId,
        userId: Number(session.user.id) || 0,
        action: 'CUSTOMER_CREATED',
        entityType: 'Customer',
        entityId: newCustomer.id,
        tenantId: companyId,
        newValue: { name: newCustomer.name, code: newCustomer.code } as any,
      },
    });

    return NextResponse.json({ customer: newCustomer }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Customer id is required' }, { status: 400 });
    }

    const existing = await (prisma as any).customer.findFirst({
      where: { id: Number(id), companyId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const updated = await (prisma as any).customer.update({
      where: { id: Number(id), companyId },
      data: {
        name: data.name,
        code: data.code,
        contact: data.contact,
        email: data.email,
        phone: data.phone,
        address: data.address,
        creditTerms: data.creditTerms,
        trnNumber: data.trnNumber,
        status: data.status,
      },
      include: {
        sites: true,
        _count: { select: { sites: true, assets: true, jobs: true } },
      },
    });

    await (prisma as any).auditLog.create({
      data: {
        companyId,
        userId: Number(session.user.id) || 0,
        action: 'CUSTOMER_UPDATED',
        entityType: 'Customer',
        entityId: updated.id,
        tenantId: companyId,
        newValue: { name: updated.name, code: updated.code, status: updated.status } as any,
      },
    });

    return NextResponse.json({ customer: updated });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}
