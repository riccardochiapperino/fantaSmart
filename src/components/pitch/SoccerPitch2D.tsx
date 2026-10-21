'use client';

import React from 'react';
import { Player, Role } from '@/lib/types';
import { FORMATIONS, SupportedFormation } from './formationOptimizer';
import { PlayerPitchNode } from './PlayerPitchNode';

interface Props {
  formation: SupportedFormation;
  startersByLine: Record<Role, Player[]>;
  benchByRole: Record<Role, Player[]>;
  onSwapPlayer?: (oldPlayer: Player, newPlayer: Player) => void;
  onAssignPlayer?: (role: Role, newPlayer: Player) => void;
}

export function SoccerPitch2D({
  formation,
  startersByLine,
  benchByRole,
  onSwapPlayer,
  onAssignPlayer,
}: Props) {
  const structure = FORMATIONS[formation] || FORMATIONS['3-4-3'];

  return (
    <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] max-h-[520px] sm:max-h-[680px] rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-4 border-slate-800/80 bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 p-2 sm:p-5 flex flex-col justify-between select-none">
      {/* SVG Linee Regolamentari del Campo */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-35"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 500"
        preserveAspectRatio="none"
      >
        {/* Linea di Bordo */}
        <rect x="15" y="15" width="370" height="470" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />

        {/* Linea di Metà Campo */}
        <line x1="15" y1="250" x2="385" y2="250" stroke="#FFFFFF" strokeWidth="2" />

        {/* Cerchio di Centrocampo */}
        <circle cx="200" cy="250" r="50" fill="none" stroke="#FFFFFF" strokeWidth="2" />
        <circle cx="200" cy="250" r="3" fill="#FFFFFF" />

        {/* Area di Rigore Superiore (Attacco) */}
        <rect x="90" y="15" width="220" height="90" fill="none" stroke="#FFFFFF" strokeWidth="2" />
        <rect x="140" y="15" width="120" height="35" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="200" cy="75" r="2.5" fill="#FFFFFF" />
        <path d="M 155 105 A 45 45 0 0 0 245 105" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />

        {/* Area di Rigore Inferiore (Difesa / Porta) */}
        <rect x="90" y="395" width="220" height="90" fill="none" stroke="#FFFFFF" strokeWidth="2" />
        <rect x="140" y="450" width="120" height="35" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="200" cy="425" r="2.5" fill="#FFFFFF" />
        <path d="M 155 395 A 45 45 0 0 1 245 395" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
      </svg>

      {/* 1. LINEA ATTACCO (Top) */}
      <div className="relative z-10 flex justify-around items-center w-full pt-1 sm:pt-2">
        {Array.from({ length: structure.attackers }).map((_, idx) => {
          const player = startersByLine.A[idx] || null;
          return (
            <PlayerPitchNode
              key={`att-${idx}`}
              player={player}
              role="A"
              slotIndex={idx}
              availableSubstitutes={benchByRole.A}
              onSwapPlayer={onSwapPlayer}
              onAssignPlayer={p => onAssignPlayer && onAssignPlayer('A', p)}
            />
          );
        })}
      </div>

      {/* 2. LINEA CENTROCAMPO (Mid-Upper) */}
      <div className="relative z-10 flex justify-around items-center w-full py-1">
        {Array.from({ length: structure.midfielders }).map((_, idx) => {
          const player = startersByLine.C[idx] || null;
          return (
            <PlayerPitchNode
              key={`mid-${idx}`}
              player={player}
              role="C"
              slotIndex={idx}
              availableSubstitutes={benchByRole.C}
              onSwapPlayer={onSwapPlayer}
              onAssignPlayer={p => onAssignPlayer && onAssignPlayer('C', p)}
            />
          );
        })}
      </div>

      {/* 3. LINEA DIFESA (Mid-Lower) */}
      <div className="relative z-10 flex justify-around items-center w-full py-1">
        {Array.from({ length: structure.defenders }).map((_, idx) => {
          const player = startersByLine.D[idx] || null;
          return (
            <PlayerPitchNode
              key={`def-${idx}`}
              player={player}
              role="D"
              slotIndex={idx}
              availableSubstitutes={benchByRole.D}
              onSwapPlayer={onSwapPlayer}
              onAssignPlayer={p => onAssignPlayer && onAssignPlayer('D', p)}
            />
          );
        })}
      </div>

      {/* 4. LINEA PORTIERE (Bottom) */}
      <div className="relative z-10 flex justify-center items-center w-full pb-1 sm:pb-2">
        <PlayerPitchNode
          player={startersByLine.P[0] || null}
          role="P"
          slotIndex={0}
          availableSubstitutes={benchByRole.P}
          onSwapPlayer={onSwapPlayer}
          onAssignPlayer={p => onAssignPlayer && onAssignPlayer('P', p)}
        />
      </div>
    </div>
  );
}
