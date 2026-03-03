'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsAdmin, useAuth } from '@/components/AuthProvider';

interface Member { id: number; name: string; sort_order: number; }
interface Counterparty { id: number; name: string; }
interface UserItem { id: number; username: string; role: 'admin' | 'member'; created_at: string; }

function MembersPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [addName, setAddName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Record<number, string>>({});
  const isAdmin = useIsAdmin();

  const fetchMembers = async () => {
    const data = await fetch('/api/members').then(r => r.json());
    setMembers(data);
    setLoading(false);
  };
  useEffect(() => { fetchMembers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: addName.trim() }) });
      if (res.ok) { setAddName(''); await fetchMembers(); }
    } finally { setAdding(false); }
  };

  const startEdit = (m: Member) => setEditing(prev => ({ ...prev, [m.id]: m.name }));
  const cancelEdit = (id: number) => setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
  const saveEdit = async (id: number) => {
    const name = editing[id];
    if (!name?.trim()) return;
    const res = await fetch(`/api/members/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) });
    if (res.ok) { cancelEdit(id); await fetchMembers(); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该成员？')) return;
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
    if (res.ok) await fetchMembers();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">配置业委会委员名单，新建/编辑记录时可多选参与成员</p>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-400 text-sm">加载中...</div>
        ) : members.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">暂无成员，请在下方添加</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {members.map(m => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                {isAdmin && editing[m.id] !== undefined ? (
                  <>
                    <Input value={editing[m.id]} onChange={e => setEditing(prev => ({ ...prev, [m.id]: e.target.value }))} className="h-8 text-sm flex-1" autoFocus onKeyDown={e => { if (e.key === 'Enter') saveEdit(m.id); if (e.key === 'Escape') cancelEdit(m.id); }} />
                    <Button size="sm" onClick={() => saveEdit(m.id)}>保存</Button>
                    <Button size="sm" variant="outline" onClick={() => cancelEdit(m.id)}>取消</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-slate-800">{m.name}</span>
                    {isAdmin && (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-indigo-600" title="编辑" onClick={() => startEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500" title="删除" onClick={() => handleDelete(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {isAdmin && (
        <form onSubmit={handleAdd} className="flex gap-3">
          <Input value={addName} onChange={e => setAddName(e.target.value)} placeholder="输入姓名，回车添加" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(e); } }} />
          <Button type="submit" disabled={adding || !addName.trim()}>{adding ? '添加中...' : '添加'}</Button>
        </form>
      )}
    </div>
  );
}

function CounterpartiesPanel() {
  const [list, setList] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(true);
  const [addName, setAddName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Record<number, string>>({});
  const isAdmin = useIsAdmin();

  const fetchList = async () => {
    const data = await fetch('/api/counterparties').then(r => r.json());
    setList(data);
    setLoading(false);
  };
  useEffect(() => { fetchList(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/counterparties', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: addName.trim() }) });
      if (res.ok) { setAddName(''); await fetchList(); }
    } finally { setAdding(false); }
  };

  const startEdit = (c: Counterparty) => setEditing(prev => ({ ...prev, [c.id]: c.name }));
  const cancelEdit = (id: number) => setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
  const saveEdit = async (id: number) => {
    const name = editing[id];
    if (!name?.trim()) return;
    const res = await fetch(`/api/counterparties/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) });
    if (res.ok) { cancelEdit(id); await fetchList(); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该单位？')) return;
    await fetch(`/api/counterparties/${id}`, { method: 'DELETE' });
    await fetchList();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">合同往来单位名单，新建合同时可直接选择，也会在保存时自动入库</p>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-400 text-sm">加载中...</div>
        ) : list.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">暂无往来单位，新建合同保存后会自动添加</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map(c => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                {isAdmin && editing[c.id] !== undefined ? (
                  <>
                    <Input value={editing[c.id]} onChange={e => setEditing(prev => ({ ...prev, [c.id]: e.target.value }))} className="h-8 text-sm flex-1" autoFocus onKeyDown={e => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') cancelEdit(c.id); }} />
                    <Button size="sm" onClick={() => saveEdit(c.id)}>保存</Button>
                    <Button size="sm" variant="outline" onClick={() => cancelEdit(c.id)}>取消</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-slate-800">{c.name}</span>
                    {isAdmin && (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-indigo-600" title="编辑" onClick={() => startEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500" title="删除" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {isAdmin && (
        <form onSubmit={handleAdd} className="flex gap-3">
          <Input value={addName} onChange={e => setAddName(e.target.value)} placeholder="手动添加单位名称" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(e); } }} />
          <Button type="submit" disabled={adding || !addName.trim()}>{adding ? '添加中...' : '添加'}</Button>
        </form>
      )}
    </div>
  );
}

