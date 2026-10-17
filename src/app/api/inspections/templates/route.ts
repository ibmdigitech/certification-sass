import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { InspectionReportService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;

    const templates = await InspectionReportService.getTemplates(companyId, type);

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
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
    const { name, description, type, content, isDefault, createdBy } = body;

    if (!name || !type || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const template = await InspectionReportService.createTemplate({
      companyId,
      name,
      description,
      type,
      content,
      isDefault,
      createdBy,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
