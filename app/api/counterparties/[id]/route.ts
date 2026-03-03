import { NextRequest, NextResponse } from 'next/server';
import { updateCounterparty, deleteCounterparty } from '@/lib/counterparties';
import { requireAdmin } from '@/lib/server-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
  const cp = updateCounterparty(parseInt(id), name);
  if (!cp) return NextResponse.json({ error: '不存在' }, { status: 404 });
  return NextResponse.json(cp);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  deleteCounterparty(parseInt(id));
  return new NextResponse(null, { status: 204 });
}
