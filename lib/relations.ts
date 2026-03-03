import db from './db';
import { WorkRecord } from './records';

function normalize(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a];
}

export function getRelatedRecords(id: number): WorkRecord[] {
  return db.prepare(`
    SELECT r.* FROM records r
    JOIN record_relations rel ON (
      (rel.source_id = ? AND rel.target_id = r.id) OR
      (rel.target_id = ? AND rel.source_id = r.id)
    )
    ORDER BY r.event_date DESC, r.created_at DESC
  `).all(id, id) as WorkRecord[];
}

export function createRelation(a: number, b: number): boolean {
  const [src, tgt] = normalize(a, b);
  const result = db.prepare(`
    INSERT OR IGNORE INTO record_relations (source_id, target_id) VALUES (?, ?)
  `).run(src, tgt);
  return result.changes > 0;
}

export function deleteRelation(a: number, b: number): boolean {
  const [src, tgt] = normalize(a, b);
  const result = db.prepare(`
    DELETE FROM record_relations WHERE source_id = ? AND target_id = ?
  `).run(src, tgt);
  return result.changes > 0;
}
