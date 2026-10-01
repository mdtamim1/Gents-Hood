import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const createStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  password: z.string().min(6),
  role: z.enum(['OWNER', 'STAFF']).default('STAFF'),
  displayColor: z.string().optional(),
  permissions: z
    .object({
      orders: z.boolean().default(true),
      products: z.boolean().default(false),
      dashboard: z.boolean().default(false),
      settings: z.boolean().default(false),
      analytics: z.boolean().default(false),
      customers: z.boolean().default(false),
    })
    .optional(),
});

// GET: List all staff (OWNER only)
export async function GET(_request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== 'OWNER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const staff = await db.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        displayColor: true,
        permissions: true,
        lastLoginAt: true,
        lastLogoutAt: true,
        sessionToken: true,
        createdAt: true,
        _count: { select: { assignedOrders: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Determine online status (has active session)
    const activeSessions = await db.staffSession.findMany({
      where: {
        isActive: true,
        lastSeenAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // within 5 minutes
      },
      select: { staffId: true },
    });
    const onlineIds = new Set(activeSessions.map((s) => s.staffId));

    return NextResponse.json({
      success: true,
      staff: staff.map((s) => ({
        ...s,
        permissions: s.permissions ? JSON.parse(s.permissions) : { orders: true },
        isOnline: onlineIds.has(s.id),
        sessionToken: undefined, // Don't expose
      })),
    });
  } catch (error) {
    console.error('Staff list error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch staff' }, { status: 500 });
  }
}

// POST: Create new staff (OWNER only)
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== 'OWNER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = createStaffSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const { email, name, password, role, displayColor, permissions } = result.data;

    const existing = await db.adminUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];
    const autoColor = displayColor || COLORS[Math.floor(Math.random() * COLORS.length)];

    const staff = await db.adminUser.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        passwordHash,
        role,
        displayColor: autoColor,
        isActive: true,
        permissions: permissions ? JSON.stringify(permissions) : JSON.stringify({ orders: true }),
      },
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
    console.error('Create staff error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create staff' }, { status: 500 });
  }
}
