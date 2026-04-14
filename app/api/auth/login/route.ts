import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth';

// Hash both values to equal length, then compare — timing-safe and no length oracle
function safeCompare(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(String(a)).digest();
  const hashB = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(hashA, hashB);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username ?? '');
    const password = String(body?.password ?? '');

    const expectedUser = process.env.AUTH_USERNAME ?? '';
    const expectedPass = process.env.AUTH_PASSWORD ?? '';

    if (!expectedUser || !expectedPass) {
      console.error('[auth] AUTH_USERNAME or AUTH_PASSWORD is not set in environment variables.');
      return NextResponse.json(
        { error: 'Server is not configured. Contact the administrator.' },
        { status: 500 }
      );
    }

    const validUser = safeCompare(username, expectedUser);
    const validPass = safeCompare(password, expectedPass);

    if (!validUser || !validPass) {
      await new Promise(r => setTimeout(r, 500)); // slow brute-force
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const token = await signToken({ username: expectedUser });

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[auth] Login error:', err);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