function AccountsPanel() {
  const currentUser = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUsername, setAddUsername] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<'admin' | 'member'>('member');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [editingPwd, setEditingPwd] = useState<Record<number, string>>({});

  const fetchUsers = async () => {
    const data = await fetch('/api/users').then(r => r.json());
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  };
  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsername.trim() || !addPassword.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: addUsername.trim(), password: addPassword, role: addRole }),
      });
      if (res.ok) {
        setAddUsername(''); setAddPassword(''); setAddRole('member');
        await fetchUsers();
      } else {
        const data = await res.json();
        setAddError(data.error || '添加失败');
      }
    } finally { setAdding(false); }
  };

  const handleRoleToggle = async (user: UserItem) => {
    const newRole = user.role === 'admin' ? 'member' : 'admin';
    await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    await fetchUsers();
  };

  const handleResetPassword = async (id: number) => {
    const pwd = editingPwd[id];
    if (!pwd?.trim()) return;
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
    if (res.ok) {
      setEditingPwd(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`确认删除用户 "${username}"？此操作不可撤销。`)) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    await fetchUsers();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">管理系统登录账号，普通成员只能查看，管理员可进行增删改操作</p>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-400 text-sm">加载中...</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {users.map(u => (
              <li key={u.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="flex-1 font-medium text-slate-800">{u.username}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    {u.role === 'admin' ? '管理员' : '普通成员'}
                  </span>
                  {u.id !== currentUser?.id && (
                    <>
                      <Button size="sm" variant="ghost" className="text-slate-500 text-xs h-7 px-2" onClick={() => handleRoleToggle(u)}>
                        {u.role === 'admin' ? '降为成员' : '升为管理员'}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500" title="删除账号" onClick={() => handleDelete(u.id, u.username)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  {u.id === currentUser?.id && (
                    <span className="text-xs text-slate-400">（当前登录）</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    placeholder="输入新密码以重置"
                    value={editingPwd[u.id] || ''}
                    onChange={e => setEditingPwd(prev => ({ ...prev, [u.id]: e.target.value }))}
                    className="h-7 text-xs flex-1 max-w-xs"
                    onKeyDown={e => { if (e.key === 'Enter') handleResetPassword(u.id); }}
                  />
                  {editingPwd[u.id] && (
                    <Button size="sm" className="h-7 text-xs" onClick={() => handleResetPassword(u.id)}>重置密码</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="text-sm font-medium text-slate-700">添加新账号</div>
        {addError && <p className="text-xs text-red-500">{addError}</p>}
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="用户名"
            value={addUsername}
            onChange={e => setAddUsername(e.target.value)}
            className="flex-1 min-w-28"
          />
          <Input
            type="password"
            placeholder="初始密码"
            value={addPassword}
            onChange={e => setAddPassword(e.target.value)}
            className="flex-1 min-w-28"
          />
          <select
            value={addRole}
            onChange={e => setAddRole(e.target.value as 'admin' | 'member')}
            className="border border-slate-200 rounded-md px-3 text-sm text-slate-700 bg-white"
          >
            <option value="member">普通成员</option>
            <option value="admin">管理员</option>
          </select>
          <Button type="submit" disabled={adding || !addUsername.trim() || !addPassword.trim()}>
            {adding ? '添加中...' : '添加'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  const isAdmin = useIsAdmin();
  const [tab, setTab] = useState<'members' | 'counterparties' | 'accounts'>('members');

  const tabs: Array<['members' | 'counterparties' | 'accounts', string]> = [
    ['members', '成员管理'],
    ['counterparties', '往来单位'],
    ...(isAdmin ? [['accounts', '账号管理'] as ['accounts', string]] : []),
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">设置</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'members' && <MembersPanel />}
      {tab === 'counterparties' && <CounterpartiesPanel />}
      {tab === 'accounts' && isAdmin && <AccountsPanel />}
    </div>
  );
}
