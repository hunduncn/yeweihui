import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME, AuthUser } from './auth';

export async function getServerUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Returns a 401/403 Response if not admin, null if ok */
export async function requireAdmin(): Promise<NextResponse | null> {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: '权限不足' }, { status: 403 });
  return null;
}

/** Returns a 401 Response if not logged in, null if ok */
export async function requireLogin(): Promise<NextResponse | null> {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  return null;
}
