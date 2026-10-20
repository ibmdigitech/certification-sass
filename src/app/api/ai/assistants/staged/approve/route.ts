import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIServiceManager } from '@/lib/ai/assistants';
import { z } from 'zod';

const approveSchema = z.object({
  stagedOutputId: z.number().int().positive(),
  reviewNotes: z.string().optional(),
});

/**
 * POST /api/ai/assistants/staged/approve
 * Human-in-the-loop: Approve a pending staged AI output.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await AIServiceManager.approveOutput(
      parsed.data.stagedOutputId,
      Number(session.user.id),
      session.user.companyId,
      parsed.data.reviewNotes
    );

    return NextResponse.json({
      success: true,
      message: 'Staged output approved successfully',
      stagedOutput: updated,
    });
  } catch (error: any) {
    console.error('Error approving staged output:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve staged output' },
      { status: 500 }
    );
  }
}
