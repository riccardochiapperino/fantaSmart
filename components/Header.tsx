'use client';

import React from 'react';
import { DollarSign, Wallet } from 'lucide-react';

interface Props {
  remainingBudget: number;
  budget: number;
}

export function Header({ remainingBudget, budget }: Props) {
  const spent = budget - remainingBudget;
  const spentPct = Math.min(100, Math.round((spent / budget) * 100));

  return (
    <div className="bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Budget &amp; Crediti Asta
            </span>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
              Spesi: <strong className="text-slate-900 dark:text-slate-200">{spent}</strong> / {budget} cr ({spentPct}%)
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
            Crediti Residui
          </span>
          <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400" suppressHydrationWarning>
            {remainingBudget} <span className="text-xs font-normal text-slate-400">/ {budget} cr</span>
          </span>
        </div>
      </div>
    </div>
  );
}