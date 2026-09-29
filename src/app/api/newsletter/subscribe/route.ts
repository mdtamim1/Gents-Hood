import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { newsletterSubscribeSchema } from '@/lib/validators';
import { rateLimit } from '@/lib/rate-limit';
import { createOrReactivateSubscriber } from '@/lib/services/newsletter.service';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await rateLimit(`newsletter_${ip}`);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = newsletterSubscribeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.errors[0]?.message || 'Please enter a valid email address.',
        },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const { isNew } = await createOrReactivateSubscriber(email);

    return NextResponse.json({
      success: true,
      message: isNew
        ? 'Welcome to the Hood. Exclusive editorial access and release dispatches will arrive in your inbox.'
        : 'You are already on the Gents Hood priority VIP dispatch list.',
    });
  } catch (error: unknown) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to process subscription right now. Please try again.' },
      { status: 500 }
    );
  }
}
