import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIServiceManager } from '@/lib/ai/assistants';

/**
 * GET /api/ai/assistants/usage
 * Get AI token usage, costs, and breakdown by assistant for the company.
 * Query params:
 *   - ?days=30 (default 30)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = parseInt(searchParams.get('days') || '30', 10);
    const days = isNaN(daysParam) || daysParam <= 0 ? 30 : Math.min(daysParam, 365);

    const analytics = await AIServiceManager.getUsageAnalytics(
      session.user.companyId,
      days
    );

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    console.error('Error fetching AI usage analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch AI usage analytics' },
      { status: 500 }
    );
  }
}
