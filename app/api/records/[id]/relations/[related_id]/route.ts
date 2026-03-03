import { NextRequest, NextResponse } from 'next/server';
import { deleteRelation } from '@/lib/relations';
import { requireAdmin } from '@/lib/server-auth';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; related_id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id, related_id } = await params;
  const recordId = parseInt(id);
  const relatedId = parseInt(related_id);
  if (isNaN(recordId) || isNaN(relatedId)) {
    return NextResponse.json({ error: '无效 ID' }, { status: 400 });
  }

  deleteRelation(recordId, relatedId);
  return NextResponse.json({ ok: true });
}
