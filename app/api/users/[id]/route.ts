import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getServerUser } from '@/lib/server-auth';
import { updateUserPassword, updateUserRole, deleteUser } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const userId = parseInt(id);
  const { password, role } = await req.json();

  if (password !== undefined) {
    if (!password?.trim()) return NextResponse.json({ error: '密码不能为空' }, { status: 400 });
    updateUserPassword(userId, password);
  }
  if (role !== undefined) {
    if (role !== 'admin' && role !== 'member') {
      return NextResponse.json({ error: '无效的角色' }, { status: 400 });
    }
    updateUserRole(userId, role);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const currentUser = await getServerUser();
  const { id } = await params;
  const userId = parseInt(id);

  if (currentUser?.id === userId) {
    return NextResponse.json({ error: '不能删除自己' }, { status: 400 });
  }

  deleteUser(userId);
  return new NextResponse(null, { status: 204 });
}
