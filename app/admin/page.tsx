'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowLeft,
  Settings,
  RotateCcw,
  Download,
  Upload,
  Search,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useFanta } from '@/hooks/useFanta';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { AdminTab } from '@/components/tabs/AdminTab';
import { LogoWithText } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const fanta = useFanta();

  // 1. Auth Guard: Se non autenticato, reindirizza a /login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-bold text-sm animate-pulse">
        Verifica autorizzazioni di sicurezza...
      </div>
    );
  }

  // 2. RBAC Guard: Se non è ADMIN, mostra AccessDenied (403 Forbidden)
  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between">
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/hub">
              <LogoWithText />
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="max-w-4xl mx-auto w-full p-4">
          <AccessDenied />
        </main>

        <footer className="py-4 text-center text-xs text-slate-400">
          FantaSmart RBAC Security Guard
        </footer>
      </div>
    );
  }

  // 3. ADMIN AUTORIZZATO: Mostra la dashboard completa
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/hub"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Torna all'Hub</span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                  <span>GESTIONE DATABASE CALCIATORI</span>
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                    AMMINISTRATORE
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Modifica e personalizza le quotazioni, i ruoli e la titolarità dei 515 calciatori
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Admin Tab View */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
        <AdminTab
          players={fanta.players}
          onUpdateStatus={fanta.updatePlayerStatus}
          onExport={fanta.exportBackup}
          onImport={fanta.importBackup}
          onResetFactory={fanta.resetToFactoryDataset}
        />
      </main>
    </div>
  );
}
