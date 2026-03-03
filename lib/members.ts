import db from './db';

export interface Member {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
}

export function listMembers(): Member[] {
  return db.prepare('SELECT * FROM members ORDER BY sort_order ASC, id ASC').all() as Member[];
}

export function getMember(id: number): Member | null {
  return db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Member | null;
}

export function createMember(data: { name: string; sort_order?: number }): Member {
  const result = db.prepare(`
    INSERT INTO members (name, sort_order) VALUES (?, ?)
  `).run(data.name, data.sort_order ?? 0);
  return getMember(result.lastInsertRowid as number)!;
}

export function updateMember(id: number, data: { name?: string; sort_order?: number }): Member | null {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }
  if (fields.length === 0) return getMember(id);
  values.push(id);
  db.prepare(`UPDATE members SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getMember(id);
}

export function deleteMember(id: number): boolean {
  const result = db.prepare('DELETE FROM members WHERE id = ?').run(id);
  return result.changes > 0;
}
