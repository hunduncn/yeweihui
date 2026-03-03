import Link from 'next/link';
import { RecordForm } from '@/components/RecordForm';
import { RecordType } from '@/lib/records';

interface Props {
  searchParams: Promise<{ from?: string; type?: string; date?: string; title?: string }>;
}

export default async function NewRecordPage({ searchParams }: Props) {
  const sp = await searchParams;
  const fromId = sp.from ? parseInt(sp.from) : undefined;
  const hasFrom = fromId && !isNaN(fromId);

  const initialData = hasFrom
    ? {
        type: sp.type as RecordType | undefined,
        event_date: sp.date,
        title: sp.title,
      }
    : undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/records" className="text-sm text-gray-500 hover:text-gray-700">← 返回列表</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">新增记录</h1>
      <RecordForm
        mode="create"
        initialData={initialData}
        linkAfterCreate={hasFrom ? fromId : undefined}
      />
    </div>
  );
}
