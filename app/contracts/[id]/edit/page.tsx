import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getContract } from '@/lib/contracts';
import { ContractForm } from '@/components/ContractForm';

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contract = getContract(parseInt(id));
  if (!contract) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/contracts/${contract.id}`} className="text-sm text-slate-400 hover:text-slate-600">← 返回详情</Link>
      <h1 className="text-2xl font-bold text-slate-900 mt-2 mb-6">编辑合同</h1>
      <ContractForm
        mode="edit"
        contractId={contract.id}
        initialData={{
          title:        contract.title,
          counterparty: contract.counterparty,
          type:         contract.type,
          direction:    contract.direction,
          amount:       String(contract.amount),
          sign_date:    contract.sign_date,
          start_date:   contract.start_date ?? '',
          end_date:     contract.end_date ?? '',
          summary:      contract.summary ?? '',
        }}
      />
    </div>
  );
}
