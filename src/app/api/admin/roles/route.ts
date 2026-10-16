import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminRoleService } from '@/lib/services/admin-role.service';

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

    const roles = await AdminRoleService.getRoles({
      companyId: session.user.companyId,
      page,
      limit,
      search
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
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
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    const role = await AdminRoleService.createRole({
      companyId: session.user.companyId,
      userId: Number(session.user.id),
      ...body
    });

    await AdminRoleService.logRoleAction({
      companyId: session.user.companyId,
      userId: Number(session.user.id),
      action: 'ROLE_CREATED',
      entityType: 'ROLE',
      entityId: role.id,
      previousValue: null,
      newValue: role,
      reason: `Admin created role: ${role.name}`
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
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

    const roleId = parseInt(id);
    const updatedRole = await AdminRoleService.updateRole({
      companyId: session.user.companyId,
      roleId,
      updates: body,
      requestingUserId: Number(session.user.id)
    });

    await AdminRoleService.logRoleAction({
      companyId: session.user.companyId,
      userId: Number(session.user.id),
      action: 'ROLE_UPDATED',
      entityType: 'ROLE',
      entityId: roleId,
      previousValue: null,
      newValue: updatedRole,
      reason: `Admin updated role: ${updatedRole.name}`
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error('Error updating role:', error);
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
    const roleId = parseInt(id);

    const deletedRole = await AdminRoleService.deleteRole({
      companyId: session.user.companyId,
      roleId,
      requestingUserId: Number(session.user.id)
    });

    await AdminRoleService.logRoleAction({
      companyId: session.user.companyId,
      userId: Number(session.user.id),
      action: 'ROLE_DELETED',
      entityType: 'ROLE',
      entityId: roleId,
      previousValue: deletedRole,
      newValue: null,
      reason: `Admin deleted role: ${deletedRole.name}`
    });

    return NextResponse.json({ success: true, role: deletedRole });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}