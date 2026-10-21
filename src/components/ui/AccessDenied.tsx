'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Lock, UserCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function AccessDenied() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            403 • ACCESSO NEGATO
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Area Riservata agli Amministratori
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Il tuo account attuale (<strong className="text-slate-800 dark:text-slate-200">{user?.email || 'Ospite'}</strong>) ha il ruolo <span className="font-bold text-cyan-600 dark:text-cyan-400">[{user?.role || 'USER'}]</span> e non possiede i permessi per modificare il database master dei calciatori.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
          <Link
            href="/hub"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Torna alle Mie Aste
          </Link>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <Lock className="w-4 h-4" /> Accedi con Account Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
