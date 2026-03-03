'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ImageLightbox } from './ImageLightbox';
import { RecordType } from '@/lib/records';

export interface Attachment {
  id: number;
  original_name: string;
  file_type?: string;
  file_size?: number;
  category?: string;
}

interface SlotConfig {
  key: string;
  label: string;
  hint: string;
  accept: string;
}

// photo-only slots (scene / notes / closeup / medium)
const MEETING_PHOTO_SLOTS: SlotConfig[] = [
  { key: 'scene', label: '现场照片', hint: '仅图片', accept: 'image/*' },
  { key: 'notes', label: '记录照片', hint: '仅图片', accept: 'image/*' },
];
const ANNOUNCEMENT_PHOTO_SLOTS: SlotConfig[] = [
  { key: 'closeup', label: '全景照片', hint: '仅图片', accept: 'image/*' },
  { key: 'medium',  label: '近景照片', hint: '仅图片', accept: 'image/*' },
];

// document-only slots
const DOC_SLOT: SlotConfig = { key: 'other', label: '其他文件', hint: '文档/图片/PDF', accept: 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt' };
const GENERIC_DOC_SLOT: SlotConfig = { key: 'other', label: '附件', hint: '文档/图片/PDF', accept: 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt' };

// "all" slots for RecordForm edit mode (combined, unchanged UX)
const MEETING_ALL_SLOTS: SlotConfig[] = [...MEETING_PHOTO_SLOTS, DOC_SLOT];
const ANNOUNCEMENT_ALL_SLOTS: SlotConfig[] = [...ANNOUNCEMENT_PHOTO_SLOTS, DOC_SLOT];
const GENERIC_ALL_SLOTS: SlotConfig[] = [GENERIC_DOC_SLOT];

function getSlotsForType(type: RecordType, section?: 'photos' | 'documents'): SlotConfig[] {
  if (section === 'photos') {
    if (type === 'meeting')      return MEETING_PHOTO_SLOTS;
    if (type === 'announcement') return ANNOUNCEMENT_PHOTO_SLOTS;
    return []; // government / rights have no named photo slots
  }
  if (section === 'documents') {
    if (type === 'meeting' || type === 'announcement') return [DOC_SLOT];
    return [GENERIC_DOC_SLOT];
  }
  // all (default — used in RecordForm edit)
  if (type === 'meeting')      return MEETING_ALL_SLOTS;
  if (type === 'announcement') return ANNOUNCEMENT_ALL_SLOTS;
  return GENERIC_ALL_SLOTS;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Image grid: click to enlarge
function ImageGrid({
  images,
  onDelete,
  readOnly = false,
}: {
  images: Attachment[];
  onDelete: (id: number) => void;
  readOnly?: boolean;
}) {
  const [lightbox, setLightbox] = useState<Attachment | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map(att => (
          <div key={att.id} className="relative group aspect-square">
            <button
              type="button"
              onClick={() => setLightbox(att)}
              className="w-full h-full rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-400 transition-all focus:outline-none"
              title={att.original_name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/attachments/${att.id}/view`}
                alt={att.original_name}
                className="w-full h-full object-cover"
              />
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={() => onDelete(att.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500"
                title="删除"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {lightbox && (
        <ImageLightbox
          src={`/api/attachments/${lightbox.id}/view`}
          name={lightbox.original_name}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

// Document list row
function DocList({
  docs,
  onDelete,
  readOnly = false,
}: {
  docs: Attachment[];
  onDelete: (id: number) => void;
  readOnly?: boolean;
}) {
  if (docs.length === 0) return null;

  return (
    <ul className="space-y-1.5">
      {docs.map(att => (
        <li key={att.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded border text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-gray-400">📄</span>
            <a href={`/api/attachments/${att.id}/download`} className="text-blue-600 hover:underline truncate" download>
              {att.original_name}
            </a>
            {att.file_size && (
              <span className="text-gray-400 text-xs flex-shrink-0">{formatFileSize(att.file_size)}</span>
            )}
          </div>
          {!readOnly && (
            <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-700 flex-shrink-0" onClick={() => onDelete(att.id)}>
              删除
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

interface SlotUploaderProps {
  slot: SlotConfig;
  attachments: Attachment[];
  recordId: number;
  onAdd: (att: Attachment) => void;
  onRemove: (id: number) => void;
  imageReadOnly?: boolean;
  readOnly?: boolean;
}

function SlotUploader({ slot, attachments, recordId, onAdd, onRemove, imageReadOnly, readOnly }: SlotUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const images = attachments.filter(a => a.file_type === 'image');
  const docs   = attachments.filter(a => a.file_type !== 'image');
  const hasContent = images.length > 0 || docs.length > 0;

  const uploadFile = useCallback(async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', slot.key);
    const res = await fetch(`/api/records/${recordId}/attachments`, { method: 'POST', body: fd });
    if (res.ok) {
      const att = await res.json();
      onAdd(att);
    }
  }, [recordId, slot.key, onAdd]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) await uploadFile(f);
    } finally { setUploading(false); }
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div
      className={`space-y-3 rounded-xl transition-all ${!readOnly && dragging ? 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50/40' : ''}`}
      onDragOver={!readOnly ? e => { e.preventDefault(); setDragging(true); } : undefined}
      onDragLeave={!readOnly ? () => setDragging(false) : undefined}
      onDrop={!readOnly ? handleDrop : undefined}
    >
      {/* Slot header with underline divider */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">{slot.label}</span>
          {images.length > 0 && (
            <span className="text-xs tabular-nums text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5 leading-none">{images.length}</span>
          )}
        </div>
        {!readOnly && (
          <label className={`cursor-pointer text-xs font-medium transition-colors ${uploading ? 'text-slate-300 pointer-events-none' : 'text-indigo-500 hover:text-indigo-700'}`}>
            {uploading ? '上传中…' : '+ 上传'}
            <input type="file" className="hidden" multiple disabled={uploading} accept={slot.accept} onChange={e => handleFiles(e.target.files)} />
          </label>
        )}
      </div>

      <ImageGrid images={images} onDelete={onRemove} readOnly={readOnly || imageReadOnly} />
      <DocList docs={docs} onDelete={onRemove} readOnly={readOnly} />

      {/* Empty state hint */}
      {!hasContent && !readOnly && (
        <p className="text-xs text-slate-300 py-2 text-center">拖拽照片到此处上传</p>
      )}
      {!hasContent && readOnly && (
        <p className="text-xs text-slate-300 py-1.5">暂无内容</p>
      )}
    </div>
  );
}

interface CategoryAttachmentUploaderProps {
  recordId: number;
  recordType: RecordType;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  section?: 'photos' | 'documents'; // omit for "all" (RecordForm edit mode)
  imageReadOnly?: boolean;
  readOnly?: boolean;
}

export function CategoryAttachmentUploader({ recordId, recordType, attachments, onAttachmentsChange, section, imageReadOnly, readOnly }: CategoryAttachmentUploaderProps) {
  const slots = getSlotsForType(recordType, section);

  const handleAdd = useCallback((att: Attachment) => {
    onAttachmentsChange([...attachments, att]);
  }, [attachments, onAttachmentsChange]);

  const handleRemove = useCallback(async (id: number) => {
    await fetch(`/api/attachments/${id}/download`, { method: 'DELETE' });
    onAttachmentsChange(attachments.filter(a => a.id !== id));
  }, [attachments, onAttachmentsChange]);

  return (
    <div className="space-y-5">
      {slots.map(slot => (
        <SlotUploader
          key={slot.key}
          slot={slot}
          attachments={attachments.filter(a => (a.category ?? 'other') === slot.key)}
          recordId={recordId}
          onAdd={handleAdd}
          onRemove={handleRemove}
          imageReadOnly={imageReadOnly}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
