import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import db from './db';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'yeweihui-jwt-secret-change-in-production'
);
const COOKIE_NAME = 'auth-token';
const EXPIRES_DAYS = 30;

export interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'member';
}

interface UserRow {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'member';
}

// ── Password ──────────────────────────────────────────────
export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

// ── JWT ───────────────────────────────────────────────────
export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ id: user.id, username: user.username, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${EXPIRES_DAYS}d`)
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      id: payload.id as number,
      username: payload.username as string,
      role: payload.role as 'admin' | 'member',
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME, EXPIRES_DAYS };

// ── DB helpers ────────────────────────────────────────────
export function findUserByUsername(username: string): UserRow | null {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | null;
}

export function findUserById(id: number): UserRow | null {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | null;
}

export function listUsers(): Omit<UserRow, 'password'>[] {
  return db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at ASC').all() as Omit<UserRow, 'password'>[];
}

export function createUser(username: string, password: string, role: 'admin' | 'member'): Omit<UserRow, 'password'> {
  const hash = hashPassword(password);
  const result = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, hash, role);
  return db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid) as Omit<UserRow, 'password'>;
}

export function updateUserPassword(id: number, password: string): void {
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashPassword(password), id);
}

export function updateUserRole(id: number, role: 'admin' | 'member'): void {
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
}

export function deleteUser(id: number): void {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}
