/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ArrowLeft, 
  Tv, 
  Play, 
  FastForward, 
  Users, 
  Heart, 
  Clock, 
  BarChart3, 
  Award, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { GameState, Question, Guest, GuestResponse } from '../types';

interface HostConsoleProps {
  onBackToMenu: () => void;
  gameState: GameState;
  questions: Question[];
  guests: Guest[];
  responses: GuestResponse[];
  onUpdateState: (update: Partial<GameState>) => Promise<void>;
  onResetSession: () => Promise<void>;
  isSandbox?: boolean;
}

export default function HostConsole({
  onBackToMenu,
  gameState,
  questions,
  guests,
  responses,
  onUpdateState,
  onResetSession,
  isSandbox = false,
}: HostConsoleProps) {
  const [timeLeft, setTimeLeft] = React.useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const activeQuestion = questions[gameState.currentQuestionIndex] || null;

  // Local sync timer tick with server timerEndAt
  React.useEffect(() => {
    if (gameState.questionActive && gameState.timerEndAt) {
      if (timerRef.current) clearInterval(timerRef.current);

      const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((gameState.timerEndAt! - now) / 1000));
        setTimeLeft(diff);

        if (diff <= 0) {
          // Locked responses automatically on timeout
          onUpdateState({
            questionActive: false,
            showResults: true,
          });
          if (timerRef.current) clearInterval(timerRef.current);
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 300);
    } else {
      setTimeLeft(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.questionActive, gameState.timerEndAt]);

  // Handle manual trigger of the 20-second active response window
  const handleTriggerTimer = async () => {
    if (!activeQuestion) return;

    const timerDurationMs = 20 * 1000;
    const timerEndAt = Date.now() + timerDurationMs;

    // Reset current active question's status to accept new inputs
    await onUpdateState({
      status: 'active',
      questionActive: true,
      showResults: false,
      timerEndAt: timerEndAt,
    });
  };

  // Skip or advance question index
  const handleAdvanceQuestion = async () => {
    const nextIdx = gameState.currentQuestionIndex + 1;
    if (nextIdx >= questions.length) {
      // Transition to podium completed screen!
      await onUpdateState({
        status: 'completed',
        questionActive: false,
        showResults: false,
        timerEndAt: null,
      });
    } else {
      await onUpdateState({
        currentQuestionIndex: nextIdx,
        questionActive: false,
        showResults: false,
        timerEndAt: null,
      });
    }
  };

  // Decrease index
  const handlePrevQuestion = async () => {
    const prevIdx = Math.max(0, gameState.currentQuestionIndex - 1);
    await onUpdateState({
      currentQuestionIndex: prevIdx,
      questionActive: false,
      showResults: false,
      timerEndAt: null,
    });
  };

  // Calculations: Responses for current question index
  const currentQuestionResponses = responses.filter(
    (r) => r.questionId === (activeQuestion?.id || -1)
  );
  
  const totalAnswers = currentQuestionResponses.length;
  const correctCount = currentQuestionResponses.filter((r) => r.isCorrect).length;
  const incorrectCount = totalAnswers - correctCount;
  const correctPercent = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;
  const incorrectPercent = totalAnswers > 0 ? 100 - correctPercent : 0;

  // Track counts per answer option (A, B, C, D)
  const optionCounts: Record<string, number> = {};
  if (activeQuestion) {
    activeQuestion.options.forEach((opt) => {
      optionCounts[opt] = currentQuestionResponses.filter(
        (r) => r.selectedOption === opt
      ).length;
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 font-sans text-brand-gray">
      {/* Top Banner Host Control */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gold/30 pb-5 mb-6 gap-4">
        <div className="flex items-center space-x-3">
          {!isSandbox && (
            <button
              onClick={onBackToMenu}
              className="p-1.5 border border-brand-gray/10 hover:border-gold rounded-none text-brand-gray/60 hover:text-brand-gray transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">Panel de Control General</span>
            </div>
            <h1 className="font-serif text-2xl italic text-brand-gray leading-tight">
              Consola del Organizador
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="border border-gold/20 bg-white px-3.5 py-1.5 flex items-center space-x-2 text-xs font-semibold text-brand-gray/80">
            <Users className="w-4 h-4 text-gold" />
            <span className="font-sans text-[10px] uppercase tracking-widest">{guests.length} Invitados Activos</span>
          </div>

          <button
            onClick={onResetSession}
            id="btn_reset_active_game"
            className="px-3.5 py-1.5 border border-brand-gray/15 hover:bg-blush/20 text-brand-gray/70 hover:text-brand-gray font-sans text-[10px] uppercase tracking-widest transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
            <span>Reiniciar Fiesta</span>
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gold/30">
          <Tv className="w-16 h-16 text-gold/40 mx-auto mb-4" />
          <h3 className="font-serif text-xl italic text-brand-gray">No Hay Preguntas de Boda Publicadas</h3>
          <p className="text-xs text-brand-gray/60 max-w-sm mx-auto mt-2 font-sans">
            La novia y el novio primero deben diseñar y publicar sus preguntas temáticas personalizadas desde el panel para novios.
          </p>
          <button
            onClick={onBackToMenu}
            className="mt-6 px-6 py-3 bg-brand-gray text-white font-semibold text-[11px] uppercase tracking-[0.2em] hover:bg-gold transition-all cursor-pointer"
          >
            Ir al Panel de Pareja
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Gameplay Screen Segment */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Live Indicator Timer Card */}
            <div className={`relative bg-white border border-gold/30 p-6 md:p-8 overflow-hidden shadow-sm ${gameState.questionActive ? 'live-pulse-glow' : ''}`}>
              {/* Artistic Q Watermark background */}
              <div className="absolute top-2 left-6 text-gold/10 text-[140px] md:text-[180px] font-serif select-none pointer-events-none font-light leading-none">
                Q{gameState.currentQuestionIndex + 1}
              </div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
                <div className="space-y-3">
                  <span className="inline-block px-3 py-1 border border-gold rounded-full text-[10px] uppercase tracking-wider text-gold font-sans font-semibold">
                    Pregunta {gameState.currentQuestionIndex + 1} de {questions.length}
                  </span>
                  <h2 className="font-serif text-3xl leading-snug text-brand-gray text-balance font-normal">
                    {activeQuestion?.questionText}
                  </h2>
                </div>

                {/* 20 Second Global Sync Countdown Clock */}
                <div className="flex-shrink-0 flex items-center justify-center pt-2">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="absolute w-full h-full -rotate-90">
                      <circle cx="56" cy="56" r="48" fill="none" stroke="#D4AF37" strokeWidth="2" strokeDasharray="301.6" strokeDashoffset="0" opacity="0.15"/>
                      <circle 
                        cx="56" 
                        cy="56" 
                        r="48" 
                        fill="none" 
                        stroke="#D4AF37" 
                        strokeWidth="4" 
                        strokeDasharray="301.6" 
                        strokeDashoffset={gameState.questionActive ? (301.6 - (301.6 * timeLeft) / 20) : 301.6}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="text-center z-10">
                      <p className="text-3xl font-serif font-light text-brand-gray">
                        {gameState.questionActive ? timeLeft : '20'}
                      </p>
                      <p className="text-[8px] uppercase tracking-[0.2em] opacity-60">Segundos</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multiple Choice Option Reveal Rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl relative z-10">
                {activeQuestion?.options.map((option, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isCorrect = option === activeQuestion?.correctAnswer;
                  const responseCount = optionCounts[option] || 0;
                  const responsePct = totalAnswers > 0 ? Math.round((responseCount / totalAnswers) * 100) : 0;

                  return (
                    <div 
                      key={idx} 
                      className={`relative overflow-hidden p-5 border transition-all duration-300 ${
                        gameState.showResults
                          ? isCorrect
                            ? 'bg-ivory border-gold text-brand-gray font-semibold'
                            : 'bg-white border-brand-gray/10 text-brand-gray/55'
                          : 'bg-white border-brand-gray/10 hover:border-gold text-brand-gray'
                      }`}
                    >
                      {/* Live result fill bar */}
                      {gameState.showResults && (
                        <div 
                          className={`absolute left-0 top-0 bottom-0 opacity-[0.08] transition-all duration-1000 ${
                            isCorrect ? 'bg-gold' : 'bg-brand-gray'
                          }`} 
                          style={{ width: `${responsePct}%` }}
                        />
                      )}

                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center space-x-3 max-w-[80%]">
                          <span className={`w-6 h-6 rounded-none flex items-center justify-center text-xs font-mono border ${
                            gameState.showResults
                              ? isCorrect
                                ? 'bg-gold/10 border-gold text-gold font-bold'
                                : 'bg-brand-gray/5 border-brand-gray/10 text-brand-gray/40'
                              : 'bg-brand-gray/5 border-brand-gray/10 text-brand-gray/60'
                          }`}>
                            {letter}
                          </span>
                          <span className="text-xs md:text-sm font-serif italic text-left truncate" title={option}>
                            {option}
                          </span>
                        </div>

                        {gameState.showResults && (
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-serif italic font-bold">
                              {responseCount} {responseCount === 1 ? 'voto' : 'votos'}
                            </span>
                            <span className="block text-[9px] text-brand-gray/60 font-sans tracking-wide">
                              {responsePct}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Host Trigger Action Drawer Bar */}
              <div className="mt-8 pt-5 border-t border-gold/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                <div className="text-xs font-sans text-brand-gray/70">
                  {gameState.questionActive ? (
                    <span className="flex items-center space-x-1.5 text-gold font-semibold">
                      <Heart className="w-3.5 h-3.5 fill-current animate-heart-pulse" />
                      <span className="font-serif italic font-normal text-sm">¡Cronómetro activo! Los invitados están respondiendo ahora...</span>
                    </span>
                  ) : gameState.showResults ? (
                    <span className="text-gold font-semibold flex items-center space-x-1">
                      <Award className="w-4 h-4" />
                      <span className="font-serif italic font-normal text-sm">Mostrando análisis de las respuestas.</span>
                    </span>
                  ) : (
                    <span className="font-serif italic text-sm">Listo. Activa el pulsador para enviar la pregunta a los teléfonos.</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Trigger Clock */}
                  <button
                    onClick={handleTriggerTimer}
                    disabled={gameState.questionActive}
                    id="btn_host_launch_buzzer"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-brand-gray hover:bg-gold hover:text-brand-gray text-white font-semibold text-[11px] uppercase tracking-[0.2em] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    <span>Lanzar Pregunta</span>
                  </button>

                  {/* Advance Question */}
                  <button
                    onClick={handleAdvanceQuestion}
                    disabled={gameState.questionActive}
                    id="btn_host_next_q"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-white hover:bg-blush/25 border border-gold/40 text-brand-gray font-semibold text-[11px] uppercase tracking-[0.2em] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <span>{gameState.currentQuestionIndex === questions.length - 1 ? 'Ver Podio Final 🌟' : 'Siguiente'}</span>
                    <FastForward className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Back / Next micro links */}
            <div className="flex items-center justify-between text-xs px-1">
              <button
                disabled={gameState.currentQuestionIndex === 0 || gameState.questionActive}
                onClick={handlePrevQuestion}
                className="text-brand-gray/60 hover:text-brand-gray font-serif italic disabled:opacity-20 cursor-pointer font-semibold underline underline-offset-4 decoration-gold/40"
              >
                &larr; Pregunta Anterior
              </button>
              <span className="text-brand-gray/50 text-[10px] tracking-wide">
                Contraseña de Lobby: <span className="font-mono bg-blush/20 border border-gold/20 px-2 py-0.5 text-brand-gray font-bold">wedding-global</span>
              </span>
            </div>

            {/* Real-time Response statistics analysis */}
            {gameState.showResults && (
              <div className="bg-white border border-gold/30 p-6">
                <div className="flex items-center space-x-2 border-b border-gold/20 pb-3 mb-5">
                  <BarChart3 className="w-5 h-5 text-gold" />
                  <h3 className="font-serif text-lg font-normal italic text-brand-gray">
                    Análisis de Velocidad e Indicadores de Precisión
                  </h3>
                </div>

                {totalAnswers === 0 ? (
                  <div className="text-center py-6 text-brand-gray/50 text-xs italic font-serif">
                    Ningún jugador respondió antes del cierre de tiempo.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Visual pie/gauge summary */}
                    <div className="md:col-span-1 text-center md:border-r md:border-gold/20 pr-4">
                      <div className="text-5xl font-serif font-light text-gold">
                        {correctPercent}%
                      </div>
                      <div className="text-[10px] text-brand-gray/60 uppercase tracking-widest font-semibold mt-1">
                        Porcentaje de Acierto
                      </div>
                      <div className="mt-2 text-[11px] text-brand-gray/50 italic font-serif">
                        {correctCount} de {totalAnswers} jugadores activos pulsaron a tiempo.
                      </div>
                    </div>

                    {/* Progress representation bar chart */}
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-serif italic text-brand-gray/80 flex items-center space-x-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-gold inline-block"></span>
                            <span>Respuestas Correctas</span>
                          </span>
                          <span className="font-sans font-bold text-brand-gray">{correctCount} ({correctPercent}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-brand-gray/5 rounded-none overflow-hidden">
                          <div 
                            className="bg-gold h-full transition-all duration-1000"
                            style={{ width: `${correctPercent}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-serif italic text-brand-gray/80 flex items-center space-x-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand-gray/20 inline-block"></span>
                            <span>Distractores Incorrectos</span>
                          </span>
                          <span className="font-sans font-bold text-brand-gray">{incorrectCount} ({incorrectPercent}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-brand-gray/5 rounded-none overflow-hidden">
                          <div 
                            className="bg-brand-gray/20 h-full transition-all duration-1000"
                            style={{ width: `${incorrectPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>

          {/* Right Sidebar: Active Session Scoreboards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gold/30 p-5">
              <h3 className="font-serif text-base text-brand-gray border-b border-gold/20 pb-3 mb-3 flex items-center space-x-2">
                <Award className="w-5 h-5 text-gold" style={{ strokeWidth: 1.5 }} />
                <span className="italic">Clasificación General</span>
              </h3>

              {guests.length === 0 ? (
                <div className="text-center py-8 text-xs text-brand-gray/50 italic font-serif leading-relaxed">
                  Aún no se han unido invitados. ¡Comparte tu pantalla o el simulador dual para responder!
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {guests.slice(0, 10).map((p, idx) => {
                    const isTop1 = idx === 0;
                    return (
                      <div 
                        key={p.id} 
                        className={`flex items-center justify-between p-2.5 border text-xs font-semibold ${
                          isTop1 
                            ? 'bg-ivory border-gold text-brand-gray' 
                            : 'bg-white border-brand-gray/10 text-brand-gray/80'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate max-w-[70%]">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border ${
                            isTop1 
                              ? 'bg-gold/10 border-gold text-gold' 
                              : 'bg-brand-gray/5 border-brand-gray/10 text-brand-gray/60'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="truncate font-serif italic">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[11px] text-brand-gray">{p.score} pts</span>
                          <span className="block text-[9px] text-brand-gray/50 font-normal">
                            {p.correctCount} {p.correctCount === 1 ? 'acierto' : 'aciertos'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {guests.length > 10 && (
                    <div className="text-[10px] text-brand-gray/50 text-center font-medium pt-1">
                      + {guests.length - 10} otros jugadores activos
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Simulated Live Feed Log */}
            <div className="bg-blush/10 border border-gold/20 p-4">
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] mb-2 font-sans text-center">Respuestas en Vivo</h4>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {currentQuestionResponses.length === 0 ? (
                  <div className="text-[10px] text-brand-gray/40 text-center py-2 font-serif italic">
                    Esperando primera respuesta...
                  </div>
                ) : (
                  [...currentQuestionResponses].reverse().map((r, ri) => (
                    <div key={ri} className="p-1.5 bg-white border border-brand-gray/10 text-[10px] flex items-center justify-between font-sans">
                      <span className="truncate max-w-[60%] text-brand-gray font-serif italic">{r.guestName}</span>
                      <span className={`font-mono ${r.isCorrect ? 'text-gold font-bold' : 'text-brand-gray/40'}`}>
                        {r.isCorrect ? `+${r.pointsEarned} pts` : 'respondió'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
