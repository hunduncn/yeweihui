'use client';

import { Input } from '@/components/ui/input';
import { Member } from '@/lib/members';

interface MemberSelectorProps {
  members: Member[];
  selectedIds: number[];
  otherText: string;
  onSelectedChange: (ids: number[]) => void;
  onOtherChange: (text: string) => void;
}

export function MemberSelector({ members, selectedIds, otherText, onSelectedChange, onOtherChange }: MemberSelectorProps) {
  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectedChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectedChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      {members.length > 0 ? (
        <div className="space-y-1">
          <div className="text-sm text-gray-500 mb-2">业委会成员（多选）</div>
          <div className="flex flex-wrap gap-2">
            {members.map(m => {
              const checked = selectedIds.includes(m.id);
              return (
                <label
                  key={m.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-sm select-none transition-colors ${
                    checked
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={checked}
                    onChange={() => toggle(m.id)}
                  />
                  {m.name}
                </label>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          尚无成员配置，请先在{' '}
          <a href="/settings" className="text-blue-600 hover:underline" target="_blank">成员管理</a>
          {' '}中添加
        </p>
      )}

      <div className="space-y-1">
        <label className="text-sm text-gray-500">其他人员（选填，逗号分隔）</label>
        <Input
          value={otherText}
          onChange={e => onOtherChange(e.target.value)}
          placeholder="如：物业经理 陈某, 业主代表 刘某"
        />
      </div>
    </div>
  );
}
