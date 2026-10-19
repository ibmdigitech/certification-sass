import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const userId = Number(session.user.id);

    const body = await request.json();
    const { equipmentId, checklistType, results } = body;

    if (!equipmentId || !checklistType || !results) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the checklist template for this equipment type
    const template = await prisma.checklistTemplate.findFirst({
      where: {
        companyId,
        equipmentType: equipmentId.toUpperCase(),
        status: 'ACTIVE',
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Checklist template not found' }, { status: 404 });
    }

    // Create checklist result
    const checklistResult = await prisma.checklistResult.create({
      data: {
        companyId,
        jobId: 0, // Will be linked to job later
        templateId: template.id,
        checklistType: checklistType.toUpperCase(),
        status: 'completed',
        itemResults: {
          create: results.map((r: any) => ({
            companyId,
            itemId: 0, // We need to find the actual item ID
            status: r.status.toUpperCase(),
            remarks: r.observation,
            createdBy: userId,
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      checklistResultId: checklistResult.id,
    });
  } catch (error) {
    console.error('Error saving checklist results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}