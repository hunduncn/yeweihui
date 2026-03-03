import Link from 'next/link';
import { ContractForm } from '@/components/ContractForm';

export default function NewContractPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/contracts" className="text-sm text-slate-400 hover:text-slate-600">← 合同列表</Link>
      <h1 className="text-2xl font-bold text-slate-900 mt-2 mb-6">新建合同</h1>
      <ContractForm mode="create" />
    </div>
  );
}
