import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRecord } from '@/lib/records';
import { RecordForm } from '@/components/RecordForm';

export default async function EditRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = getRecord(parseInt(id));

  if (!record) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/records/${record.id}`} className="text-sm text-gray-500 hover:text-gray-700">← 返回详情</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">编辑记录</h1>
      <RecordForm
        mode="edit"
        recordId={record.id}
        initialData={{
          title: record.title,
          type: record.type,
          event_date: record.event_date,
          description: record.description,
          member_ids: record.member_ids,
          other_participants: record.other_participants,
        }}
        initialAttachments={record.attachments}
      />
    </div>
  );
}
