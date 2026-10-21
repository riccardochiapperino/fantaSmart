'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowRight, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { LogoWithText } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, loginAsGuest } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegisterMode) {
      if (!name.trim() || !identifier.trim()) {
        setError('Inserisci nome ed email/username per registrarti.');
        return;
      }
      setIsLoading(true);
      const res = await register(name, identifier, password);
      setIsLoading(false);
      if (res.success) {
        router.push('/hub');
      } else {
        setError(res.error || 'Errore durante la registrazione.');
      }
    } else {
      if (!identifier.trim() || !password.trim()) {
        setError('Inserisci username/email e password per accedere.');
        return;
      }
      setIsLoading(true);
      const res = await login(identifier, password);
      setIsLoading(false);
      if (res.success) {
        router.push('/hub');
      } else {
        setError(res.error || 'Credenziali non corrette.');
      }
    }
  };

  const handleGuestAccess = () => {
    loginAsGuest();
    router.push('/hub');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between items-center p-3 sm:p-4 relative overflow-x-hidden transition-colors duration-200">
      {/* Background glow accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Brand & Theme Toggle */}
      <header className="w-full max-w-4xl flex justify-between items-center z-10 py-1.5 sm:py-2">
        <LogoWithText logoClassName="w-7 h-7 sm:w-8 sm:h-8" />
        <ThemeToggle />
      </header>

      {/* Center Auth Card */}
      <main className="w-full max-w-md my-auto z-10 py-3">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-4">
          {/* Card Header & Switch Tabs */}
          <div className="text-center space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isRegisterMode ? 'Crea Nuovo Account' : 'Accedi a FantaSmart'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              {isRegisterMode
                ? 'Registra il tuo account per gestire leghe e aste multiple.'
                : 'Inserisci le tue credenziali per accedere al Live Cockpit.'}
            </p>

            {/* Toggle Accedi / Registrati */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setError('');
                }}
                className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  !isRegisterMode
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Accedi
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setError('');
                }}
                className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  isRegisterMode
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Registrati
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-300 font-semibold animate-in fade-in">
              {error}
            </div>
          )}

          {/* Form Login / Register */}
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {isRegisterMode && (
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Nome &amp; Cognome
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Mario Rossi"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Username / Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="admin oppure utente"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 min-h-[46px] mt-1"
            >
              <span>{isLoading ? 'Accesso in corso...' : isRegisterMode ? 'Crea Account' : 'Accedi'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Link Modalità Ospite Read-Only */}
          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleGuestAccess}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline py-1 transition-colors"
            >
              👁️ Esplora come Ospite (Sola Lettura / In-Memory)
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-400 z-10 py-1.5">
        FantaSmart Engine 2026/2027 • Next.js 16
      </footer>
    </div>
  );
}
