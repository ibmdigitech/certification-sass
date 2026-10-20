import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIServiceManager, AssistantType } from '@/lib/ai/assistants';

/**
 * GET /api/ai/assistants/staged
 * List pending AI staged outputs for the current company.
 * Optional query param: ?assistantType=DOCUMENT_EXTRACTOR
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assistantTypeParam = searchParams.get('assistantType') as AssistantType | null;

    const pendingOutputs = await AIServiceManager.getPendingOutputs(
      session.user.companyId,
      assistantTypeParam || undefined
    );

    return NextResponse.json({
      success: true,
      count: pendingOutputs.length,
      stagedOutputs: pendingOutputs,
    });
  } catch (error) {
    console.error('Error fetching staged outputs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
