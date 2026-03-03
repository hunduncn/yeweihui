'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ContractAttachment } from '@/lib/contracts';
import { useIsAdmin } from '@/components/AuthProvider';

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface Props {
  contractId: number;
  initialAttachments: ContractAttachment[];
}

export function ContractDetailClient({ contractId, initialAttachments }: Props) {
  const [attachments, setAttachments] = useState<ContractAttachment[]>(initialAttachments);
  const isAdmin = useIsAdmin();
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const uploadFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', f);
        const res = await fetch(`/api/contracts/${contractId}/attachments`, { method: 'POST', body: fd });
        if (res.ok) {
          const att = await res.json();
          setAttachments(prev => [...prev, att]);
        }
      }
    } finally {
      setUploading(false);
    }
  }, [contractId]);

  const handleDelete = async (id: number) => {
    await fetch(`/api/contract-attachments/${id}/download`, { method: 'DELETE' });
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">合同附件 ({attachments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {attachments.length > 0 && (
          <ul className="space-y-1.5">
            {attachments.map(att => (
              <li key={att.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-400">{att.file_type === 'image' ? '🖼️' : '📄'}</span>
                  <a
                    href={`/api/contract-attachments/${att.id}/download`}
                    className="text-indigo-600 hover:underline truncate"
                    download
                  >
                    {att.original_name}
                  </a>
                  {att.file_size && <span className="text-slate-400 text-xs flex-shrink-0">{formatSize(att.file_size)}</span>}
                </div>
                {isAdmin && (
                  <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-700 flex-shrink-0" onClick={() => handleDelete(att.id)}>
                    删除
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {isAdmin && (
          <div
            className={`border-2 border-dashed rounded-lg px-4 py-4 text-center transition-colors ${dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); uploadFiles(e.dataTransfer.files); }}
          >
            <label className="cursor-pointer">
              <span className="text-indigo-600 hover:text-indigo-800 text-sm">
                {uploading ? '上传中...' : '拖拽或点击上传合同文件'}
              </span>
              <input
                type="file"
                className="hidden"
                multiple
                disabled={uploading}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={e => uploadFiles(e.target.files)}
              />
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
