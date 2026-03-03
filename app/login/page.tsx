'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '登录失败');
        return;
      }
      const from = searchParams.get('from') || '/';
      router.push(from);
      router.refresh();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
          {error}
        </div>
      )}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">用户名</label>
        <Input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="请输入用户名"
          autoComplete="username"
          autoFocus
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">密码</label>
        <Input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="请输入密码"
          autoComplete="current-password"
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-500"
        disabled={loading}
      >
        {loading ? '登录中...' : '登录'}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            <span className="text-indigo-400">业委会</span>
            <span className="text-white">工作留存</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">请登录后继续</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
