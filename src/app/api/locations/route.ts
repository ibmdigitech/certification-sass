import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const companyId = Number(session?.user?.companyId);
    if (!companyId || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const locations = await (prisma as any).location.findMany({
      where: { companyId },
      include: {
        locationAccreditations: {
          include: { accreditation: { select: { id: true, code: true, name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
