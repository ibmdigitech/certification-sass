import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TrainingCourseService } from '@/lib/services/training.service';
import { validateLocationAccreditation } from '@/lib/validation/location-accreditation';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const course = await TrainingCourseService.getCourseById(parseInt(id), session.user.companyId);
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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

    const course = await TrainingCourseService.updateCourse(parseInt(id), session.user.companyId, body);

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await TrainingCourseService.deleteCourse(parseInt(id), session.user.companyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}