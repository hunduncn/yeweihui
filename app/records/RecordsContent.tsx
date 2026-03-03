'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, GitBranch } from 'lucide-react';
import { RecordTypeBadge } from '@/components/RecordTypeBadge';
import { RecordType } from '@/lib/records';
import { useIsAdmin } from '@/components/AuthProvider';

const TYPE_BORDER: Record<RecordType, string> = {
  meeting:      'border-l-blue-500',
  announcement: 'border-l-emerald-500',
  government:   'border-l-violet-500',
  rights:       'border-l-rose-500',
};

interface RecordItem {
  id: number;
  title: string;
  type: RecordType;
  event_date: string;
  description?: string;
  participants?: string;
  photos: { id: number }[];
}

function DeleteConfirmDialog({
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
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">确认删除？</p>
          <p className="text-sm text-slate-500 leading-relaxed">
            将删除记录<span className="font-medium text-slate-700">「{title}」</span>，此操作不可撤销。
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

export default function RecordsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<RecordItem | null>(null);

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') || '');

  const PAGE_SIZE = 20;

  const fetchRecords = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (type && type !== 'all') params.set('type', type);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    params.set('page', String(p));
    params.set('page_size', String(PAGE_SIZE));

    try {
      const res = await fetch(`/api/records?${params}`);
      const data = await res.json();
      setRecords(data.records);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [keyword, type, dateFrom, dateTo]);

  useEffect(() => {
    setPage(1);
    fetchRecords(1);
  }, [fetchRecords]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords(1);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/records/${id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    fetchRecords(page);
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
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← 首页</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">所有记录</h1>
        </div>
        {isAdmin && (
          <Link href="/records/new">
            <Button>+ 新增记录</Button>
          </Link>
        )}
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="搜索标题或描述..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="flex-1"
            />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="所有类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类型</SelectItem>
                <SelectItem value="meeting">会议记录</SelectItem>
                <SelectItem value="announcement">公告通知</SelectItem>
                <SelectItem value="government">政府往来</SelectItem>
                <SelectItem value="rights">维权投诉</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full md:w-40"
              placeholder="开始日期"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full md:w-40"
              placeholder="结束日期"
            />
            <Button type="submit">搜索</Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <p className="text-sm text-gray-500 mb-3">共 {total} 条记录</p>

        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>未找到相关记录</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {records.map(record => (
              <Card key={record.id} className={`hover:shadow-md transition-shadow border-l-4 ${TYPE_BORDER[record.type]}`}>
                <CardContent className="py-3.5 px-4">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/records/${record.id}`} className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors leading-snug flex-1 min-w-0">
                      {record.title}
                    </Link>
                    {isAdmin && (
                      <div className="flex gap-0.5 flex-shrink-0">
                        {record.type === 'meeting' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-emerald-600" title="派生公告" asChild>
                            <Link href={`/records/new?from=${record.id}&type=announcement&date=${encodeURIComponent(record.event_date)}&title=${encodeURIComponent(`【公告】${record.title}`)}`}>
                              <GitBranch className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600" title="编辑" asChild>
                          <Link href={`/records/${record.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-red-500"
                          title="删除"
                          onClick={() => setDeleteTarget(record)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <RecordTypeBadge type={record.type} />
                    <span className="text-xs text-slate-400 tabular-nums">{record.event_date}</span>
                  </div>

                  {/* Description */}
                  {record.description && (
                    <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{record.description}</p>
                  )}

                  {/* Photo strip */}
                  {record.photos.length > 0 && (
                    <div className="flex gap-1.5 mt-3">
                      {record.photos.slice(0, 4).map(p => (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          key={p.id}
                          src={`/api/attachments/${p.id}/view`}
                          alt=""
                          className="w-14 h-14 object-cover rounded-lg bg-slate-100 flex-shrink-0"
                        />
                      ))}
                      {record.photos.length > 4 && (
                        <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-400 flex-shrink-0">
                          +{record.photos.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => { setPage(p => p - 1); fetchRecords(page - 1); }}
            >
              上一页
            </Button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => { setPage(p => p + 1); fetchRecords(page + 1); }}
            >
              下一页
            </Button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
