'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface Counterparty {
  id: number;
  name: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CounterpartyCombobox({ value, onChange, placeholder = '输入或选择单位名称' }: Props) {
  const [options, setOptions] = useState<Counterparty[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/counterparties').then(r => r.json()).then(setOptions).catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = value.trim()
    ? options.filter(o => o.name.includes(value.trim()))
    : options;

  const exactMatch = options.some(o => o.name === value.trim());

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />

      {open && (filtered.length > 0 || (!exactMatch && value.trim())) && (
        <div className="absolute left-0 top-full mt-1 z-20 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {filtered.map(o => (
            <button
              key={o.id}
              type="button"
              className="w-full text-left px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-50 transition-colors"
              onMouseDown={e => { e.preventDefault(); onChange(o.name); setOpen(false); }}
            >
              {o.name}
            </button>
          ))}
          {!exactMatch && value.trim() && (
            <div className="px-4 py-2.5 text-sm text-slate-400 border-t border-slate-100">
              新单位：将在保存时自动添加
            </div>
          )}
        </div>
      )}
    </div>
  );
}
