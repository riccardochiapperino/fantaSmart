'use client';

import React from 'react';
import { Player } from '@/lib/types';

interface Props {
  squad: Player[];
  avgPerSlot: string;
}

export function KpiBar({ squad, avgPerSlot }: Props) {
  const attackersCount = squad.filter(p => p.role === 'A').length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
        <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">ROSA</span>
          <span className="text-sm font-black text-cyan-600 dark:text-cyan-400" suppressHydrationWarning>{squad.length} / 25</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">MEDIA / SLOT</span>
          <span className="text-sm font-black text-amber-600 dark:text-amber-400" suppressHydrationWarning>{avgPerSlot} cr</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">ATTACCANTI</span>
          <span className="text-sm font-black text-rose-600 dark:text-rose-400" suppressHydrationWarning>{attackersCount} / 6</span>
        </div>
      </div>
    </div>
  );
}