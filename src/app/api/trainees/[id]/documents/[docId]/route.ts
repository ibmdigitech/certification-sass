import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { traineeDocumentService, type UpdateTraineeDocumentInput } from '@/lib/services';
import { writeFile } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docId } = await params;
    const document = await traineeDocumentService.findById(parseInt(docId), session.user.companyId);
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docId } = await params;
    
    const contentType = request.headers.get('content-type') || '';
    let updateData: any = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const name = formData.get('name') as string | null;
      const type = formData.get('type') as string | null;
      const expiryDate = formData.get('expiryDate') as string | null;
      const status = formData.get('status') as string | null;

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        await writeFile(filePath, buffer);
        updateData.url = `/uploads/documents/${fileName}`;
      }
      
      if (name) updateData.name = name;
      if (type) updateData.type = type;
      if (expiryDate) updateData.expiryDate = new Date(expiryDate);
      if (status) updateData.status = status;
    } else {
      const body: UpdateTraineeDocumentInput = await request.json();
      updateData = body;
      if (body.expiryDate) {
        updateData.expiryDate = new Date(body.expiryDate);
      }
    }

    const document = await traineeDocumentService.update({
      ...updateData,
      id: parseInt(docId),
    });

    return NextResponse.json(document);
  } catch (error: any) {
    console.error('Error updating document:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docId } = await params;
    await traineeDocumentService.delete(parseInt(docId), session.user.companyId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}