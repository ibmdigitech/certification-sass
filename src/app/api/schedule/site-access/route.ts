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

    const passes = await (prisma as any).siteAccessPass.findMany({
      where: { companyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        job: { select: { id: true, jobNumber: true, title: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return NextResponse.json({ success: true, passes });
  } catch (error) {
    console.error('Error fetching site access passes:', error);
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
    const { userId, jobId, passType, passNumber, issueDate, expiryDate, documentUrl, securityClearance } = body;

    if (!userId || !passType || !passNumber || !expiryDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pass = await (prisma as any).siteAccessPass.create({
      data: {
        companyId,
        userId: Number(userId),
        jobId: jobId ? Number(jobId) : null,
        passType,
        passNumber,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        expiryDate: new Date(expiryDate),
        documentUrl: documentUrl || null,
        securityClearance: securityClearance || 'STANDARD',
        status: 'ACTIVE',
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, pass }, { status: 201 });
  } catch (error) {
    console.error('Error registering site pass:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
