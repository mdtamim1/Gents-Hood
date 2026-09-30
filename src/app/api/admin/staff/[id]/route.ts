import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const updateStaffSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['OWNER', 'STAFF']).optional(),
  isActive: z.boolean().optional(),
  displayColor: z.string().optional(),
  permissions: z.record(z.boolean()).optional(),
});

// PATCH: Update staff
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== 'OWNER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateStaffSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const { name, email, password, role, isActive, displayColor, permissions } = result.data;
    const updateData: Record<string, unknown> = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (role) updateData.role = role;
    if (displayColor) updateData.displayColor = displayColor;
    if (permissions) updateData.permissions = JSON.stringify(permissions);
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

    // Handle activate/deactivate
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;

      if (!isActive) {
        // Force logout: clear session token
        updateData.sessionToken = null;

        // Deactivate all active sessions
        await db.staffSession.updateMany({
          where: { staffId: params.id, isActive: true },
          data: { isActive: false, logoutAt: new Date() },
        });
      }
    }

    const staff = await db.adminUser.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
        isActive: staff.isActive,
        displayColor: staff.displayColor,
      },
    });
  } catch (error) {
    console.error('Update staff error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update staff' }, { status: 500 });
  }
}

// DELETE: Remove staff (OWNER only, cannot delete self)
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== 'OWNER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (session.id === params.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Unassign orders before delete
    await db.order.updateMany({
      where: { assignedToId: params.id },
      data: { assignedToId: null },
    });

    await db.adminUser.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete staff error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete staff' }, { status: 500 });
  }
}
