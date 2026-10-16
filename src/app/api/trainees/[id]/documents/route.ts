import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { traineeDocumentService, type CreateTraineeDocumentInput, type DocumentFilters } from '@/lib/services';
import { writeFile } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents');

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
    const traineeId = parseInt(id);

    const formData = await request.formData();
    const files = formData.getAll('file') as File[];
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const expiryDate = formData.get('expiryDate') as string | null;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'At least one file is required' }, { status: 400 });
    }

    const documents: any[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      await writeFile(filePath, buffer);

      const url = `/uploads/documents/${fileName}`;

      const document = await traineeDocumentService.create({
        name,
        type,
        url,
        companyId: session.user.companyId,
        traineeId,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        status: 'valid',
      });

      documents.push(document);
    }

    return NextResponse.json(documents, { status: 201 });
  } catch (error) {
    console.error('Error creating trainee document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}