/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, Crown, Tv, Smartphone, RefreshCw, Layers, ShieldAlert } from 'lucide-react';

interface RoleSelectorProps {
  onSelectRole: (role: 'couple' | 'host' | 'guest' | 'sandbox') => void;
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
  const [pendingRole, setPendingRole] = React.useState<'couple' | 'host' | 'sandbox' | null>(null);
  const [passcode, setPasscode] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  const trySelectRole = (r: 'couple' | 'host' | 'sandbox' | 'guest') => {
    if (r === 'guest') {
      onSelectRole('guest');
    } else {
      setPendingRole(r);
      setPasscode('');
      setErrorMsg('');
    }
  };

  const verifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passcode.trim().toLowerCase();
    if (clean === 'boda123' || clean === 'boda2026' || clean === 'novios' || clean === 'novios2026') {
      if (pendingRole) {
        onSelectRole(pendingRole);
        setPendingRole(null);
      }
    } else {
      setErrorMsg('Contraseña incorrecta. Por favor intenta de nuevo.');
    }
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

      {/* Recommended Interactive Sandbox Option */}
      <div className="bg-brand-gray text-white p-6 md:p-8 shadow-sm border border-gold/30 mb-8 overflow-hidden relative">
        <div className="absolute right-0 top-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center space-x-1.5 bg-gold/20 text-gold border border-gold/30 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider mb-3">
              <Layers className="w-3 h-3 text-gold" />
              <span>Sugerido para Demostraciones y Pruebas</span>
            </div>
            <h2 className="font-serif text-2xl tracking-normal italic text-gold">
              Modo de Pruebas Dual (Sandbox)
            </h2>
            <p className="mt-2 text-xs md:text-sm text-white/80 leading-relaxed font-sans">
              ¿No tienes varios teléfonos para probar? Inicia el **Modo de Pruebas** para ver una pantalla dividida con la **Consola del Organizador** a la izquierda y el **Pulsador del Invitado** a la derecha de forma interactiva y simultánea.
            </p>
          </div>
          <button
            onClick={() => trySelectRole('sandbox')}
            id="role_btn_sandbox"
            className="whitespace-nowrap px-6 py-4 bg-gold text-brand-gray font-semibold text-[11px] uppercase tracking-[0.2em] shadow-sm hover:bg-gold-hover hover:scale-[1.02] active:scale-95 transition-all text-center cursor-pointer"
          >
            Iniciar Modo Pruebas
          </button>
        </div>
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

      {/* Passcode Protection Modal overlay */}
      {pendingRole !== null && (
        <div className="fixed inset-0 bg-brand-gray/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-white border border-gold/40 p-6 md:p-8 max-w-sm w-full shadow-2xl relative text-center">
            
            <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center mx-auto text-gold mb-4">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>

            <h3 className="font-serif text-xl italic font-semibold text-brand-gray">
              Acceso Protegido
            </h3>
            <p className="text-xs text-brand-gray/70 mt-2 leading-relaxed">
              Esta sección es de acceso privado para la pareja u organizadores del evento. Ingresa la contraseña de administración para continuar:
            </p>

            <form onSubmit={verifyPasscode} className="mt-6 space-y-4 text-left">
              <div>
                <label className="block text-[8px] uppercase tracking-widest font-bold text-[#D4AF37] mb-1.5">
                  Contraseña de Administrador
                </label>
                <input
                  type="password"
                  required
                  placeholder="Escribe la contraseña..."
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-[#FDFCFB]/50 border border-gold/20 rounded-none py-3 px-3 text-xs font-semibold focus:outline-none focus:border-gold focus:bg-white placeholder-brand-gray/30 transition-all text-center tracking-widest text-brand-gray"
                  autoFocus
                />
              </div>

              {errorMsg && (
                <p className="text-[10px] text-rose-500 font-semibold text-center font-sans animate-bounce">
                  {errorMsg}
                </p>
              )}

              <div className="bg-[#FDFCFB] border border-gold/20 p-3 text-[10px] text-brand-gray/60 leading-relaxed rounded-none font-sans mt-2">
                📌 <strong className="text-gold font-semibold uppercase">Prueba rápida:</strong> Usa la clave por defecto <span className="underline select-all font-semibold font-mono text-brand-gray bg-slate-100 px-1 py-0.5">boda123</span> para entrar de inmediato.
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingRole(null)}
                  className="py-3 border border-brand-gray/15 hover:bg-slate-50 text-brand-gray text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-3 bg-brand-gray hover:bg-gold hover:text-brand-gray text-white text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Verificar &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
