import { Suspense } from 'react';
import RecordsContent from './RecordsContent';

export default function RecordsPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8 text-gray-400">加载中...</div>}>
      <RecordsContent />
    </Suspense>
  );
}
