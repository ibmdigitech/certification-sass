import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { competencyService } from '@/lib/services/competency.service';

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
    const competency = await competencyService.getCompetencyById(parseInt(id), session.user.companyId);

    if (!competency) {
      return NextResponse.json({ error: 'Competency not found' }, { status: 404 });
    }

    return NextResponse.json(competency);
  } catch (error) {
    console.error('Error fetching competency:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const body = await request.json();

    const competency = await competencyService.updateCompetency(parseInt(id), session.user.companyId, body);
    return NextResponse.json(competency);
  } catch (error: any) {
    console.error('Error updating competency:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Competency not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    await competencyService.deleteCompetency(parseInt(id), session.user.companyId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting competency:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Competency not found' }, { status: 404 });
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Cannot delete competency with linked trainees or courses' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
