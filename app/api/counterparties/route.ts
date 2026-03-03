import { NextRequest, NextResponse } from 'next/server';
import { listCounterparties, findOrCreateCounterparty } from '@/lib/counterparties';
import { requireAdmin } from '@/lib/server-auth';

export async function GET() {
  return NextResponse.json(listCounterparties());
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
  const cp = findOrCreateCounterparty(name);
  return NextResponse.json(cp, { status: 201 });
}
