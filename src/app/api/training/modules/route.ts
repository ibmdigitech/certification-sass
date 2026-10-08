import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TrainingModuleService } from '@/lib/services/training.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const modules = await TrainingModuleService.listModules(parseInt(courseId), session.user.companyId);

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Error listing modules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const body = await request.json();
    const module = await TrainingModuleService.createModule({
      companyId: session.user.companyId,
      courseId: parseInt(courseId),
      ...body,
    });

    return NextResponse.json(module, { status: 201 });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}