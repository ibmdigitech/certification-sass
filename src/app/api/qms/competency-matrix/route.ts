import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EngineerCompetencyService } from '@/lib/services/engineer-competency.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matrix = await EngineerCompetencyService.getCompetencyMatrix(session.user.companyId);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      engineers: matrix
    });
  } catch (error) {
    console.error('Error fetching competency matrix:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
