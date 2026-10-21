'use client';

import React, { useState } from 'react';
import { AuctionSession } from '@/lib/storage/multiAuctionStore';
import {
  Zap,
  Users,
  Wallet,
  Shield,
  Layout,
  MoreVertical,
  Copy,
  Trash2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  auction: AuctionSession;
  isActive: boolean;
  onEnterCockpit: (auctionId: string) => void;
  onNavigateTab: (auctionId: string, tab: 'rosa' | 'campo') => void;
  onDuplicate: (auctionId: string) => void;
  onDelete: (auctionId: string) => void;
}

export function AuctionCard({
  auction,
  isActive,
  onEnterCockpit,
  onNavigateTab,
  onDuplicate,
  onDelete,
}: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { id, name, createdAt, leagueConfig, myRoster = [], remainingBudget } = auction;
  const initialBudget = leagueConfig.initialBudget || 500;
  const spentBudget = initialBudget - remainingBudget;
  const slots = leagueConfig.slotsPerRole || { P: 3, D: 8, C: 8, A: 6 };
  const totalSlots = slots.P + slots.D + slots.C + slots.A;
  const completedSlots = myRoster.length;
  const progressPct = Math.min(100, Math.round((completedSlots / totalSlots) * 100));

  const formattedDate = new Date(createdAt).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={`relative bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xl transition-all hover:shadow-2xl flex flex-col justify-between space-y-4 ${
        isActive
          ? 'border-cyan-500/80 ring-2 ring-cyan-500/20'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Header Card */}
      <div className="flex justify-between items-start gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                Attiva
              </span>
            )}
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formattedDate}
            </span>
          </div>

          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white line-clamp-1">
            {name}
          </h3>
        </div>

        {/* Menu Azioni Opzionali */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            title="Altre opzioni"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 z-30 space-y-1 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onDuplicate(id);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-500" /> Duplica Asta
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowDeleteConfirm(true);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" /> Elimina Asta
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Badges Lega & Parametri */}
      <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 flex items-center gap-1">
          <Users className="w-3 h-3 text-cyan-500" /> {leagueConfig.numTeams} Squadre
        </span>
        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 flex items-center gap-1">
          <Shield className="w-3 h-3 text-blue-500" /> Modificatore: {leagueConfig.defenseModifier ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* Metriche Spesa & Slot */}
      <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-2">
        <div className="flex justify-between items-baseline text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Budget Residuo</span>
            <div className="font-black text-slate-900 dark:text-white text-base">
              {remainingBudget} <span className="text-xs text-cyan-500">cr</span>
              <span className="text-[11px] text-slate-400 font-normal ml-1">/ {initialBudget}</span>
            </div>
          </div>

          <div className="text-right space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Slot Completati</span>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {completedSlots} <span className="text-slate-400 font-normal">/ {totalSlots}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar Slot */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Pulsanti Azioni Principali */}
      <div className="space-y-2 pt-1">
        <button
          onClick={() => onEnterCockpit(id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs rounded-xl shadow-lg transition-all active:scale-95"
        >
          <Zap className="w-4 h-4 fill-black" />
          <span>ENTRA NEL LIVE COCKPIT</span>
        </button>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => onNavigateTab(id, 'rosa')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <span>📋 Vedi Rosa</span>
          </button>
          <button
            onClick={() => onNavigateTab(id, 'campo')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Layout className="w-3.5 h-3.5 text-cyan-500" />
            <span>Campo 2D</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal Eliminazione */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-sm w-full rounded-2xl p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Eliminare definitivamente "{name}"?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Questa operazione rimuoverà tutti i calciatori acquistati e la cronologia dell'asta.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(id);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Sì, Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
