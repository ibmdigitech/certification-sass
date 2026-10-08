// src/app/api/documents/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    await writeFile(filePath, buffer);
    
    const url = `/uploads/documents/${fileName}`;
    
    return NextResponse.json({ 
      success: true, 
      url,
      fileName,
      size: file.size
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');
    
    if (documentId) {
      const filePath = path.join(UPLOAD_DIR, `${documentId}.jpg`);
      const buffer = await readFile(filePath);
      const base64 = buffer.toString('base64');
      
      return new NextResponse(Buffer.from(base64, 'base64'), {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }
    
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
  } catch (error) {
    console.error('Document retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500 });
  }
}
