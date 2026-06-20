/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Heart, RotateCcw, PartyPopper } from 'lucide-react';
import { Guest } from '../types';

interface LeaderboardPodiumProps {
  guests: Guest[];
  onRestart: () => void;
}

export default function LeaderboardPodium({ guests, onRestart }: LeaderboardPodiumProps) {
  // Identify top 3 players
  const podiumPlayers = guests.slice(0, 3);
  
  // Reorder them: [Silver, Gold, Bronze], which maps visually to left-to-right columns
  const visualPodium = React.useMemo(() => {
    const list: (Guest | null)[] = [null, null, null];
    if (podiumPlayers[1]) list[0] = podiumPlayers[1]; // 2nd place (Silver) - Left
    if (podiumPlayers[0]) list[1] = podiumPlayers[0]; // 1st place (Gold) - Center
    if (podiumPlayers[2]) list[2] = podiumPlayers[2]; // 3rd place (Bronze) - Right
    return list;
  }, [podiumPlayers]);

  // Generate 25 floating heart particles for high-energy visual effect!
  const heartsArray = React.useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      size: `${Math.random() * 16 + 12}px`,
      duration: `${4 + Math.random() * 4}s`,
      hue: 'text-gold/20'
    }));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center font-sans overflow-hidden relative min-h-[80vh] flex flex-col justify-between text-brand-gray">
      {/* Floating Animated Heart Particles */}
      <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none overflow-hidden z-0">
        {heartsArray.map((heart) => (
          <div
            key={heart.id}
            className={`absolute bottom-0 ${heart.hue} animate-bounce leading-none select-none`}
            style={{
              left: heart.left,
              fontSize: heart.size,
              animationDelay: heart.delay,
              animationDuration: heart.duration,
              animationName: 'floatHeart',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out'
            }}
          >
            ♥
          </div>
        ))}
      </div>

      {/* Embedded inline hearts animation keyframe */}
      <style>{`
        @keyframes floatHeart {
          0% {
            transform: translateY(100px) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-800px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Celebration Header */}
      <div className="relative z-10 pt-4">
        <div className="inline-flex items-center space-x-2 bg-blush/20 px-4 py-1.5 border border-gold/30 text-gold font-semibold text-[9px] tracking-widest uppercase mb-4 animate-bounce">
          <PartyPopper className="w-3.5 h-3.5" />
          <span>¡Resultados Certificados de la Trivia!</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-brand-gray font-normal italic">
          Podio de Ganadores
        </h1>
        <p className="mt-3 text-brand-gray/60 text-xs md:text-xs max-w-lg mx-auto font-sans leading-relaxed">
          ¡La multitud ha vitoreado y las respuestas de la boda están registradas! He aquí los invitados más rápidos y astutos del gran día de la boda.
        </p>
      </div>

      {/* Three Pillar Columns */}
      <div className="relative z-10 grid grid-cols-3 gap-3 md:gap-6 mt-12 mb-12 items-end max-w-2xl mx-auto w-full min-h-[350px]">
        {/* Silver Rank Column (2nd Place) */}
        <div className="flex flex-col items-center">
          {visualPodium[0] ? (
            <div className="text-center w-full animate-fade-in pb-1">
              <div className="bg-white border border-brand-gray/30 w-11 h-11 rounded-full flex items-center justify-center text-brand-gray/60 font-serif font-bold mx-auto mb-3 shadow-none leading-none italic">
                2
              </div>
              <p className="font-serif italic font-semibold text-xs md:text-sm text-brand-gray truncate" title={visualPodium[0].name}>
                {visualPodium[0].name}
              </p>
              <p className="text-[10px] md:text-xs font-semibold text-brand-gray/50 font-mono mt-0.5">
                {visualPodium[0].score} pts
              </p>
            </div>
          ) : (
            <div className="h-20 w-1 bg-transparent"></div>
          )}
          {/* Silver Pillar block */}
          <div className="mt-4 w-full h-32 md:h-40 bg-[#FDFCFB]/40 border border-brand-gray/20 rounded-none flex items-center justify-center shadow-none relative overflow-hidden group">
            <span className="font-serif text-lg md:text-xl font-normal italic tracking-wider text-brand-gray/50 select-none group-hover:scale-105 transition-transform">
              Plata
            </span>
          </div>
        </div>

        {/* Gold Rank Column (1st Place Champion) */}
        <div className="flex flex-col items-center">
          {visualPodium[1] ? (
            <div className="text-center w-full animate-fade-in relative pb-1">
              {/* Pulsing crown badge above gold winner */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-gold animate-bounce">
                <Trophy className="w-6 h-6 fill-current" />
              </div>
              <div className="bg-ivory border-2 border-gold w-14 h-14 rounded-full flex items-center justify-center text-gold font-serif font-bold mx-auto mb-3 shadow-sm leading-none italic">
                1
              </div>
              <p className="font-serif italic font-semibold text-sm md:text-base text-brand-gray truncate" title={visualPodium[1].name}>
                {visualPodium[1].name}
              </p>
              <p className="text-xs font-semibold text-gold font-mono mt-0.5">
                {visualPodium[1].score} pts
              </p>
            </div>
          ) : (
            <div className="h-24 w-1 bg-transparent"></div>
          )}
          {/* Gold Pillar block */}
          <div className="mt-4 w-full h-44 md:h-56 bg-brand-gray border border-gold flex items-center justify-center shadow-none relative overflow-hidden group">
            <span className="font-serif text-lg md:text-xl font-normal italic tracking-widest text-gold select-none group-hover:scale-105 transition-transform flex flex-col items-center animate-pulse">
              Campeón 🏆
            </span>
          </div>
        </div>

        {/* Bronze Rank Column (3rd Place) */}
        <div className="flex flex-col items-center">
          {visualPodium[2] ? (
            <div className="text-center w-full animate-fade-in pb-1">
              <div className="bg-white border border-brand-gray/15 w-10 h-10 rounded-full flex items-center justify-center text-brand-gray/40 font-serif font-bold mx-auto mb-3 shadow-none leading-none italic">
                3
              </div>
              <p className="font-serif italic font-semibold text-xs md:text-sm text-brand-gray/80 truncate" title={visualPodium[2].name}>
                {visualPodium[2].name}
              </p>
              <p className="text-[10px] md:text-xs font-semibold text-brand-gray/45 font-mono mt-0.5">
                {visualPodium[2].score} pts
              </p>
            </div>
          ) : (
            <div className="h-16 w-1 bg-transparent"></div>
          )}
          {/* Bronze Pillar block */}
          <div className="mt-4 w-full h-24 md:h-32 bg-[#FDFCFB]/20 border border-brand-gray/10 rounded-none flex items-center justify-center shadow-none relative overflow-hidden group">
            <span className="font-serif text-lg md:text-xl font-normal italic tracking-wider text-brand-gray/30 select-none group-hover:scale-105 transition-transform">
              Bronce
            </span>
          </div>
        </div>
      </div>

      {/* Actions segment */}
      <div className="relative z-10 py-6 border-t border-gold/20 max-w-md mx-auto w-full">
        <button
          onClick={onRestart}
          id="btn_podium_lobby_home"
          className="w-full inline-flex items-center justify-center space-x-2 py-4 bg-brand-gray hover:bg-gold hover:text-brand-gray text-white text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          <span>Volver al Lobby de Selección</span>
        </button>
      </div>
    </div>
  );
}
