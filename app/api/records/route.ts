import { NextRequest, NextResponse } from 'next/server';
import { listRecords, createRecord, getStats, RecordType } from '@/lib/records';
import { requireAdmin } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') as RecordType | null;
  const keyword = searchParams.get('keyword') || undefined;
  const date_from = searchParams.get('date_from') || undefined;
  const date_to = searchParams.get('date_to') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const page_size = parseInt(searchParams.get('page_size') || '20');

  if (searchParams.get('stats') === '1') {
    return NextResponse.json(getStats());
  }

  const result = listRecords({ type: type ?? undefined, keyword, date_from, date_to, page, page_size });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await request.json();
  const { title, type, event_date, description, participants, member_ids, other_participants } = body;

  if (!title || !type || !event_date) {
    return NextResponse.json({ error: '标题、类型和事件日期为必填项' }, { status: 400 });
  }

  const validTypes = ['meeting', 'announcement', 'government', 'rights'];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: '无效的记录类型' }, { status: 400 });
  }

  const record = createRecord({ title, type, event_date, description, participants, member_ids, other_participants });
  return NextResponse.json(record, { status: 201 });
}
