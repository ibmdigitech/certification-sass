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

    const applications = await (prisma as any).accreditationApplication.findMany({
      where: { companyId },
      include: {
        authority: { select: { id: true, code: true, name: true } },
        assessments: {
          include: {
            nonconformities: true,
          },
        },
      },
      orderBy: { submissionDate: 'desc' },
    });

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching accreditation applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const { authorityId, standardReference, applicationNumber, submissionDate, requestedScopes, notes } = body;

    if (!authorityId || !applicationNumber || !requestedScopes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const application = await (prisma as any).accreditationApplication.create({
      data: {
        companyId,
        authorityId: Number(authorityId),
        standardReference: standardReference || 'ISO/IEC 17020:2012',
        applicationNumber,
        submissionDate: submissionDate ? new Date(submissionDate) : new Date(),
        requestedScopesJson: requestedScopes,
        notes: notes || null,
        status: 'SUBMITTED',
      },
      include: {
        authority: true,
      },
    });

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error) {
    console.error('Error creating accreditation application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
