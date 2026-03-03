import { NextRequest, NextResponse } from 'next/server';
import { findUserByUsername, verifyPassword, signToken, COOKIE_NAME, EXPIRES_DAYS } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
  }

  const user = findUserByUsername(username);
  if (!user || !verifyPassword(password, user.password)) {
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
  }

  const token = await signToken({ id: user.id, username: user.username, role: user.role });

  const res = NextResponse.json({ id: user.id, username: user.username, role: user.role });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * EXPIRES_DAYS,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
