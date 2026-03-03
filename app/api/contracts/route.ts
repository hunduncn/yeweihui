import { NextRequest, NextResponse } from 'next/server';
import { listContracts, createContract, ContractType, ContractDirection } from '@/lib/contracts';
import { requireAdmin } from '@/lib/server-auth';
import { findOrCreateCounterparty } from '@/lib/counterparties';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get('type') as ContractType | null;
  const direction = sp.get('direction') as ContractDirection | null;
  const expiring = sp.get('expiring') === '1';
  const page = parseInt(sp.get('page') ?? '1');
  const page_size = parseInt(sp.get('page_size') ?? '20');

  const result = listContracts({
    type: type ?? undefined,
    direction: direction ?? undefined,
    expiring: expiring || undefined,
    page,
    page_size,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json();
  const { title, counterparty, type, direction, amount, sign_date, start_date, end_date, summary } = body;

  if (!title || !counterparty || !type || !direction || amount == null || !sign_date) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  }

  findOrCreateCounterparty(counterparty);
  const contract = createContract({ title, counterparty, type, direction, amount: Number(amount), sign_date, start_date, end_date, summary });
  return NextResponse.json(contract, { status: 201 });
}
