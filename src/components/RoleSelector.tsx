/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, Crown, Tv, Smartphone, RefreshCw, Monitor } from 'lucide-react';

interface RoleSelectorProps {
  onSelectRole: (role: 'couple' | 'host' | 'guest') => void;
  guestCount: number;
  questionCount: number;
  gameStatus: string;
  onResetAll: () => Promise<void>;
}

export default function RoleSelector({
  onSelectRole,
  guestCount,
  questionCount,
  gameStatus,
  onResetAll,
}: RoleSelectorProps) {
  const [resetting, setResetting] = React.useState(false);

  const trySelectRole = (r: 'couple' | 'host' | 'guest') => {
    onSelectRole(r);
  };

  const handleReset = async () => {
    if (window.confirm('¿Estás seguro de que deseas reiniciar toda la trivia global de la boda? Esto borrará todos los invitados registrados y restablecerá las preguntas.')) {
      setResetting(true);
      await onResetAll();
      setResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-16 font-sans text-brand-gray">
      {/* Decorative Top Segment */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center space-x-2 bg-blush/20 px-4 py-1.5 rounded-full border border-gold/30 text-gold font-medium text-xs tracking-wider uppercase mb-4">
          <Heart className="w-3.5 h-3.5 fill-current animate-heart-pulse text-gold" />
          <span>Trivia Interactiva de Bodas en Tiempo Real</span>
        </div>
        <h1 className="font-serif text-4xl md:text-6xl text-brand-gray tracking-tight leading-tight italic">
          El Quiz del Amor
        </h1>
        <p className="mt-4 text-brand-gray/80 text-sm md:text-base font-serif italic max-w-xl mx-auto">
          Consola del Juego de Bodas. Un elegante juego de preguntas sincronizado en tiempo real, alojado en Firestore y diseñado con un estilo artístico y sofisticado.
        </p>
      </div>

      {/* Grid of Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Role 1: Couple (Architect) */}
        <button
          onClick={() => trySelectRole('couple')}
          id="role_btn_couple"
          className="group relative flex flex-col justify-between text-left p-6 bg-white border border-brand-gray/10 hover:border-gold transition-colors duration-300 shadow-sm cursor-pointer"
        >
          <div>
            <div className="w-10 h-10 border border-gold/40 rounded-full flex items-center justify-center text-gold mb-6 group-hover:scale-105 transition-transform">
              <Crown className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg text-brand-gray mb-2 italic font-semibold">
              Panel de los Novios
            </h3>
            <p className="text-xs text-brand-gray/70 leading-relaxed font-sans">
              Diseñador de preguntas. Ingresa datos de su historia y biografía; la inteligencia artificial genera hasta 15 preguntas y diseña distractores inteligentes y divertidos.
            </p>
          </div>
          <span className="mt-8 text-gold text-xs font-semibold uppercase tracking-wider group-hover:underline flex items-center">
            Diseñar Preguntas &rarr;
          </span>
        </button>

        {/* Role 2: Host Master Console */}
        <button
          onClick={() => trySelectRole('host')}
          id="role_btn_host"
          className="group relative flex flex-col justify-between text-left p-6 bg-white border border-brand-gray/10 hover:border-gold transition-colors duration-300 shadow-sm cursor-pointer"
        >
          <div>
            <div className="w-10 h-10 border border-gold/40 rounded-full flex items-center justify-center text-gold mb-6 group-hover:scale-105 transition-transform">
              <Tv className="w-5 h-5 animate-ring-tilt" />
            </div>
            <h3 className="font-serif text-lg text-brand-gray mb-2 italic font-semibold">
              Consola del Organizador
            </h3>
            <p className="text-xs text-brand-gray/70 leading-relaxed font-sans">
              Panel de control central. Presenta las preguntas, coordina la cuenta regresiva de 20 segundos, observa la analítica de respuestas y activa los festejos de ganadores.
            </p>
          </div>
          <span className="mt-8 text-gold text-xs font-semibold uppercase tracking-wider group-hover:underline flex items-center">
            Abrir Panel Organizador &rarr;
          </span>
        </button>

        {/* Role 3: Guest Mobile buzzer */}
        <button
          onClick={() => trySelectRole('guest')}
          id="role_btn_guest"
          className="group relative flex flex-col justify-between text-left p-6 bg-white border border-brand-gray/10 hover:border-gold transition-colors duration-300 shadow-sm cursor-pointer"
        >
          <div>
            <div className="w-10 h-10 border border-gold/40 rounded-full flex items-center justify-center text-gold mb-6 group-hover:scale-105 transition-transform">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg text-brand-gray mb-2 italic font-semibold">
              Pulsador del Invitado
            </h3>
            <p className="text-xs text-brand-gray/70 leading-relaxed font-sans">
              Interfaz de juego simplificada de respuestas optimizada para celulares. Regístrate, responde rápido para mayor bonificación de velocidad y mira tu posición actual.
            </p>
          </div>
          <span className="mt-8 text-gold text-xs font-semibold uppercase tracking-wider group-hover:underline flex items-center">
            Unirse como Invitado &rarr;
          </span>
        </button>
      </div>

      {/* Public Display Screen link */}
      <div className="border border-brand-gray/10 bg-slate-50 p-5 flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-brand-gray/20 rounded-full flex items-center justify-center text-brand-gray/60 flex-shrink-0">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-brand-gray/50 uppercase font-medium tracking-wider mb-0.5">Proyector / TV del Salón</div>
            <p className="text-xs text-brand-gray/70 leading-relaxed font-sans">
              Abre esta URL en la pantalla grande. Muestra la pregunta, el cronómetro y el marcador — sin controles del organizador.
            </p>
          </div>
        </div>
        <a
          href="?role=pantalla"
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap px-5 py-2.5 border border-brand-gray/20 text-brand-gray hover:border-gold hover:text-gold text-[10px] font-semibold uppercase tracking-wider transition-all text-center"
        >
          Abrir Pantalla Pública &rarr;
        </a>
      </div>

      {/* Session Diagnostics Info and Quick Clean Panel */}
      <div className="bg-white border border-brand-gray/10 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="grid grid-cols-3 gap-6 text-center md:text-left">
          <div>
            <div className="text-[10px] text-brand-gray/50 uppercase font-medium tracking-wider">Estado de la Trivia</div>
            <div className="mt-0.5 text-sm font-serif italic font-semibold text-brand-gray capitalize">
              {gameStatus === 'setup' ? 'Preparando' : gameStatus === 'lobby' ? 'En Sala' : gameStatus === 'active' ? 'Jugando' : 'Finalizado'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-brand-gray/50 uppercase font-medium tracking-wider">Preguntas Totales</div>
            <div className="mt-0.5 text-sm font-serif italic font-semibold text-brand-gray">{questionCount} Preguntas</div>
          </div>
          <div>
            <div className="text-[10px] text-brand-gray/50 uppercase font-medium tracking-wider">Invitados Unidos</div>
            <div className="mt-0.5 text-sm font-serif italic font-semibold text-brand-gray">{guestCount} Invitados</div>
          </div>
        </div>

        <button
          onClick={handleReset}
          disabled={resetting}
          id="btn_reset_lobby"
          className="w-full md:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 hover:bg-blush/20 border border-brand-gray/20 text-brand-gray/70 hover:text-brand-gray hover:border-gold rounded-none text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span className="font-sans uppercase tracking-wider text-[10px]">{resetting ? 'Reiniciando...' : 'Reiniciar Sesión de Fiesta'}</span>
        </button>
      </div>

    </div>
  );
}
