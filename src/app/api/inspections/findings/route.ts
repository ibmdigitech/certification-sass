import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: any = { companyId };
    if (search) {
      where.OR = [
        { reportNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { job: { jobNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [findings, total] = await Promise.all([
      prisma.inspectionReport.findMany({
        where,
        include: {
          job: {
            include: {
              customer: { select: { contact: true } },
            },
          },
          inspection: { select: { inspectionType: true } },
          failureWorkflows: { select: { id: true, status: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.inspectionReport.count({ where }),
    ]);

    return NextResponse.json({
      findings,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching findings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
