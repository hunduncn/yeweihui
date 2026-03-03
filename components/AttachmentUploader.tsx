'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface Attachment {
  id: number;
  original_name: string;
  file_type?: string;
  file_size?: number;
}

interface AttachmentUploaderProps {
  recordId: number;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentUploader({ recordId, attachments, onAttachmentsChange }: AttachmentUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`/api/records/${recordId}/attachments`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const newAttachment = await res.json();
      onAttachmentsChange([...attachments, newAttachment]);
    }
  }, [recordId, attachments, onAttachmentsChange]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadFile(file);
      }
    } finally {
      setUploading(false);
    }
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDelete = async (attachmentId: number) => {
    const res = await fetch(`/api/attachments/${attachmentId}/download`, { method: 'DELETE' });
    if (res.ok) {
      onAttachmentsChange(attachments.filter(a => a.id !== attachmentId));
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div className="text-gray-500">
          <p className="text-sm">拖拽文件到此处，或</p>
          <label className="mt-2 inline-block cursor-pointer">
            <span className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              {uploading ? '上传中...' : '点击选择文件'}
            </span>
            <input
              type="file"
              className="hidden"
              multiple
              disabled={uploading}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={e => handleFiles(e.target.files)}
            />
          </label>
          <p className="text-xs text-gray-400 mt-1">支持图片、PDF、Word、Excel 等文件</p>
        </div>
      </div>

      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map(att => (
            <li key={att.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-500">{att.file_type === 'image' ? '🖼️' : '📄'}</span>
                <a
                  href={`/api/attachments/${att.id}/download`}
                  className="text-blue-600 hover:underline truncate"
                  download
                >
                  {att.original_name}
                </a>
                {att.file_size && (
                  <span className="text-gray-400 text-xs flex-shrink-0">{formatFileSize(att.file_size)}</span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 flex-shrink-0"
                onClick={() => handleDelete(att.id)}
              >
                删除
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
