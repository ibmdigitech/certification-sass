import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TrainingCourseService } from '@/lib/services/training.service';
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const locationIdParam = searchParams.get('locationId');
    const locationId = locationIdParam ? parseInt(locationIdParam) : undefined;

    const result = await TrainingCourseService.listCourses(session.user.companyId, {
      status,
      category,
      search,
      activeOnly,
      locationId,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing courses:', error);
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
    }

    const course = await TrainingCourseService.createCourse({
      companyId: session.user.companyId,
      ...body,
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}