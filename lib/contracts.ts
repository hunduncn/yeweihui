import db from './db';

export type ContractType = 'maintenance' | 'management' | 'upkeep' | 'engineering';
export type ContractDirection = 'income' | 'expense';

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  maintenance:  '维保类',
  management:   '管理类',
  upkeep:       '维护类',
  engineering:  '工程类',
};

export interface Contract {
  id: number;
  title: string;
  counterparty: string;
  type: ContractType;
  direction: ContractDirection;
  amount: number;
  sign_date: string;
  start_date?: string;
  end_date?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractAttachment {
  id: number;
  contract_id: number;
  filename: string;
  original_name: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

export interface ContractWithAttachments extends Contract {
  attachments: ContractAttachment[];
}

export interface ContractListParams {
  type?: ContractType;
  direction?: ContractDirection;
  expiring?: boolean; // 30天内到期
  page?: number;
  page_size?: number;
}

export interface ContractStats {
  total: number;
  income_total: number;
  expense_total: number;
  expiring_soon: number; // 30天内
}

export function listContracts(params: ContractListParams = {}): { contracts: Contract[]; total: number } {
  const { type, direction, expiring, page = 1, page_size = 20 } = params;
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (type) { conditions.push('type = ?'); values.push(type); }
  if (direction) { conditions.push('direction = ?'); values.push(direction); }
  if (expiring) {
    conditions.push("end_date IS NOT NULL AND end_date <= date('now','localtime','+30 days') AND end_date >= date('now','localtime')");
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * page_size;

  const total = (db.prepare(`SELECT COUNT(*) as count FROM contracts ${where}`).get(...values) as { count: number }).count;
  const contracts = db.prepare(`SELECT * FROM contracts ${where} ORDER BY sign_date DESC, created_at DESC LIMIT ? OFFSET ?`).all(...values, page_size, offset) as Contract[];

  return { contracts, total };
}

export function getContract(id: number): ContractWithAttachments | null {
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id) as Contract | undefined;
  if (!contract) return null;
  const attachments = db.prepare('SELECT * FROM contract_attachments WHERE contract_id = ? ORDER BY created_at ASC').all(id) as ContractAttachment[];
  return { ...contract, attachments };
}

export function createContract(data: Omit<Contract, 'id' | 'created_at' | 'updated_at'>): Contract {
  const result = db.prepare(`
    INSERT INTO contracts (title, counterparty, type, direction, amount, sign_date, start_date, end_date, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.title, data.counterparty, data.type, data.direction, data.amount,
    data.sign_date, data.start_date ?? null, data.end_date ?? null, data.summary ?? null,
  );
  return getContract(result.lastInsertRowid as number)! as Contract;
}

export function updateContract(id: number, data: Partial<Omit<Contract, 'id' | 'created_at' | 'updated_at'>>): Contract | null {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.title !== undefined)        { fields.push('title = ?');        values.push(data.title); }
  if (data.counterparty !== undefined) { fields.push('counterparty = ?'); values.push(data.counterparty); }
  if (data.type !== undefined)         { fields.push('type = ?');         values.push(data.type); }
  if (data.direction !== undefined)    { fields.push('direction = ?');    values.push(data.direction); }
  if (data.amount !== undefined)       { fields.push('amount = ?');       values.push(data.amount); }
  if (data.sign_date !== undefined)    { fields.push('sign_date = ?');    values.push(data.sign_date); }
  if (data.start_date !== undefined)   { fields.push('start_date = ?');   values.push(data.start_date ?? null); }
  if (data.end_date !== undefined)     { fields.push('end_date = ?');     values.push(data.end_date ?? null); }
  if (data.summary !== undefined)      { fields.push('summary = ?');      values.push(data.summary ?? null); }

  if (!fields.length) return getContract(id) as Contract | null;
  fields.push("updated_at = datetime('now','localtime')");
  values.push(id);

  db.prepare(`UPDATE contracts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getContract(id) as Contract | null;
}

export function deleteContract(id: number): boolean {
  return db.prepare('DELETE FROM contracts WHERE id = ?').run(id).changes > 0;
}

export function getContractStats(): ContractStats {
  const total = (db.prepare('SELECT COUNT(*) as c FROM contracts').get() as { c: number }).c;
  const income_total = (db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM contracts WHERE direction='income'").get() as { s: number }).s;
  const expense_total = (db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM contracts WHERE direction='expense'").get() as { s: number }).s;
  const expiring_soon = (db.prepare(
    "SELECT COUNT(*) as c FROM contracts WHERE end_date IS NOT NULL AND end_date <= date('now','localtime','+30 days') AND end_date >= date('now','localtime')"
  ).get() as { c: number }).c;
  return { total, income_total, expense_total, expiring_soon };
}

export function createContractAttachment(data: Omit<ContractAttachment, 'id' | 'created_at'>): ContractAttachment {
  const result = db.prepare(`
    INSERT INTO contract_attachments (contract_id, filename, original_name, file_type, file_size)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.contract_id, data.filename, data.original_name, data.file_type ?? null, data.file_size ?? null);
  return db.prepare('SELECT * FROM contract_attachments WHERE id = ?').get(result.lastInsertRowid) as ContractAttachment;
}

export function getContractAttachment(id: number): ContractAttachment | null {
  return db.prepare('SELECT * FROM contract_attachments WHERE id = ?').get(id) as ContractAttachment | null;
}

export function deleteContractAttachment(id: number): boolean {
  return db.prepare('DELETE FROM contract_attachments WHERE id = ?').run(id).changes > 0;
}
