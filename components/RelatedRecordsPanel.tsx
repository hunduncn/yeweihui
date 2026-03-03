'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RecordTypeBadge } from './RecordTypeBadge';
import { RecordType, WorkRecord } from '@/lib/records';
import { useIsAdmin } from './AuthProvider';

const DERIVE_MAP: Partial<Record<RecordType, { type: RecordType; label: string }>> = {
  meeting:      { type: 'announcement', label: '派生公告' },
  announcement: { type: 'meeting',      label: '追溯会议' },
};

interface Props {
  recordId: number;
  recordType: RecordType;
  recordTitle: string;
  recordDate: string;
  initialRelated: WorkRecord[];
}

function ConfirmDialog({
  title,
  onConfirm,
  onCancel,
}: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-80 space-y-4">
        <p className="text-sm text-slate-700 leading-relaxed">
          确认解除与<br />
          <span className="font-medium text-slate-900">「{title}」</span><br />
          的关联？
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>取消</Button>
          <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={onConfirm}>解除</Button>
        </div>
      </div>
    </div>
  );
}

export function RelatedRecordsPanel({
  recordId,
  recordType,
  recordTitle,
  recordDate,
  initialRelated,
}: Props) {
  const [related, setRelated] = useState<WorkRecord[]>(initialRelated);
  const [unlinking, setUnlinking] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<WorkRecord | null>(null);

  // Picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [candidates, setCandidates] = useState<WorkRecord[]>([]);
  const [keyword, setKeyword] = useState('');
  const [linking, setLinking] = useState<number | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const derive = DERIVE_MAP[recordType];
  const isAdmin = useIsAdmin();

  // Re-fetch on mount so client state is fresh after derive navigation
  useEffect(() => {
    fetch(`/api/records/${recordId}/relations`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRelated(data); })
      .catch(() => {});
  }, [recordId]);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const openPicker = async () => {
    if (!derive) return;
    setKeyword('');
    setPickerOpen(true);
    const res = await fetch(`/api/records?type=${derive.type}&page_size=50`);
    const data = await res.json();
    // Exclude already-related and self
    const relatedIds = new Set([recordId, ...related.map(r => r.id)]);
    setCandidates((data.records as WorkRecord[]).filter(r => !relatedIds.has(r.id)));
  };

  const handleLink = async (targetId: number) => {
    setLinking(targetId);
    try {
      await fetch(`/api/records/${recordId}/relations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ related_id: targetId }),
      });
      const linked = candidates.find(c => c.id === targetId)!;
      setRelated(prev => [linked, ...prev]);
      setCandidates(prev => prev.filter(c => c.id !== targetId));
      setPickerOpen(false);
    } finally {
      setLinking(null);
    }
  };

  const handleUnlink = async (relatedId: number) => {
    setUnlinking(relatedId);
    try {
      await fetch(`/api/records/${recordId}/relations/${relatedId}`, { method: 'DELETE' });
      setRelated(prev => prev.filter(r => r.id !== relatedId));
    } finally {
      setUnlinking(null);
    }
  };

  const filtered = keyword
    ? candidates.filter(c => c.title.includes(keyword) || c.event_date.includes(keyword))
    : candidates;

  const newRecordUrl = derive
    ? `/records/new?from=${recordId}&type=${derive.type}&date=${encodeURIComponent(recordDate)}&title=${encodeURIComponent(derive.type === 'announcement' ? `【公告】${recordTitle}` : `【会议】${recordTitle}`)}`
    : null;

  return (
    <>
    {confirmTarget && (
      <ConfirmDialog
        title={confirmTarget.title}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => {
          handleUnlink(confirmTarget.id);
          setConfirmTarget(null);
        }}
      />
    )}
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">关联记录</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {related.length === 0 && (
          <p className="text-sm text-slate-400">暂无关联记录</p>
        )}
        {related.map(r => (
          <div key={r.id} className="flex items-center gap-2 py-1.5 border-b last:border-0">
            <RecordTypeBadge type={r.type} />
            <span className="text-sm text-slate-500 shrink-0">{r.event_date}</span>
            <span className="text-sm text-slate-800 flex-1 truncate">{r.title}</span>
            <Link href={`/records/${r.id}`}>
              <Button variant="ghost" size="sm" className="text-xs px-2 h-7">跳转</Button>
            </Link>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs px-2 h-7 text-red-500 hover:text-red-700"
                disabled={unlinking === r.id}
                onClick={() => setConfirmTarget(r)}
              >
                {unlinking === r.id ? '...' : '解除'}
              </Button>
            )}
          </div>
        ))}

        {derive && isAdmin && (
          <div className="pt-2 relative" ref={pickerRef}>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={openPicker}>
                + 关联已有{derive.label === '追溯会议' ? '会议' : '公告'}
              </Button>
              {newRecordUrl && (
                <Link href={newRecordUrl}>
                  <Button variant="ghost" size="sm" className="text-xs text-slate-500">
                    新建{derive.label === '追溯会议' ? '会议' : '公告'}
                  </Button>
                </Link>
              )}
            </div>

            {pickerOpen && (
              <div className="absolute left-0 top-9 z-20 w-96 bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-2">
                <Input
                  placeholder="搜索标题或日期..."
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filtered.length === 0 && (
                    <p className="text-sm text-slate-400 py-3 text-center">没有可关联的记录</p>
                  )}
                  {filtered.map(c => (
                    <button
                      key={c.id}
                      className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                      disabled={linking === c.id}
                      onClick={() => handleLink(c.id)}
                    >
                      <span className="text-xs text-slate-400 shrink-0 w-20">{c.event_date}</span>
                      <span className="text-sm text-slate-800 flex-1 truncate">{c.title}</span>
                      <span className="text-xs text-indigo-600 shrink-0">
                        {linking === c.id ? '关联中...' : '关联'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
