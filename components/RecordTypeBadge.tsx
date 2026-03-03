'use client';

import { Badge } from '@/components/ui/badge';
import { RecordType } from '@/lib/records';

const TYPE_CONFIG: Record<RecordType, { label: string; className: string }> = {
  meeting: { label: '会议记录', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  announcement: { label: '公告通知', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  government: { label: '政府往来', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  rights: { label: '维权投诉', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
};

export function RecordTypeBadge({ type }: { type: RecordType }) {
  const config = TYPE_CONFIG[type];
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
}

export { TYPE_CONFIG };
