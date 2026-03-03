import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRecord, RecordType } from '@/lib/records';
import { listMembers } from '@/lib/members';
import { getRelatedRecords } from '@/lib/relations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecordTypeBadge } from '@/components/RecordTypeBadge';
import { RecordDetailClient } from './RecordDetailClient';
import { RelatedRecordsPanel } from '@/components/RelatedRecordsPanel';
import { getServerUser } from '@/lib/server-auth';

const TYPE_ACCENT: Record<RecordType, string> = {
  meeting:      'border-t-blue-500',
  announcement: 'border-t-emerald-500',
  government:   'border-t-violet-500',
  rights:       'border-t-rose-500',
};

const TYPE_DATE_COLOR: Record<RecordType, string> = {
  meeting:      'text-blue-700 bg-blue-50',
  announcement: 'text-emerald-700 bg-emerald-50',
  government:   'text-violet-700 bg-violet-50',
  rights:       'text-rose-700 bg-rose-50',
};

export default async function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getServerUser();
  const isAdmin = user?.role === 'admin';
  const record = getRecord(parseInt(id));

  if (!record) {
    notFound();
  }

  const allMembers = listMembers();
  const relatedRecords = getRelatedRecords(record.id);
  const memberIds: number[] = record.member_ids ? JSON.parse(record.member_ids) : [];
  const memberNames = memberIds
    .map(mid => allMembers.find(m => m.id === mid))
    .filter(Boolean)
    .map(m => m!.name);

  const hasParticipants = memberNames.length > 0 || record.other_participants || record.participants;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/records" className="text-sm text-gray-500 hover:text-gray-700">← 返回列表</Link>
        {isAdmin && (
          <Link href={`/records/${record.id}/edit`}>
            <Button variant="outline" size="sm">编辑</Button>
          </Link>
        )}
      </div>

      <Card className={`border-t-4 ${TYPE_ACCENT[record.type]} shadow-sm`}>
        <CardHeader className="pb-2">
          {/* Type + Date row */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <RecordTypeBadge type={record.type} />
            <time className={`text-sm font-semibold px-2.5 py-1 rounded-lg tabular-nums ${TYPE_DATE_COLOR[record.type]}`}>
              {record.event_date}
            </time>
          </div>

          {/* Title */}
          <CardTitle className="text-xl leading-snug text-slate-900">{record.title}</CardTitle>

          {/* Participant chips — right under the title */}
          {hasParticipants && record.type !== 'announcement' && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {memberNames.map(name => (
                <span key={name} className="inline-flex items-center text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-medium">
                  {name}
                </span>
              ))}
              {record.other_participants && (
                <span className="inline-flex items-center text-xs px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full border border-slate-200">
                  {record.other_participants}
                </span>
              )}
              {/* legacy field */}
              {!memberNames.length && !record.other_participants && record.participants && (
                <span className="text-xs text-slate-500">{record.participants}</span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-2 space-y-4">
          {record.description && (
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
              {record.description}
            </p>
          )}

          <div className="text-xs text-gray-400 pt-3 border-t border-slate-100">
            创建于 {record.created_at}
            {record.updated_at !== record.created_at && (
              <span className="ml-3">最后更新 {record.updated_at}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {(record.type === 'meeting' || record.type === 'announcement') && (
        <RelatedRecordsPanel
          recordId={record.id}
          recordType={record.type}
          recordTitle={record.title}
          recordDate={record.event_date}
          initialRelated={relatedRecords}
        />
      )}

      <RecordDetailClient
        recordId={record.id}
        recordType={record.type}
        initialAttachments={record.attachments}
      />
    </div>
  );
}
