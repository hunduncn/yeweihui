import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getContract, ContractType } from '@/lib/contracts';
import { getServerUser } from '@/lib/server-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContractTypeBadge } from '@/components/ContractTypeBadge';
import { ContractDetailClient } from './ContractDetailClient';

const TYPE_ACCENT: Record<ContractType, string> = {
  maintenance: 'border-t-blue-500',
  management:  'border-t-violet-500',
  upkeep:      'border-t-emerald-500',
  engineering: 'border-t-orange-500',
};

function fmt(n: number) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TODAY = new Date().toISOString().slice(0, 10);
const IN30  = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getServerUser();
  const isAdmin = user?.role === 'admin';
  const contract = getContract(parseInt(id));
  if (!contract) notFound();

  const status = !contract.end_date ? null
    : contract.end_date < TODAY  ? 'expired'
    : contract.end_date <= IN30  ? 'expiring'
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/contracts" className="text-sm text-slate-400 hover:text-slate-600">← 合同列表</Link>
        {isAdmin && (
          <Link href={`/contracts/${contract.id}/edit`}>
            <Button variant="outline">编辑</Button>
          </Link>
        )}
      </div>

      <Card className={`border-t-4 ${TYPE_ACCENT[contract.type]} shadow-sm`}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <CardTitle className="text-xl">{contract.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <ContractTypeBadge type={contract.type} />
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${contract.direction === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {contract.direction === 'income' ? '收入' : '支出'}
                </span>
                {status === 'expired'  && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">已到期</span>}
                {status === 'expiring' && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">即将到期</span>}
              </div>
            </div>
            <div className={`text-2xl font-bold ${contract.direction === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {contract.direction === 'income' ? '+' : '-'}¥{fmt(contract.amount)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-medium text-slate-400 mb-0.5">对方单位</div>
              <div className="text-sm text-slate-800">{contract.counterparty}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 mb-0.5">签署日期</div>
              <div className="text-sm text-slate-800">{contract.sign_date}</div>
            </div>
            {contract.start_date && (
              <div>
                <div className="text-xs font-medium text-slate-400 mb-0.5">生效日期</div>
                <div className="text-sm text-slate-800">{contract.start_date}</div>
              </div>
            )}
            {contract.end_date && (
              <div>
                <div className="text-xs font-medium text-slate-400 mb-0.5">到期日期</div>
                <div className={`text-sm font-medium ${status === 'expired' ? 'text-red-600' : status === 'expiring' ? 'text-orange-600' : 'text-slate-800'}`}>
                  {contract.end_date}
                </div>
              </div>
            )}
          </div>

          {contract.summary && (
            <div>
              <div className="text-xs font-medium text-slate-400 mb-1">内容摘要</div>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{contract.summary}</div>
            </div>
          )}

          <div className="text-xs text-slate-400 pt-2 border-t">
            创建于 {contract.created_at}
            {contract.updated_at !== contract.created_at && <span className="ml-3">最后更新 {contract.updated_at}</span>}
          </div>
        </CardContent>
      </Card>

      <ContractDetailClient contractId={contract.id} initialAttachments={contract.attachments} />
    </div>
  );
}
