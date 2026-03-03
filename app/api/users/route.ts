import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { listUsers, createUser } from '@/lib/auth';

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;
  return NextResponse.json(listUsers());
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { username, password, role } = await req.json();
  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
  }
  if (role !== 'admin' && role !== 'member') {
    return NextResponse.json({ error: '无效的角色' }, { status: 400 });
  }

  try {
    const user = createUser(username.trim(), password, role);
    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: '用户名已存在' }, { status: 409 });
  }
}
