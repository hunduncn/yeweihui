import db from './db';

export type RecordType = 'meeting' | 'announcement' | 'government' | 'rights';

export interface WorkRecord {
  id: number;
  title: string;
  type: RecordType;
  event_date: string;
  description?: string;
  participants?: string;
  member_ids?: string;         // JSON array string e.g. "[1,2,3]"
  other_participants?: string; // free-text additional attendees
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: number;
  record_id: number;
  filename: string;
  original_name: string;
  file_type?: string;
  file_size?: number;
  category?: string; // 'scene'|'notes'|'closeup'|'medium'|'other'
  created_at: string;
}

export interface WorkRecordWithAttachments extends WorkRecord {
  attachments: Attachment[];
}

export interface ListParams {
  type?: RecordType;
  keyword?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export function listRecords(params: ListParams = {}): { records: (WorkRecord & { photos: { id: number }[] })[]; total: number } {
  const { type, keyword, date_from, date_to, page = 1, page_size = 20 } = params;
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (type) {
    conditions.push('type = ?');
    values.push(type);
  }
  if (keyword) {
    conditions.push('(title LIKE ? OR description LIKE ?)');
    values.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (date_from) {
    conditions.push('event_date >= ?');
    values.push(date_from);
  }
  if (date_to) {
    conditions.push('event_date <= ?');
    values.push(date_to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * page_size;

  const total = (db.prepare(`SELECT COUNT(*) as count FROM records ${where}`).get(...values) as { count: number }).count;
  const records = db.prepare(`SELECT * FROM records ${where} ORDER BY event_date DESC, created_at DESC LIMIT ? OFFSET ?`).all(...values, page_size, offset) as WorkRecord[];

  if (records.length === 0) return { records: [], total };

  const ids = records.map(r => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const photoRows = db.prepare(
    `SELECT id, record_id FROM attachments WHERE record_id IN (${placeholders}) AND file_type = 'image' ORDER BY created_at ASC`
  ).all(...ids) as { id: number; record_id: number }[];

  const photosByRecord = new Map<number, { id: number }[]>();
  for (const p of photoRows) {
    const arr = photosByRecord.get(p.record_id) ?? [];
    arr.push({ id: p.id });
    photosByRecord.set(p.record_id, arr);
  }

  return {
    records: records.map(r => ({ ...r, photos: photosByRecord.get(r.id) ?? [] })),
    total,
  };
}

export function getRecord(id: number): WorkRecordWithAttachments | null {
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(id) as WorkRecord | undefined;
  if (!record) return null;

  const attachments = db.prepare('SELECT * FROM attachments WHERE record_id = ? ORDER BY created_at ASC').all(id) as Attachment[];
  return { ...record, attachments };
}

export function createRecord(data: Omit<WorkRecord, 'id' | 'created_at' | 'updated_at'>): WorkRecord {
  const stmt = db.prepare(`
    INSERT INTO records (title, type, event_date, description, participants, member_ids, other_participants)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.title, data.type, data.event_date,
    data.description ?? null, data.participants ?? null,
    data.member_ids ?? null, data.other_participants ?? null,
  );
  return getRecord(result.lastInsertRowid as number)! as WorkRecord;
}

export function updateRecord(id: number, data: Partial<Omit<WorkRecord, 'id' | 'created_at' | 'updated_at'>>): WorkRecord | null {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
  if (data.event_date !== undefined) { fields.push('event_date = ?'); values.push(data.event_date); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.participants !== undefined) { fields.push('participants = ?'); values.push(data.participants); }
  if (data.member_ids !== undefined) { fields.push('member_ids = ?'); values.push(data.member_ids); }
  if (data.other_participants !== undefined) { fields.push('other_participants = ?'); values.push(data.other_participants); }

  if (fields.length === 0) return getRecord(id) as WorkRecord | null;

  fields.push("updated_at = datetime('now', 'localtime')");
  values.push(id);

  db.prepare(`UPDATE records SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getRecord(id) as WorkRecord | null;
}

export function deleteRecord(id: number): boolean {
  const result = db.prepare('DELETE FROM records WHERE id = ?').run(id);
  return result.changes > 0;
}

export function createAttachment(data: Omit<Attachment, 'id' | 'created_at'>): Attachment {
  const stmt = db.prepare(`
    INSERT INTO attachments (record_id, filename, original_name, file_type, file_size, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.record_id, data.filename, data.original_name,
    data.file_type ?? null, data.file_size ?? null, data.category ?? 'other',
  );
  return db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid) as Attachment;
}

export function getAttachment(id: number): Attachment | null {
  return db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as Attachment | null;
}

export function deleteAttachment(id: number): boolean {
  const result = db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getStats(): {
  total: number;
  by_type: { [K in RecordType]: number };
  this_month: number;
} {
  const total = (db.prepare("SELECT COUNT(*) as count FROM records").get() as { count: number }).count;

  const byTypeRows = db.prepare("SELECT type, COUNT(*) as count FROM records GROUP BY type").all() as { type: RecordType; count: number }[];
  const by_type: { [K in RecordType]: number } = { meeting: 0, announcement: 0, government: 0, rights: 0 };
  byTypeRows.forEach(row => { by_type[row.type] = row.count; });

  const this_month = (db.prepare(`
    SELECT COUNT(*) as count FROM records
    WHERE strftime('%Y-%m', event_date) = strftime('%Y-%m', 'now', 'localtime')
  `).get() as { count: number }).count;

  return { total, by_type, this_month };
}
