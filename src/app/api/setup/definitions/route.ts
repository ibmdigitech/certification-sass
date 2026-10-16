import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { code: 'NOTE', name: 'Inspection Notes & Disclaimers' },
  { code: 'Insurer', name: 'Insurance Providers & Underwriters' },
  { code: 'Commodity', name: 'Lifting & Industrial Commodities' },
  { code: 'Units Of Measurements', name: 'Units Of Measurements (SWL / WLL / Ton / Bar)' },
  { code: 'N-Certifies', name: 'Accreditation Certification Bodies' },
  { code: 'Reason', name: 'Reschedule & Rejection Reasons' },
  { code: 'Priority', name: 'Job Order Priorities (Normal / High / Urgent)' },
  { code: 'Inquiry Route', name: 'Inquiry Lead Channels (Direct / Email / Tender)' },
  { code: 'Expiry Date Type', name: 'Certificate Expiry Policies (6M / 1Y / 2Y)' },
  { code: 'Training Team Code', name: 'Training Instructor Teams' },
  { code: 'Training Validity Date', name: 'Training Validity Periods' },
  { code: 'Training Type', name: 'Training Modalities (Classroom / Practical / E-learning)' },
  { code: 'TRAINING RESULT', name: 'Assessment Outcomes (Competent / NYC / Resit)' },
  { code: 'Training File Type', name: 'Trainee ID Documents (Emirates ID / Passport / Visa)' },
  { code: 'Documents Type', name: 'Equipment Compliance Documents' },
  { code: 'Schemes', name: 'Accredited Certification Schemes' },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const categoryCode = searchParams.get('categoryCode');

    let categories = await (prisma as any).generalDefinition.findMany({
      where: { companyId },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { items: true } },
      },
      orderBy: { code: 'asc' },
    });

    // Auto-seed defaults if empty
    if (categories.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await (prisma as any).generalDefinition.create({
          data: {
            companyId,
            code: cat.code,
            name: cat.name,
            items: {
              create: [
                { key: 'DEFAULT', value: `Standard ${cat.code} Setting`, isActive: true, sortOrder: 1 },
              ],
            },
          },
        });
      }
      categories = await (prisma as any).generalDefinition.findMany({
        where: { companyId },
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { items: true } },
        },
        orderBy: { code: 'asc' },
      });
    }

    if (categoryCode) {
      const selected = categories.find((c: any) => c.code === categoryCode);
      return NextResponse.json({ definition: selected });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching general definitions:', error);
    return NextResponse.json({ error: 'Failed to fetch definitions' }, { status: 500 });
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
    const { definitionId, key, value, sortOrder } = body;

    if (!definitionId || !key || !value) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the definition belongs to this company
    const def = await (prisma as any).generalDefinition.findFirst({
      where: { id: Number(definitionId), companyId },
      select: { id: true, code: true },
    });
    if (!def) {
      return NextResponse.json({ error: 'Definition category not found' }, { status: 404 });
    }

    // Duplicate key detection within the category
    const dup = await (prisma as any).generalDefinitionItem.findFirst({
      where: { definitionId: Number(definitionId), key: { equals: key, mode: 'insensitive' } },
      select: { id: true, key: true },
    });
    if (dup) {
      return NextResponse.json(
        { error: `Entry key "${dup.key}" already exists in ${def.code}. Use a unique key or edit the existing entry.` },
        { status: 409 }
      );
    }

    const newItem = await (prisma as any).generalDefinitionItem.create({
      data: {
        definitionId: Number(definitionId),
        key,
        value,
        isActive: true,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        userId: Number(session.user.id) || 0,
        action: 'DEFINITION_ITEM_CREATED',
        entityType: 'GeneralDefinitionItem',
        entityId: newItem.id,
        tenantId: companyId,
        newValue: { definitionId, key, value } as any,
      },
    });

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error('Error adding definition item:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
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
      return NextResponse.json({ error: 'Item id is required' }, { status: 400 });
    }

    // Verify item belongs to a definition in this company
    const item = await (prisma as any).generalDefinitionItem.findFirst({
      where: { id: Number(id) },
      include: { definition: { select: { id: true, companyId: true, code: true } } },
    });
    if (!item || item.definition.companyId !== companyId) {
      return NextResponse.json({ error: 'Definition item not found' }, { status: 404 });
    }

    // Duplicate key check (excluding self)
    if (data.key && data.key !== item.key) {
      const dup = await (prisma as any).generalDefinitionItem.findFirst({
        where: {
          definitionId: item.definitionId,
          key: { equals: data.key, mode: 'insensitive' },
          NOT: { id: Number(id) },
        },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json(
          { error: `Entry key "${data.key}" already exists in this category.` },
          { status: 409 }
        );
      }
    }

    const updated = await (prisma as any).generalDefinitionItem.update({
      where: { id: Number(id) },
      data: {
        key: data.key,
        value: data.value,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
        // Deactivation (soft) instead of deletion — in-use reference records are preserved
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        userId: Number(session.user.id) || 0,
        action: 'DEFINITION_ITEM_UPDATED',
        entityType: 'GeneralDefinitionItem',
        entityId: updated.id,
        tenantId: companyId,
        previousValue: { key: item.key },
        newValue: { key: updated.key, isActive: updated.isActive } as any,
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('Error updating definition item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}
