import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { traineeDocumentService, type CreateTraineeDocumentInput, type DocumentFilters } from '@/lib/services';

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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;

    const filters: DocumentFilters = {
      companyId: session.user.companyId,
      traineeId: parseInt(id),
      type,
      status,
      page,
      pageSize,
    };

    const result = await traineeDocumentService.findMany(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching trainee documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body: CreateTraineeDocumentInput = await request.json();

    if (!body.name || !body.type || !body.url) {
      return NextResponse.json({ error: 'Name, type, and URL are required' }, { status: 400 });
    }

    const document = await traineeDocumentService.create({
      ...body,
      companyId: session.user.companyId,
      traineeId: parseInt(id),
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating trainee document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}