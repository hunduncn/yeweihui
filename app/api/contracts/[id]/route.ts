import { NextRequest, NextResponse } from 'next/server';
import { getContract, updateContract, deleteContract } from '@/lib/contracts';
import { requireAdmin } from '@/lib/server-auth';
import { findOrCreateCounterparty } from '@/lib/counterparties';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contract = getContract(parseInt(id));
  if (!contract) return NextResponse.json({ error: '合同不存在' }, { status: 404 });
  return NextResponse.json(contract);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json();
  if (body.counterparty) findOrCreateCounterparty(body.counterparty);
  const contract = updateContract(parseInt(id), body);
  if (!contract) return NextResponse.json({ error: '合同不存在' }, { status: 404 });
  return NextResponse.json(contract);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const ok = deleteContract(parseInt(id));
  if (!ok) return NextResponse.json({ error: '合同不存在' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
