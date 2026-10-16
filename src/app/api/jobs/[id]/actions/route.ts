import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { JobService } from '@/lib/services/job.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const userId = Number(session.user.id) || 0;
    const userRole = session.user.role || null;
    const { id } = await params;
    const body = await request.json();
    const { action, reason, engineerId, inspectorId, scheduledDate } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const result = await JobService.transitionJob(Number(id), companyId, userId, userRole, action, {
      targetStatus: body.targetStatus,
      reason,
      engineerId: engineerId !== undefined ? Number(engineerId) : undefined,
      inspectorId: inspectorId !== undefined ? Number(inspectorId) : undefined,
      scheduledDate,
    });

    return NextResponse.json({ job: result });
  } catch (error) {
    console.error('Error performing job action:', error);
    const message = error instanceof Error ? error.message : 'Failed to perform action';
    const status = message.includes('not authorized') || message.includes('Cannot') || message.includes('requires') || message.includes('Unknown') || message.includes('not found')
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
