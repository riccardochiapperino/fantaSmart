'use client';

import React, { useState, useMemo } from 'react';
import { Player, Role, ScheduleGrid, PairingMatrix } from '@/lib/types';
import {
  FORMATIONS,
  SupportedFormation,
  optimizeFormation,
  findBestFormation,
  detectRosterVulnerabilities,
  RosterAlert,
} from './formationOptimizer';
import { SoccerPitch2D } from './SoccerPitch2D';
import { BenchSection } from './BenchSection';
import {
  Sparkles,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Shield,
  Layout,
  RefreshCw,
  Users,
} from 'lucide-react';

interface Props {
  squad: Player[];
  schedule?: ScheduleGrid;
  pairingMatrix?: PairingMatrix;
}

export function TacticalPitchView({ squad, schedule, pairingMatrix }: Props) {
  const [formation, setFormation] = useState<SupportedFormation>('3-4-3');
  const [manualStartersByLine, setManualStartersByLine] = useState<Record<Role, Player[]> | null>(null);

  const formationsList = Object.keys(FORMATIONS) as SupportedFormation[];

  // Ottimizzazione automatica formazione
  const autoOptimized = useMemo(() => {
    return optimizeFormation(squad, formation);
  }, [squad, formation]);

  // Se l'utente ha modificato manualmente la formazione, usiamo i titolari manuali, altrimenti quelli auto-ottimizzati
  const startersByLine = manualStartersByLine || autoOptimized.startersByLine;

  const currentStarters = useMemo(() => {
    return [
      ...startersByLine.P,
      ...startersByLine.D,
      ...startersByLine.C,
      ...startersByLine.A,
    ];
  }, [startersByLine]);

  const bench = useMemo(() => {
    const starterIds = new Set(currentStarters.map(p => p.id));
    return squad.filter(p => !starterIds.has(p.id));
  }, [squad, currentStarters]);

  const benchByRole: Record<Role, Player[]> = useMemo(() => {
    return {
      P: bench.filter(p => p.role === 'P'),
      D: bench.filter(p => p.role === 'D'),
      C: bench.filter(p => p.role === 'C'),
      A: bench.filter(p => p.role === 'A'),
    };
  }, [bench]);

  // Calcolo metriche formazione corrente
  const totalXFM = useMemo(() => {
    const sum = currentStarters.reduce((acc, p) => acc + (p.expectedBaseScore ?? 6.0), 0);
    return Number(sum.toFixed(1));
  }, [currentStarters]);

  const totalCPS = useMemo(() => {
    const sum = currentStarters.reduce((acc, p) => acc + (p.cps ?? 6.0), 0);
    return Number(sum.toFixed(1));
  }, [currentStarters]);

  const startersCost = useMemo(() => {
    return currentStarters.reduce((acc, p) => acc + (p.boughtFor ?? 0), 0);
  }, [currentStarters]);

  const benchCost = useMemo(() => {
    return bench.reduce((acc, p) => acc + (p.boughtFor ?? 0), 0);
  }, [bench]);

  // Analisi vulnerabilità rosa
  const alerts: RosterAlert[] = useMemo(() => {
    return detectRosterVulnerabilities(squad, schedule, pairingMatrix);
  }, [squad, schedule, pairingMatrix]);

  // Handler cambio modulo
  const handleSelectFormation = (f: SupportedFormation) => {
    setFormation(f);
    setManualStartersByLine(null); // Resetta a auto-ottimizzato per il nuovo modulo
  };

  // Handler Best 11 automatico
  const handleAutoBestEleven = () => {
    const best = findBestFormation(squad);
    setFormation(best.formation);
    setManualStartersByLine(null);
  };

  // Handler sostituzione tra titolare e panchina
  const handleSwapPlayer = (oldPlayer: Player, newPlayer: Player) => {
    const role = oldPlayer.role;
    const currentLine = [...(startersByLine[role] || [])];
    const index = currentLine.findIndex(p => p.id === oldPlayer.id);

    if (index !== -1) {
      currentLine[index] = newPlayer;
      setManualStartersByLine({
        ...startersByLine,
        [role]: currentLine,
      });
    }
  };

  // Handler assegnazione slot vuoto
  const handleAssignPlayer = (role: Role, newPlayer: Player) => {
    const currentLine = [...(startersByLine[role] || [])];
    currentLine.push(newPlayer);
    setManualStartersByLine({
      ...startersByLine,
      [role]: currentLine,
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Formation Bar */}
      <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-3 transition-colors">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layout className="w-5 h-5 text-cyan-500" />
              <span>CAMPO TATTICO &amp; FORMAZIONE</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulazione dell'undici titolare, punteggio atteso e controllo dei reparti.
            </p>
          </div>

          {/* Tasto Auto Best 11 */}
          <button
            onClick={handleAutoBestEleven}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-black text-xs rounded-xl shadow-lg transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Migliore Formazione</span>
          </button>
        </div>

        {/* Selettore Moduli */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-extrabold">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">Modulo:</span>
          {formationsList.map(form => (
            <button
              key={form}
              onClick={() => handleSelectFormation(form)}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                formation === form
                  ? 'bg-cyan-500 border-cyan-400 text-black shadow-md'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {form}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Bar Punteggio Proiettato */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Fantamedia Titolari</span>
          <span className="text-lg font-black text-slate-900 dark:text-white">{totalXFM}</span>
          <span className="text-[10px] text-slate-500 block">Media Punti Attesa</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Punteggio Rosa</span>
          <span className="text-lg font-black text-cyan-600 dark:text-cyan-400">{totalCPS}</span>
          <span className="text-[10px] text-slate-500 block">Indice di Forza</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Costo Undici Titolare</span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{startersCost} cr</span>
          <span className="text-[10px] text-slate-500 block">{currentStarters.length} Titolari</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Costo Panchina</span>
          <span className="text-lg font-black text-amber-600 dark:text-amber-400">{benchCost} cr</span>
          <span className="text-[10px] text-slate-500 block">{bench.length} Riserve</span>
        </div>
      </div>

      {/* Box Allarmi Vulnerabilità Rosa */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3 rounded-2xl border flex items-start gap-2.5 text-xs ${
                alert.type === 'danger'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  : alert.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {alert.type === 'danger' || alert.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="font-bold">{alert.title}</div>
                <div className="text-[11px] opacity-90">{alert.message}</div>
                {alert.suggestion && (
                  <div className="text-[10px] font-semibold opacity-80 pt-0.5">
                    💡 Consiglio: {alert.suggestion}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sezione Campo 2D */}
      <div className="flex justify-center">
        <SoccerPitch2D
          formation={formation}
          startersByLine={startersByLine}
          benchByRole={benchByRole}
          onSwapPlayer={handleSwapPlayer}
          onAssignPlayer={handleAssignPlayer}
        />
      </div>

      {/* Sezione Panchina */}
      <BenchSection
        bench={bench}
        onPromoteToStarter={p => {
          const role = p.role;
          const currentLine = startersByLine[role] || [];
          if (currentLine.length > 0) {
            handleSwapPlayer(currentLine[0], p);
          }
        }}
      />
    </div>
  );
}
