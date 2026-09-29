import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { contactFormSchema } from '@/lib/validators';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting by IP (max 5 submissions per 10 min)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await rateLimit(`contact_${ip}`);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many messages sent. Please wait a few minutes before trying again.',
        },
        { status: 429 }
      );
    }

    // 2. Validate input with Zod
    const body = await request.json();
    const validationResult = contactFormSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError =
        validationResult.error.errors[0]?.message || 'Please check the form fields and try again.';
      return NextResponse.json(
        {
          success: false,
          error: firstError,
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, message, turnstileToken } = validationResult.data;

    // 3. Optional Cloudflare Turnstile verification if secret key is configured and not test key
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (
      turnstileSecret &&
      turnstileToken &&
      !turnstileSecret.includes('0000000000000000000000000000000AA')
    ) {
      try {
        const formData = new FormData();
        formData.append('secret', turnstileSecret);
        formData.append('response', turnstileToken);
        formData.append('remoteip', ip);

        const turnstileRes = await fetch(
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          {
            method: 'POST',
            body: formData,
          }
        );
        const turnstileOutcome = await turnstileRes.json();
        if (!turnstileOutcome.success) {
          return NextResponse.json(
            { success: false, error: 'Security verification failed. Please try again.' },
            { status: 400 }
          );
        }
      } catch {
        // Proceed if external verification service is temporarily unreachable
      }
    }

    // In production, send notification email via Resend or log to database / CRM
    console.info(
      `[CONTACT INQUIRY] From: ${name} <${email}> | Phone: ${phone || 'N/A'} | Subject: ${subject}`
    );
    console.info(`[CONTACT MESSAGE] ${message.substring(0, 100)}...`);

    return NextResponse.json({
      success: true,
      message:
        'Thank you for reaching out. The Gents Hood concierge team will respond within 24 hours.',
    });
  } catch (error: unknown) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to send message. Please try again or reach out on WhatsApp.',
      },
      { status: 500 }
    );
  }
}
