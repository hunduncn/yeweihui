import { NextRequest, NextResponse } from 'next/server';
import { getRelatedRecords, createRelation } from '@/lib/relations';
import { requireAdmin } from '@/lib/server-auth';
import { getRecord } from '@/lib/records';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recordId = parseInt(id);
  if (isNaN(recordId)) return NextResponse.json({ error: '无效 ID' }, { status: 400 });

  const related = getRelatedRecords(recordId);
  return NextResponse.json(related);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const recordId = parseInt(id);
  if (isNaN(recordId)) return NextResponse.json({ error: '无效 ID' }, { status: 400 });

  const body = await req.json();
  const relatedId = parseInt(body.related_id);
  if (isNaN(relatedId)) return NextResponse.json({ error: '无效 related_id' }, { status: 400 });
  if (recordId === relatedId) return NextResponse.json({ error: '不能关联自身' }, { status: 400 });

  if (!getRecord(recordId) || !getRecord(relatedId)) {
    return NextResponse.json({ error: '记录不存在' }, { status: 404 });
  }

  createRelation(recordId, relatedId);
  return NextResponse.json({ ok: true });
}
