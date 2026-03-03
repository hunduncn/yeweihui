'use client';

import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/lib/auth';

export function NavUserMenu({ user }: { user: AuthUser }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-slate-400">{user.username}</span>
      {user.role === 'admin' && (
        <span className="text-xs bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded font-medium">管理员</span>
      )}
      <button
        onClick={handleLogout}
        className="text-slate-400 hover:text-white transition-colors"
      >
        退出
      </button>
    </div>
  );
}
