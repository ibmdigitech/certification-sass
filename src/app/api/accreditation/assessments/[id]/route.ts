import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/accreditation/assessments/[id] — fetch single assessment
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

    const assessment = await (prisma as any).accreditationAssessment.findFirst({
      where: {
        id: Number(id),
        application: { companyId },
      },
      include: {
        application: { select: { id: true, applicationNumber: true, status: true } },
        nonconformities: true,
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, assessment });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/accreditation/assessments/[id] — update assessment (outcome, findings)
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

    // Verify ownership through the application
    const existing = await (prisma as any).accreditationAssessment.findFirst({
      where: { id: Number(id), application: { companyId } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const { assessmentDate, assessorName, assessorOrganization, findings, outcome, notes } = body;

    const assessment = await (prisma as any).accreditationAssessment.update({
      where: { id: Number(id) },
      data: {
        ...(assessmentDate && { assessmentDate: new Date(assessmentDate) }),
        ...(assessorName !== undefined && { assessorName }),
        ...(assessorOrganization !== undefined && { assessorOrganization }),
        ...(findings !== undefined && { findingsJson: findings }),
        ...(outcome && { outcome }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        application: { select: { id: true, applicationNumber: true } },
        nonconformities: true,
      },
    });

    return NextResponse.json({ success: true, assessment });
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
