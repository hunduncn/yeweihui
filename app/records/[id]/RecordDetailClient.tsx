'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryAttachmentUploader, Attachment } from '@/components/CategoryAttachmentUploader';
import { RecordType } from '@/lib/records';
import { useIsAdmin } from '@/components/AuthProvider';

export function RecordDetailClient({
  recordId,
  recordType,
  initialAttachments,
}: {
  recordId: number;
  recordType: RecordType;
  initialAttachments: Attachment[];
}) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const isAdmin = useIsAdmin();

  const photoCount = attachments.filter(a => a.file_type === 'image').length;
  const docCount   = attachments.filter(a => a.file_type !== 'image').length;
  const hasPhotoSlots = recordType === 'meeting' || recordType === 'announcement';

  return (
    <div className="space-y-4">
      {hasPhotoSlots && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-semibold text-slate-800">照片</span>
              {photoCount > 0 && (
                <span className="text-xs text-slate-400 tabular-nums">{photoCount} 张</span>
              )}
            </div>
            <CategoryAttachmentUploader
              recordId={recordId}
              recordType={recordType}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              section="photos"
              readOnly={!isAdmin}
              imageReadOnly
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-semibold text-slate-800">附件</span>
            {docCount > 0 && (
              <span className="text-xs text-slate-400 tabular-nums">{docCount} 个文件</span>
            )}
          </div>
          <CategoryAttachmentUploader
            recordId={recordId}
            recordType={recordType}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            section="documents"
            readOnly={!isAdmin}
          />
        </CardContent>
      </Card>
    </div>
  );
}
