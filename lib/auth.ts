import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'auth-token';
export const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // In middleware (Edge) this causes verifyToken to return false → redirect to login
    throw new Error('JWT_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: { username: string }): Promise<string> {
  // Called only from the Node.js API route — JWT_SECRET must be set
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = getSecret();
    await jwtVerify(token, secret);
    return true;
  } catch {
    // Invalid token, expired token, or missing JWT_SECRET → deny access
    return false;
  }
}
