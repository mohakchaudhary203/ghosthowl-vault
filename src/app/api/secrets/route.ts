import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const createSchema = z.object({
  name: z.string().min(1),
  ciphertext: z.string().min(1),
  iv: z.string().min(1),
  authTag: z.string().min(1)
});

// Server only ever handles ciphertext blobs - it has no ability to read secret values.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const secrets = await prisma.secret.findMany({
    where: { ownerId: session.userId },
    orderBy: { updatedAt: 'desc' }
  });

  return NextResponse.json(secrets);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const secret = await prisma.secret.create({
    data: { ...parsed.data, ownerId: session.userId }
  });

  return NextResponse.json(secret, { status: 201 });
}
