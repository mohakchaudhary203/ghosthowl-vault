import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'dev_secret_change_me';
const key = new TextEncoder().encode(secretKey);
const COOKIE_NAME = 'ghosthowl_session';

export async function createSession(userId: string, email: string) {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function getSession(): Promise<{ userId: string; email: string } | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export function destroySession() {
  cookies().delete(COOKIE_NAME);
}
