import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { competencyService, type CreateCompetencyInput, type CompetencyFilters } from '@/lib/services/competency.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const filters: CompetencyFilters = {
      companyId: session.user.companyId,
      category,
      status,
      search,
      page,
      pageSize,
    };

    const result = await competencyService.listCompetencies(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing competencies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: Omit<CreateCompetencyInput, 'companyId'> = await request.json();

    if (!body.code || !body.name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    const competency = await competencyService.createCompetency({
      companyId: session.user.companyId,
      ...body,
    });

    return NextResponse.json(competency, { status: 201 });
  } catch (error: any) {
    console.error('Error creating competency:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A competency with this code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
