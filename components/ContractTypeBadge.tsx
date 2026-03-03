import { Badge } from '@/components/ui/badge';
import type { ContractType } from '@/lib/contracts';

const LABEL: Record<ContractType, string> = {
  maintenance: '维保类',
  management:  '管理类',
  upkeep:      '维护类',
  engineering: '工程类',
};

const STYLE: Record<ContractType, string> = {
  maintenance: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  management:  'bg-violet-100 text-violet-800 hover:bg-violet-100',
  upkeep:      'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  engineering: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
};

export function ContractTypeBadge({ type }: { type: ContractType }) {
  return <Badge className={STYLE[type]}>{LABEL[type]}</Badge>;
}
