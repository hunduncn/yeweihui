import { NextRequest, NextResponse } from 'next/server';
import { updateMember, deleteMember } from '@/lib/members';
import { requireAdmin } from '@/lib/server-auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await request.json();
  const { name, sort_order } = body;
  const member = updateMember(parseInt(id), { name: name?.trim(), sort_order });
  if (!member) return NextResponse.json({ error: '成员不存在' }, { status: 404 });
  return NextResponse.json(member);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const success = deleteMember(parseInt(id));
  if (!success) return NextResponse.json({ error: '成员不存在' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
