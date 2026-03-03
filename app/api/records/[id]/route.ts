import { NextRequest, NextResponse } from 'next/server';
import { getRecord, updateRecord, deleteRecord } from '@/lib/records';
import { requireAdmin } from '@/lib/server-auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = getRecord(parseInt(id));
  if (!record) {
    return NextResponse.json({ error: '记录不存在' }, { status: 404 });
  }
  return NextResponse.json(record);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await request.json();
  const { title, type, event_date, description, participants, member_ids, other_participants } = body;

  const validTypes = ['meeting', 'announcement', 'government', 'rights'];
  if (type && !validTypes.includes(type)) {
    return NextResponse.json({ error: '无效的记录类型' }, { status: 400 });
  }

  const record = updateRecord(parseInt(id), { title, type, event_date, description, participants, member_ids, other_participants });
  if (!record) {
    return NextResponse.json({ error: '记录不存在' }, { status: 404 });
  }
  return NextResponse.json(record);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const success = deleteRecord(parseInt(id));
  if (!success) {
    return NextResponse.json({ error: '记录不存在' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
