import db from './db';

export interface Counterparty {
  id: number;
  name: string;
  created_at: string;
}

export function listCounterparties(): Counterparty[] {
  return db.prepare('SELECT * FROM counterparties ORDER BY name ASC').all() as Counterparty[];
}

export function findOrCreateCounterparty(name: string): Counterparty {
  const trimmed = name.trim();
  const existing = db.prepare('SELECT * FROM counterparties WHERE name = ?').get(trimmed) as Counterparty | undefined;
  if (existing) return existing;
  const result = db.prepare('INSERT INTO counterparties (name) VALUES (?)').run(trimmed);
  return db.prepare('SELECT * FROM counterparties WHERE id = ?').get(result.lastInsertRowid) as Counterparty;
}

export function updateCounterparty(id: number, name: string): Counterparty | null {
  db.prepare('UPDATE counterparties SET name = ? WHERE id = ?').run(name.trim(), id);
  return db.prepare('SELECT * FROM counterparties WHERE id = ?').get(id) as Counterparty | null;
}

export function deleteCounterparty(id: number): boolean {
  return db.prepare('DELETE FROM counterparties WHERE id = ?').run(id).changes > 0;
}
