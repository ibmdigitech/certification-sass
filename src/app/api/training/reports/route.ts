import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TrainingReportService } from '@/lib/services/enrollment.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const courseId = searchParams.get('courseId');
    const traineeId = searchParams.get('traineeId');

    let result;
    if (type === 'course' && courseId) {
      result = await TrainingReportService.getCourseReport(parseInt(courseId), session.user.companyId);
    } else if (type === 'trainee' && traineeId) {
      result = await TrainingReportService.getTraineeProgressReport(parseInt(traineeId), session.user.companyId);
    } else if (type === 'dashboard') {
      result = await TrainingReportService.getCompanyTrainingDashboard(session.user.companyId);
    } else {
      return NextResponse.json({ error: 'Invalid report type or missing parameters' }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}