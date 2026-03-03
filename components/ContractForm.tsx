'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CounterpartyCombobox } from '@/components/CounterpartyCombobox';
import type { ContractType, ContractDirection } from '@/lib/contracts';

interface FormData {
  title: string;
  counterparty: string;
  type: ContractType | '';
  direction: ContractDirection | '';
  amount: string;
  sign_date: string;
  start_date: string;
  end_date: string;
  summary: string;
}

interface ContractFormProps {
  initialData?: Partial<FormData>;
  contractId?: number;
  mode: 'create' | 'edit';
}

export function ContractForm({ initialData, contractId, mode }: ContractFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    title:        initialData?.title        ?? '',
    counterparty: initialData?.counterparty ?? '',
    type:         initialData?.type         ?? '',
    direction:    initialData?.direction    ?? '',
    amount:       initialData?.amount       ?? '',
    sign_date:    initialData?.sign_date    ?? '',
    start_date:   initialData?.start_date   ?? '',
    end_date:     initialData?.end_date     ?? '',
    summary:      initialData?.summary      ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.counterparty || !form.type || !form.direction || !form.amount || !form.sign_date) {
      setError('标题、对方单位、类型、收支、金额、签署日期为必填项');
      return;
    }
    setSubmitting(true);
    setError('');

    const payload = { ...form, amount: Number(form.amount) };

    try {
      const res = mode === 'create'
        ? await fetch('/api/contracts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch(`/api/contracts/${contractId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      if (!res.ok) { setError((await res.json()).error || '操作失败'); return; }
      const contract = await res.json();
      router.push(`/contracts/${contract.id}`);
      router.refresh();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {/* 基本信息 */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">合同名称 *</label>
        <Input value={form.title} onChange={set('title')} placeholder="如：2026年电梯维保合同" required />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">对方单位 *</label>
        <CounterpartyCombobox
          value={form.counterparty}
          onChange={v => setForm(f => ({ ...f, counterparty: v }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">合同类型 *</label>
          <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as ContractType }))}>
            <SelectTrigger><SelectValue placeholder="选择类型" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="maintenance">维保类</SelectItem>
              <SelectItem value="management">管理类</SelectItem>
              <SelectItem value="upkeep">维护类</SelectItem>
              <SelectItem value="engineering">工程类</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">收支方向 *</label>
          <Select value={form.direction} onValueChange={v => setForm(f => ({ ...f, direction: v as ContractDirection }))}>
            <SelectTrigger><SelectValue placeholder="选择收支" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">收入</SelectItem>
              <SelectItem value="expense">支出</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">合同总价（元） *</label>
        <Input type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" required />
      </div>

      {/* 日期 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">签署日期 *</label>
          <Input type="date" value={form.sign_date} onChange={set('sign_date')} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">生效日期</label>
          <Input type="date" value={form.start_date} onChange={set('start_date')} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">到期日期</label>
          <Input type="date" value={form.end_date} onChange={set('end_date')} />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">内容摘要</label>
        <Textarea value={form.summary} onChange={set('summary')} placeholder="合同主要条款、服务范围等..." rows={4} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500" disabled={submitting}>
          {submitting ? '保存中...' : mode === 'create' ? '创建合同' : '保存修改'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>取消</Button>
      </div>
    </form>
  );
}
