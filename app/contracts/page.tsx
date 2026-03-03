'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContractTypeBadge } from '@/components/ContractTypeBadge';
import type { Contract, ContractType, ContractStats } from '@/lib/contracts';
import { useIsAdmin } from '@/components/AuthProvider';

const TODAY = new Date().toISOString().slice(0, 10);
const IN30 = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);

function expiryStatus(end_date?: string): 'expired' | 'expiring' | null {
  if (!end_date) return null;
  if (end_date < TODAY) return 'expired';
  if (end_date <= IN30) return 'expiring';
  return null;
}

function fmt(n: number) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TYPE_BORDER: Record<ContractType, string> = {
  maintenance: 'border-l-blue-500',
  management:  'border-l-violet-500',
  upkeep:      'border-l-emerald-500',
  engineering: 'border-l-orange-500',
};

function DeleteConfirmDialog({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-80 space-y-4">
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">确认删除？</p>
          <p className="text-sm text-slate-500 leading-relaxed">
            将删除合同<span className="font-medium text-slate-700">「{title}」</span>，此操作不可撤销。
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>取消</Button>
          <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={onConfirm}>删除</Button>
        </div>
      </div>
    </div>
  );
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('all');
  const [direction, setDirection] = useState('all');
  const [expiring, setExpiring] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);
  const isAdmin = useIsAdmin();
  const PAGE_SIZE = 20;

  const fetch_ = useCallback(async (p = 1) => {
    setLoading(true);
    const sp = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE) });
    if (type !== 'all') sp.set('type', type);
    if (direction !== 'all') sp.set('direction', direction);
    if (expiring) sp.set('expiring', '1');
    const [r1, r2] = await Promise.all([
      fetch(`/api/contracts?${sp}`).then(r => r.json()),
      fetch('/api/contracts/stats').then(r => r.json()),
    ]);
    setContracts(r1.contracts);
    setTotal(r1.total);
    setStats(r2);
    setLoading(false);
  }, [type, direction, expiring]);

  useEffect(() => { setPage(1); fetch_(1); }, [fetch_]);

  const handleDelete = async (id: number) => {
    await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    fetch_(page);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
    {deleteTarget && (
      <DeleteConfirmDialog
        title={deleteTarget.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget.id)}
      />
    )}
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600">← 首页</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">合同管理</h1>
        </div>
        {isAdmin && (
          <Link href="/contracts/new">
            <Button className="bg-indigo-600 hover:bg-indigo-500">+ 新建合同</Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800 rounded-xl p-4 text-white">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-slate-300 mt-0.5">合同总数</div>
          </div>
          <div className="bg-emerald-50 ring-1 ring-emerald-100 rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-700">¥{fmt(stats.income_total)}</div>
            <div className="text-sm text-slate-500 mt-0.5">收入合计</div>
          </div>
          <div className="bg-rose-50 ring-1 ring-rose-100 rounded-xl p-4">
            <div className="text-2xl font-bold text-rose-700">¥{fmt(stats.expense_total)}</div>
            <div className="text-sm text-slate-500 mt-0.5">支出合计</div>
          </div>
          <button
            className={`rounded-xl p-4 text-left transition-all ${expiring ? 'bg-orange-500 text-white' : 'bg-orange-50 ring-1 ring-orange-100 hover:bg-orange-100'}`}
            onClick={() => setExpiring(e => !e)}
          >
            <div className={`text-2xl font-bold ${expiring ? 'text-white' : 'text-orange-600'}`}>{stats.expiring_soon}</div>
            <div className={`text-sm mt-0.5 ${expiring ? 'text-orange-100' : 'text-slate-500'}`}>即将到期</div>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-xl px-4 py-3">
        <Select value={type} onValueChange={v => { setType(v); }}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有类型</SelectItem>
            <SelectItem value="maintenance">维保类</SelectItem>
            <SelectItem value="management">管理类</SelectItem>
            <SelectItem value="upkeep">维护类</SelectItem>
            <SelectItem value="engineering">工程类</SelectItem>
          </SelectContent>
        </Select>
        <Select value={direction} onValueChange={v => { setDirection(v); }}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">收支不限</SelectItem>
            <SelectItem value="income">收入</SelectItem>
            <SelectItem value="expense">支出</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-400 ml-auto">共 {total} 份合同</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">加载中...</div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12 text-slate-400">暂无合同</div>
      ) : (
        <div className="space-y-3">
          {contracts.map(c => {
            const status = expiryStatus(c.end_date);
            return (
              <div key={c.id} className={`bg-white border border-slate-200 border-l-4 ${TYPE_BORDER[c.type]} rounded-xl px-5 py-4 hover:shadow-md transition-shadow`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/contracts/${c.id}`} className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                        {c.title}
                      </Link>
                      <ContractTypeBadge type={c.type} />
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.direction === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {c.direction === 'income' ? '收入' : '支出'}
                      </span>
                      {status === 'expired' && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">已到期</span>}
                      {status === 'expiring' && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">即将到期</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500">
                      <span>{c.counterparty}</span>
                      <span>签署 {c.sign_date}</span>
                      {c.end_date && <span className={status === 'expired' ? 'text-red-500' : status === 'expiring' ? 'text-orange-500' : ''}>到期 {c.end_date}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-lg font-bold ${c.direction === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {c.direction === 'income' ? '+' : '-'}¥{fmt(c.amount)}
                    </span>
                    {isAdmin && (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600" title="编辑" asChild>
                          <Link href={`/contracts/${c.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" title="删除" onClick={() => setDeleteTarget(c)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(p => p - 1); fetch_(page - 1); }}>上一页</Button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); fetch_(page + 1); }}>下一页</Button>
        </div>
      )}
    </div>
    </>
  );
}
