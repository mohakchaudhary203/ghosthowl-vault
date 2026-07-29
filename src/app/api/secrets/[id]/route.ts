import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const secret = await prisma.secret.findUnique({ where: { id: params.id } });
  if (!secret || secret.ownerId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.secret.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
