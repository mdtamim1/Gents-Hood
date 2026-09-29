import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { signAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/services/audit.service';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid admin email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rate = await rateLimit(`admin_login_${ip}`);
    if (!rate.success) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please wait.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0]?.message || 'Invalid credentials' },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const user = await db.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const role = (user.role === 'OWNER' ? 'OWNER' : 'STAFF') as 'OWNER' | 'STAFF';
    const token = await signAdminToken({
      id: user.id,
      email: user.email,
      role,
    });

    await createAuditLog({
      adminId: user.id,
      action: 'LOGIN',
      entity: 'AdminUser',
      entityId: user.id,
      meta: { ip },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: unknown) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}
