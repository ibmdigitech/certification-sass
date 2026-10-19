import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// Default seed list for UAE Inspection Standards if none exist in DB
const DEFAULT_JOB_TYPES = [
  { code: 'TSC-EIAC-001', description: 'Working At Height Equipment', category: 'EIAC', standard: 'TSC-EIAC-SOP-001', checklistRef: 'TSC-EIAC-CHK-001', certRef: 'TSC-EIAC-REP-001', fee: 550 },
  { code: 'TSC-EIAC-002', description: 'Overhead Crane', category: 'EIAC', standard: 'TSC-EIAC-SOP-002', checklistRef: 'TSC-EIAC-CHK-002', certRef: 'TSC-EIAC-REP-002', fee: 1200 },
  { code: 'TSC-EIAC-003', description: 'Mobile Elevating Working Platform (MEWP)', category: 'EIAC', standard: 'TSC-EIAC-SOP-003', checklistRef: 'TSC-EIAC-CHK-003', certRef: 'TSC-EIAC-REP-003', fee: 850 },
  { code: 'TSC-EIAC-004', description: 'Motor Crane / Mobile Crane', category: 'EIAC', standard: 'TSC-EIAC-SOP-004', checklistRef: 'TSC-EIAC-CHK-004', certRef: 'TSC-EIAC-REP-004', fee: 1800 },
  { code: 'TSC-EIAC-005', description: 'Tower Crane', category: 'EIAC', standard: 'TSC-EIAC-SOP-005', checklistRef: 'TSC-EIAC-CHK-005', certRef: 'TSC-EIAC-REP-005', fee: 2500 },
  { code: 'TSC-EIAC-006', description: 'Air Receiver / Pressure Vessel', category: 'EIAC', standard: 'TSC-EIAC-SOP-006', checklistRef: 'TSC-EIAC-CHK-006', certRef: 'TSC-EIAC-REP-006', fee: 950 },
  { code: 'TSC-EIAC-007', description: 'Construction Hoist', category: 'EIAC', standard: 'TSC-EIAC-SOP-007', checklistRef: 'TSC-EIAC-CHK-007', certRef: 'TSC-EIAC-REP-007', fee: 1100 },
  { code: 'TSC-EIAC-008', description: 'Window Cradle / BMU', category: 'EIAC', standard: 'TSC-EIAC-SOP-008', checklistRef: 'TSC-EIAC-CHK-008', certRef: 'TSC-EIAC-REP-008', fee: 800 },
  { code: 'TSC-EIAC-009', description: 'Scaffolding Structure', category: 'EIAC', standard: 'TSC-EIAC-SOP-009', checklistRef: 'TSC-EIAC-CHK-009', certRef: 'TSC-EIAC-REP-009', fee: 750 },
  { code: 'TSC-EIAC-010', description: 'Forklift Truck', category: 'EIAC', standard: 'TSC-EIAC-SOP-010', checklistRef: 'TSC-EIAC-CHK-010', certRef: 'TSC-EIAC-REP-010', fee: 650 },
  { code: 'TSC-EIAC-011', description: 'Passenger Hoist', category: 'EIAC', standard: 'TSC-EIAC-SOP-011', checklistRef: 'TSC-EIAC-CHK-011', certRef: 'TSC-EIAC-REP-011', fee: 1300 },
  { code: 'TSC-EIAC-012', description: 'Steam Boiler', category: 'EIAC', standard: 'TSC-EIAC-SOP-012', checklistRef: 'TSC-EIAC-CHK-012', certRef: 'TSC-EIAC-REP-012', fee: 2200 },
  { code: 'TSC-EIAC-013', description: 'Escalator & Moving Walkway', category: 'EIAC', standard: 'TSC-EIAC-SOP-013', checklistRef: 'TSC-EIAC-CHK-013', certRef: 'TSC-EIAC-REP-013', fee: 1500 },
  { code: 'TSC-EIAC-014', description: 'Elevator / Lift', category: 'EIAC', standard: 'TSC-EIAC-SOP-014', checklistRef: 'TSC-EIAC-CHK-014', certRef: 'TSC-EIAC-REP-014', fee: 1400 },
  // ENAS Abu Dhabi defaults
  { code: 'TSC-ENAS-001', description: 'Mobile Crane (Abu Dhabi ENAS)', category: 'ENAS', standard: 'TSC-ENAS-SOP-001', checklistRef: 'TSC-ENAS-CHK-001', certRef: 'TSC-ENAS-REP-001', fee: 1950 },
  { code: 'TSC-ENAS-002', description: 'Overhead Crane (Abu Dhabi ENAS)', category: 'ENAS', standard: 'TSC-ENAS-SOP-002', checklistRef: 'TSC-ENAS-CHK-002', certRef: 'TSC-ENAS-REP-002', fee: 1350 },
  { code: 'TSC-ENAS-003', description: 'Forklift (Abu Dhabi ENAS)', category: 'ENAS', standard: 'TSC-ENAS-SOP-003', checklistRef: 'TSC-ENAS-CHK-003', certRef: 'TSC-ENAS-REP-003', fee: 700 },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'EIAC';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let jobTypes = await (prisma as any).jobPerformingType.findMany({
      where: { companyId, category, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { code: 'asc' },
    });

    // Auto-seed defaults if table is empty for this company
    if (jobTypes.length === 0 && !includeInactive) {
      const filteredDefaults = DEFAULT_JOB_TYPES.filter((d) => d.category === category);
      for (const item of filteredDefaults) {
await (prisma as any).jobPerformingType.create({
          data: {
            companyId,
            category: item.category,
            code: item.code,
            description: item.description,
            accreditationStandard: item.standard,
            checklistRef: item.checklistRef,
            certificateFormRef: item.certRef,
            standardFee: item.fee,
            isActive: true,
          },
        });
      }
      jobTypes = await (prisma as any).jobPerformingType.findMany({
        where: { companyId, category },
        orderBy: { code: 'asc' },
      });
    }

    return NextResponse.json({ jobTypes });
  } catch (error) {
    console.error('Error fetching job performing types:', error);
    return NextResponse.json({ error: 'Failed to fetch job performing types' }, { status: 500 });
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

    const { category, code, description, accreditationStandard, standardFee, checklistRef, certificateFormRef, subContractorAllowed, defaultValidityMonths } = body;

    if (!description) {
      return NextResponse.json({ error: 'Type description is required' }, { status: 400 });
    }

    // Duplicate code detection within company+category
    if (code) {
      const dup = await (prisma as any).jobPerformingType.findFirst({
        where: { companyId, code: { equals: code, mode: 'insensitive' } },
        select: { id: true, code: true },
      });
      if (dup) {
        return NextResponse.json(
          { error: `Job type code "${dup.code}" already exists. Reference codes must be unique per company.` },
          { status: 409 }
        );
      }
    }

    const newType = await (prisma as any).jobPerformingType.create({
      data: {
        companyId,
        category: category || 'EIAC',
        code: code || `TSC-JOB-${Date.now().toString().slice(-4)}`,
        description,
        accreditationStandard,
        standardFee: Number(standardFee) || 0,
        checklistRef,
        certificateFormRef,
        subContractorAllowed: Boolean(subContractorAllowed),
        defaultValidityMonths: Number(defaultValidityMonths) || 12,
        isActive: true,
      },
    });

    await (prisma as any).auditLog.create({
      data: {
        companyId,
        userId: Number(session.user.id) || 0,
        action: 'JOB_TYPE_CREATED',
        entityType: 'JobPerformingType',
        entityId: newType.id,
        tenantId: companyId,
        newValue: { code: newType.code, description } as any,
      },
    });

    return NextResponse.json({ jobType: newType }, { status: 201 });
  } catch (error) {
    console.error('Error creating job performing type:', error);
    return NextResponse.json({ error: 'Failed to create job type' }, { status: 500 });
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
      return NextResponse.json({ error: 'Job type id is required' }, { status: 400 });
    }

    const existing = await (prisma as any).jobPerformingType.findFirst({
      where: { id: Number(id), companyId },
      select: { id: true, code: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Job type not found' }, { status: 404 });
    }

    // If code is being changed, ensure uniqueness
    if (data.code && data.code !== existing.code) {
      const dup = await (prisma as any).jobPerformingType.findFirst({
        where: { companyId, code: { equals: data.code, mode: 'insensitive' } },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json(
          { error: `Job type code "${data.code}" already exists.` },
          { status: 409 }
        );
      }
    }

    const updated = await (prisma as any).jobPerformingType.update({
      where: { id: Number(id) },
      data: {
        code: data.code,
        description: data.description,
        category: data.category,
        accreditationStandard: data.accreditationStandard,
        standardFee: data.standardFee !== undefined ? Number(data.standardFee) : undefined,
        checklistRef: data.checklistRef,
        certificateFormRef: data.certificateFormRef,
        subContractorAllowed: data.subContractorAllowed,
        defaultValidityMonths: data.defaultValidityMonths !== undefined ? Number(data.defaultValidityMonths) : undefined,
        // Deactivation (soft) instead of deletion — in-use reference records are preserved
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      },
    });

    await (prisma as any).auditLog.create({
      data: {
        companyId,
        userId: Number(session.user.id) || 0,
        action: 'JOB_TYPE_UPDATED',
        entityType: 'JobPerformingType',
        entityId: updated.id,
        tenantId: companyId,
        previousValue: { code: existing.code },
        newValue: { code: updated.code, isActive: updated.isActive } as any,
      },
    });

    return NextResponse.json({ jobType: updated });
  } catch (error) {
    console.error('Error updating job performing type:', error);
    return NextResponse.json({ error: 'Failed to update job type' }, { status: 500 });
  }
}
