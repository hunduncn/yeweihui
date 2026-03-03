import { NextRequest, NextResponse } from 'next/server';
import { listMembers, createMember } from '@/lib/members';
import { requireAdmin } from '@/lib/server-auth';

export async function GET() {
  return NextResponse.json(listMembers());
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await request.json();
  const { name, sort_order } = body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: '姓名为必填项' }, { status: 400 });
  }
  const member = createMember({ name: name.trim(), sort_order });
  return NextResponse.json(member, { status: 201 });
}
