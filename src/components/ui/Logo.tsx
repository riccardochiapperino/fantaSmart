'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = 'w-8 h-8', size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        {/* Gradiente Scudo */}
        <linearGradient id="shieldGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" /> {/* Cyan 500 */}
          <stop offset="50%" stopColor="#3B82F6" /> {/* Blue 500 */}
          <stop offset="100%" stopColor="#10B981" /> {/* Emerald 500 */}
        </linearGradient>

        {/* Gradiente Scintilla / Fulmine */}
        <linearGradient id="sparkGrad" x1="16" y1="8" x2="32" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#A5F3FC" /> {/* Cyan 200 */}
        </linearGradient>

        {/* Glow Filter */}
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Scudo Esterno */}
      <path
        d="M24 4L40 10V22C40 32.5 33.2 41.8 24 45C14.8 41.8 8 32.5 8 22V10L24 4Z"
        fill="url(#shieldGrad)"
      />

      {/* Bordo Scudo con Luce */}
      <path
        d="M24 6.2L38 11.4V22C38 31.2 32.1 39.5 24 42.4C15.9 39.5 10 31.2 10 22V11.4L24 6.2Z"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeOpacity="0.35"
        fill="none"
      />

      {/* Pattern Calcio Geometrico di Sfondo */}
      <circle cx="24" cy="24" r="11" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.15" fill="none" />
      <line x1="13" y1="24" x2="35" y2="24" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.15" />
      <line x1="24" y1="13" x2="24" y2="35" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.15" />

      {/* Scintilla / Fulmine Data Energy */}
      <path
        d="M26 10L16 25H23L21 38L32 23H25L26 10Z"
        fill="url(#sparkGrad)"
        filter="url(#logoGlow)"
      />
    </svg>
  );
}

interface LogoWithTextProps {
  className?: string;
  logoClassName?: string;
  badgeText?: string;
}

export function LogoWithText({
  className = '',
  logoClassName = 'w-8 h-8',
  badgeText = '2026/27',
}: LogoWithTextProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Logo className={logoClassName} />
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase font-sans">
            FANTA<span className="text-cyan-500">SMART</span>
          </span>
          {badgeText && (
            <span className="text-[10px] font-black bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 px-1.5 py-0.5 rounded-md border border-cyan-500/30">
              {badgeText}
            </span>
          )}
        </div>
        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-0.5">
          Live Auction Engine
        </span>
      </div>
    </div>
  );
}
