import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecordTypeBadge } from '@/components/RecordTypeBadge';
import { getStats, listRecords } from '@/lib/records';
import { getContractStats } from '@/lib/contracts';
import { getServerUser } from '@/lib/server-auth';

const STAT_CONFIG = {
  meeting:      { icon: '📋', label: '会议记录', bg: 'bg-blue-50',    num: 'text-blue-700',   ring: 'ring-blue-100'   },
  announcement: { icon: '📢', label: '公告通知', bg: 'bg-emerald-50', num: 'text-emerald-700', ring: 'ring-emerald-100' },
  government:   { icon: '🏛️', label: '政府往来', bg: 'bg-violet-50',  num: 'text-violet-700', ring: 'ring-violet-100'  },
  rights:       { icon: '⚖️', label: '维权投诉', bg: 'bg-rose-50',    num: 'text-rose-700',   ring: 'ring-rose-100'   },
} as const;

export default async function HomePage() {
  const user = await getServerUser();
  const isAdmin = user?.role === 'admin';
  const stats = getStats();
  const contractStats = getContractStats();
  const { records: recentRecords } = listRecords({ page: 1, page_size: 10 });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">业委会工作留存系统</h1>
          <p className="text-slate-500 mt-1">证据留存，有据可查</p>
        </div>
        {isAdmin && (
          <Link href="/records/new">
            <Button className="bg-indigo-600 hover:bg-indigo-500">+ 新增记录</Button>
          </Link>
        )}
      </div>

      {/* Type stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.entries(STAT_CONFIG) as [keyof typeof STAT_CONFIG, typeof STAT_CONFIG[keyof typeof STAT_CONFIG]][]).map(([type, cfg]) => (
          <Link href={`/records?type=${type}`} key={type}>
            <div className={`${cfg.bg} rounded-xl p-5 ring-1 ${cfg.ring} hover:shadow-md transition-shadow cursor-pointer`}>
              <div className="text-2xl mb-2">{cfg.icon}</div>
              <div className={`text-3xl font-bold ${cfg.num}`}>{stats.by_type[type]}</div>
              <div className="text-sm text-slate-500 mt-1">{cfg.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 text-white">
          <div className="text-2xl mb-2">📁</div>
          <div className="text-3xl font-bold">{stats.total}</div>
          <div className="text-sm text-slate-300 mt-1">总记录数</div>
        </div>
        <div className="bg-indigo-600 rounded-xl p-5 text-white">
          <div className="text-2xl mb-2">🗓️</div>
          <div className="text-3xl font-bold">{stats.this_month}</div>
          <div className="text-sm text-indigo-200 mt-1">本月新增</div>
        </div>
        <Link href={contractStats.expiring_soon > 0 ? '/contracts?expiring=1' : '/contracts'}>
          <div className={`rounded-xl p-5 h-full ${contractStats.expiring_soon > 0 ? 'bg-orange-500 text-white' : 'bg-orange-50 ring-1 ring-orange-100'}`}>
            <div className="text-2xl mb-2">📋</div>
            <div className={`text-3xl font-bold ${contractStats.expiring_soon > 0 ? 'text-white' : 'text-orange-600'}`}>{contractStats.expiring_soon}</div>
            <div className={`text-sm mt-1 ${contractStats.expiring_soon > 0 ? 'text-orange-100' : 'text-slate-500'}`}>合同即将到期</div>
          </div>
        </Link>
      </div>

      {/* Recent Records */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg text-slate-800">最近记录</CardTitle>
          <Link href="/records" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">查看全部 →</Link>
        </CardHeader>
        <CardContent>
          {recentRecords.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>暂无记录</p>
              <Link href="/records/new">
                <Button variant="outline" className="mt-3">创建第一条记录</Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentRecords.map(record => (
                <li key={record.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/records/${record.id}`} className="font-medium text-slate-900 hover:text-indigo-600 truncate transition-colors">
                        {record.title}
                      </Link>
                      <RecordTypeBadge type={record.type} />
                    </div>
                    <div className="text-sm text-slate-400 mt-0.5">{record.event_date}</div>
                  </div>
                  <Link href={`/records/${record.id}`} className="text-sm text-indigo-600 hover:text-indigo-800 flex-shrink-0 transition-colors">
                    查看 →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
