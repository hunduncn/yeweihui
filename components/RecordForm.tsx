'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryAttachmentUploader, Attachment } from './CategoryAttachmentUploader';
import { MemberSelector } from './MemberSelector';
import { RecordType } from '@/lib/records';
import { Member } from '@/lib/members';

const TYPE_PREFIX: Partial<Record<RecordType, string>> = {
  meeting:      '【会议】',
  announcement: '【公告】',
};

interface FormData {
  title: string;
  type: RecordType | '';
  event_date: string;
  description: string;
  member_ids: number[];
  other_participants: string;
}

interface RecordFormProps {
  initialData?: {
    title?: string;
    type?: RecordType;
    event_date?: string;
    description?: string;
    member_ids?: string;   // JSON string from DB
    other_participants?: string;
  };
  recordId?: number;
  initialAttachments?: Attachment[];
  mode: 'create' | 'edit';
  linkAfterCreate?: number; // record id to link to after creating
}

export function RecordForm({ initialData, recordId, initialAttachments = [], mode, linkAfterCreate }: RecordFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    title: initialData?.title ?? (initialData?.type ? (TYPE_PREFIX[initialData.type] ?? '') : '【公告】'),
    type: initialData?.type ?? 'announcement',
    event_date: initialData?.event_date ?? '',
    description: initialData?.description ?? '',
    member_ids: initialData?.member_ids ? JSON.parse(initialData.member_ids) : [],
    other_participants: initialData?.other_participants ?? '',
  });
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [members, setMembers] = useState<Member[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/members').then(r => r.json()).then(setMembers).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.type || !form.event_date) {
      setError('标题、类型和事件日期为必填项');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      ...form,
      member_ids: JSON.stringify(form.member_ids),
    };

    try {
      let res: Response;
      if (mode === 'create') {
        res = await fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/records/${recordId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '操作失败');
        return;
      }

      const record = await res.json();
      if (mode === 'create' && linkAfterCreate) {
        await fetch(`/api/records/${record.id}/relations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ related_id: linkAfterCreate }),
        });
      }
      router.push(`/records/${record.id}`);
      router.refresh();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">记录类型 *</label>
          <Select
            value={form.type}
            disabled={mode === 'edit'}
            onValueChange={v => {
              const newType = v as RecordType;
              const oldPrefix = form.type ? (TYPE_PREFIX[form.type as RecordType] ?? '') : '';
              const newPrefix = TYPE_PREFIX[newType] ?? '';
              const autoTitle = !form.title || form.title === oldPrefix;
              setForm(f => ({ ...f, type: newType, title: autoTitle ? newPrefix : f.title }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">会议记录</SelectItem>
              <SelectItem value="announcement">公告通知</SelectItem>
              <SelectItem value="government">政府往来</SelectItem>
              <SelectItem value="rights">维权投诉</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">事件日期 *</label>
          <Input
            type="date"
            value={form.event_date}
            onChange={e => setForm({ ...form, event_date: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">标题 *</label>
        <Input
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="简短描述此次记录的内容"
          required
        />
      </div>

      {form.type !== 'announcement' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">参与人员</label>
          <MemberSelector
            members={members}
            selectedIds={form.member_ids}
            otherText={form.other_participants}
            onSelectedChange={ids => setForm({ ...form, member_ids: ids })}
            onOtherChange={text => setForm({ ...form, other_participants: text })}
          />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">详细描述</label>
        <Textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="详细记录事件经过、决议内容、处理结果等..."
          rows={6}
        />
      </div>

      {mode === 'edit' && recordId && form.type && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">附件</label>
          <CategoryAttachmentUploader
            recordId={recordId}
            recordType={form.type as RecordType}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
        </div>
      )}

      {mode === 'create' && (
        <p className="text-sm text-gray-500">提示：创建记录后可在详情页上传附件</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? '保存中...' : mode === 'create' ? '创建记录' : '保存修改'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </form>
  );
}
