import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIServiceManager } from '@/lib/ai/assistants';
import { z } from 'zod';

const rejectSchema = z.object({
  stagedOutputId: z.number().int().positive(),
  reviewNotes: z.string().min(1, 'Reason for rejection is required'),
});

/**
 * POST /api/ai/assistants/staged/reject
 * Human-in-the-loop: Reject a pending staged AI output with feedback/notes.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = rejectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await AIServiceManager.rejectOutput(
      parsed.data.stagedOutputId,
      Number(session.user.id),
      session.user.companyId,
      parsed.data.reviewNotes
    );

    return NextResponse.json({
      success: true,
      message: 'Staged output rejected',
      stagedOutput: updated,
    });
  } catch (error: any) {
    console.error('Error rejecting staged output:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject staged output' },
      { status: 500 }
    );
  }
}
