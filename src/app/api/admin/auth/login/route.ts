import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { signAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { getFirstAllowedPath } from '@/lib/permissions';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/services/audit.service';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { randomBytes } from 'crypto';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid admin email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rate = await rateLimit(`admin_login_${ip}`);
    if (!rate.success) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts from this network. Please wait.' },
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

    const { email, password, turnstileToken } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Secondary rate limiting per email (max 5 attempts per 15 min across any IP)
    const emailRate = await rateLimit(`admin_login_email_${normalizedEmail}`, 5, 15 * 60 * 1000);
    if (!emailRate.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Too many login attempts for this admin account. Please wait 15 minutes before trying again.',
        },
        { status: 429 }
      );
    }

    // Cloudflare Turnstile Captcha Verification
    const turnstileCheck = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileCheck.success) {
      return NextResponse.json(
        { success: false, error: turnstileCheck.error || 'Captcha verification failed' },
        { status: 400 }
      );
    }

    const user = await db.adminUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Your account has been deactivated. Contact the administrator.' },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate unique session token
    const sessionToken = randomBytes(32).toString('hex');

    // Deactivate old sessions
    await db.staffSession.updateMany({
      where: { staffId: user.id, isActive: true },
      data: { isActive: false, logoutAt: new Date() },
    });

    // Create new session
    await db.staffSession.create({
      data: {
        staffId: user.id,
        token: sessionToken,
        isActive: true,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // Update user with session token and lastLoginAt
    await db.adminUser.update({
      where: { id: user.id },
      data: {
        sessionToken,
        lastLoginAt: new Date(),
      },
    });

    const role = (user.role === 'OWNER' ? 'OWNER' : 'STAFF') as 'OWNER' | 'STAFF';
    const token = await signAdminToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      sessionToken,
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
      redirectUrl: getFirstAllowedPath(user),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
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
      maxAge: 60 * 60 * 24, // 24 hours (1 day) instead of 7 days
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
