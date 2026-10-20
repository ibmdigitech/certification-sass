import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/accreditation/assessments — list all assessments for the company's applications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;

    const assessments = await (prisma as any).accreditationAssessment.findMany({
      where: {
        application: { companyId },
      },
      include: {
        application: {
          select: { id: true, applicationNumber: true, status: true },
        },
        nonconformities: true,
      },
      orderBy: { assessmentDate: 'desc' },
    });

    return NextResponse.json({ success: true, assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/accreditation/assessments — create a new assessment for an application
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const body = await request.json();

    const {
      applicationId,
      assessmentType,   // 'DOCUMENT_REVIEW' | 'ON_SITE' | 'SURVEILLANCE'
      assessmentDate,
      assessorName,
      assessorOrganization,
      findings,
      outcome,          // 'PASS' | 'FAIL' | 'CONDITIONAL'
      notes,
    } = body;

    if (!applicationId || !assessmentType) {
      return NextResponse.json({ error: 'applicationId and assessmentType are required' }, { status: 400 });
    }

    // Verify the application belongs to this company
    const application = await (prisma as any).accreditationApplication.findFirst({
      where: { id: Number(applicationId), companyId },
    });
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const assessment = await (prisma as any).accreditationAssessment.create({
      data: {
        applicationId: Number(applicationId),
        assessmentType,
        assessmentDate: assessmentDate ? new Date(assessmentDate) : new Date(),
        assessorName: assessorName || null,
        assessorOrganization: assessorOrganization || null,
        findingsJson: findings || null,
        outcome: outcome || null,
        notes: notes || null,
      },
      include: {
        application: { select: { id: true, applicationNumber: true } },
      },
    });

    return NextResponse.json({ success: true, assessment }, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
