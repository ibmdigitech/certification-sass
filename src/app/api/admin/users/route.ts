import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminUserService } from '@/lib/services/admin-user.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const result = await AdminUserService.getUsers({
      companyId: session.user.companyId,
      page,
      limit,
      search,
      role,
      status
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching users:', error);
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
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const user = await AdminUserService.createUser({
      companyId: session.user.companyId,
      userId: Number(session.user.id),
      ...body
    });

    // Log the action
    await AdminUserService.logAdminAction({
      companyId: session.user.companyId,
      userId: Number(session.user.id),
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: user.id,
      previousValue: null,
      newValue: user,
      reason: `Admin created user: ${user.name}`
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const userId = parseInt(id);
    const updatedUser = await AdminUserService.updateUser({
      companyId: session.user.companyId,
      userId,
      updates: body,
      requestingUserId: Number(session.user.id)
    });

    // Log the action
    await AdminUserService.logAdminAction({
      companyId: session.user.companyId,
      userId: Number(session.user.id),
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: userId,
      previousValue: null, // In real implementation, fetch previous state
      newValue: updatedUser,
      reason: `Admin updated user: ${updatedUser.name}`
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    const deletedUser = await AdminUserService.deleteUser({
      companyId: session.user.companyId,
      userId,
      requestingUserId: Number(session.user.id)
    });

    // Log the action
    await AdminUserService.logAdminAction({
      companyId: session.user.companyId,
      userId: Number(session.user.id),
      action: 'USER_DELETED',
      entityType: 'USER',
      entityId: userId,
      previousValue: deletedUser,
      newValue: null,
      reason: `Admin deleted user: ${deletedUser.name}`
    });

    return NextResponse.json({ success: true, user: deletedUser });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}