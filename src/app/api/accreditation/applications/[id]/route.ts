import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/accreditation/applications/[id] — fetch single application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const companyId = session.user.companyId;

    const application = await (prisma as any).accreditationApplication.findFirst({
      where: { id: Number(id), companyId },
      include: {
        authority: { select: { id: true, code: true, name: true } },
        assessments: {
          include: { nonconformities: true },
          orderBy: { assessmentDate: 'desc' },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error('Error fetching accreditation application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/accreditation/applications/[id] — update application
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const companyId = session.user.companyId;
    const body = await request.json();

    // Verify ownership
    const existing = await (prisma as any).accreditationApplication.findFirst({
      where: { id: Number(id), companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const { status, requestedScopes, notes, standardReference } = body;

    const application = await (prisma as any).accreditationApplication.update({
      where: { id: Number(id) },
      data: {
        ...(status && { status }),
        ...(requestedScopes && { requestedScopesJson: requestedScopes }),
        ...(notes !== undefined && { notes }),
        ...(standardReference && { standardReference }),
      },
      include: { authority: true },
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error('Error updating accreditation application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/accreditation/applications/[id] — withdraw (soft-delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const companyId = session.user.companyId;

    const existing = await (prisma as any).accreditationApplication.findFirst({
      where: { id: Number(id), companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const application = await (prisma as any).accreditationApplication.update({
      where: { id: Number(id) },
      data: { status: 'WITHDRAWN' },
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error('Error withdrawing accreditation application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
