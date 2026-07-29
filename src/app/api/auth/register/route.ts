import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import crypto from 'crypto';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  // kdfSalt is used client-side only, to derive the vault encryption key.
  // It is not secret, but it must be unique per user.
  const kdfSalt = crypto.randomBytes(16).toString('base64');

  const user = await prisma.user.create({
    data: { email, passwordHash, kdfSalt }
  });

  await createSession(user.id, user.email);

  return NextResponse.json({ id: user.id, email: user.email, kdfSalt: user.kdfSalt });
}
