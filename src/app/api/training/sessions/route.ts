import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { trainingSessionService } from '@/lib/services/session.service';
import { validateLocationAccreditation } from '@/lib/validation/location-accreditation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const courseId = searchParams.get('courseId');
    const locationId = searchParams.get('locationId');
    const status = searchParams.get('status');
    const startDateFrom = searchParams.get('startDateFrom');
    const startDateTo = searchParams.get('startDateTo');

    const result = await trainingSessionService.listSessions({
      companyId: session.user.companyId,
      courseId: courseId ? parseInt(courseId) : undefined,
      locationId: locationId ? parseInt(locationId) : undefined,
      status: status || undefined,
      startDateFrom: startDateFrom || undefined,
      startDateTo: startDateTo || undefined,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate location-accreditation combination
    if (body.locationId) {
      const location = await prisma.location.findFirst({
        where: { id: body.locationId, companyId: session.user.companyId },
        select: { code: true },
      });
      if (!location) {
        return NextResponse.json({ error: 'Location not found' }, { status: 404 });
      }

      let accreditationCode: string | undefined;
      if (body.accreditationId) {
        const accred = await prisma.accreditationAuthority.findFirst({
          where: { id: body.accreditationId, companyId: session.user.companyId },
          select: { code: true },
        });
        if (!accred) {
          return NextResponse.json({ error: 'Accreditation authority not found' }, { status: 404 });
        }
        accreditationCode = accred.code;
      }

      const validation = validateLocationAccreditation(location.code, accreditationCode);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Also validate against the course's location/accreditation if courseId is provided
      if (body.courseId) {
        const course = await prisma.trainingCourse.findFirst({
          where: { id: body.courseId, companyId: session.user.companyId },
          select: { locationId: true, accreditationId: true },
        });
        if (course) {
          if (course.locationId && course.locationId !== body.locationId) {
            return NextResponse.json(
              { error: `Session location (${location.code}) does not match course location` },
              { status: 400 }
            );
          }
          if (course.accreditationId && body.accreditationId && course.accreditationId !== body.accreditationId) {
            return NextResponse.json(
              { error: 'Session accreditation does not match course accreditation' },
              { status: 400 }
            );
          }
        }
      }
    }

    const trainingSession = await trainingSessionService.createSession({
      companyId: session.user.companyId,
      jobId: body.jobId ? Number(body.jobId) : undefined,
      jobServiceId: body.jobServiceId ? Number(body.jobServiceId) : undefined,
      ...body,
    });

    return NextResponse.json(trainingSession, { status: 201 });
  } catch (error: any) {
    console.error('Error creating session:', error);
    if (error?.message?.includes('capacity')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
