/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, Smartphone, CheckCircle, AlertCircle, Sparkles, User, Trophy, ShieldAlert } from 'lucide-react';
import { GameState, Question, Guest, GuestResponse } from '../types';

interface GuestBuzzerProps {
  onBackToMenu: () => void;
  gameState: GameState;
  questions: Question[];
  guests: Guest[];
  responses: GuestResponse[];
  onRegister: (guestId: string, name: string) => Promise<void>;
  onSubmitAnswer: (
    guestId: string,
    guestName: string,
    questionId: number,
    selectedOption: string,
    isCorrect: boolean,
    responseTimeMs: number,
    pointsEarned: number
  ) => Promise<void>;
}

export default function GuestBuzzer({
  onBackToMenu,
  gameState,
  questions,
  guests,
  responses,
  onRegister,
  onSubmitAnswer,
}: GuestBuzzerProps) {
  // guestId initialized synchronously — avoids empty-string race condition on fast submits
  const [guestId] = React.useState<string>(() => {
    let localId = localStorage.getItem('wedding_trivia_guest_id');
    if (!localId) {
      localId = 'guest_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('wedding_trivia_guest_id', localId);
    }
    return localId;
  });
  const [guestName, setGuestName] = React.useState<string>(
    () => localStorage.getItem('wedding_trivia_guest_name') || ''
  );
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [registering, setRegistering] = React.useState(false);
  const [registerError, setRegisterError] = React.useState('');
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [questionTriggerTime, setQuestionTriggerTime] = React.useState<number | null>(null);
  const [pointsWagered, setPointsWagered] = React.useState(0);

  // Sync state: if new question is activated, unlock local answer options
  React.useEffect(() => {
    if (gameState.questionActive && gameState.timerEndAt) {
      const startTime = gameState.timerEndAt - (gameState.timerDuration * 1000);
      setQuestionTriggerTime(startTime);
      setSelectedOption(null);
    }
  }, [gameState.currentQuestionIndex, gameState.questionActive, gameState.timerEndAt]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = guestName.trim();
    if (!trimmedName) return;
    setRegistering(true);
    setRegisterError('');
    try {
      localStorage.setItem('wedding_trivia_guest_name', trimmedName);
      await onRegister(guestId, trimmedName);
      setIsRegistered(true);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setRegisterError('No se pudo conectar. Verifica tu internet e intenta de nuevo.');
      setRegistering(false);
    }
  };

  const activeQuestion = questions[gameState.currentQuestionIndex] || null;

  // Retrieve matching guest record for score keeping
  const currentGuestRecord = guests.find((g) => g.id === guestId);

  // Check if guest has already submitted for THIS question
  const hasSubmitted = responses.some(
    (r) => r.guestId === guestId && r.questionId === (activeQuestion?.id || -1)
  );

  // Handles clicking any of the 4 quadrant buttons
  const handleBuzzerClick = async (option: string) => {
    if (hasSubmitted || !gameState.questionActive || !activeQuestion) return;

    setSelectedOption(option);
    
    // Compute response velocity
    const responseTimeMs = questionTriggerTime ? Date.now() - questionTriggerTime : 1000;
    const isCorrect = option === activeQuestion.correctAnswer;

    // Velocity score algorithm
    let points = 0;
    if (isCorrect) {
      const basePoints = 1000;
      // Bonus points scales lineary up to +500 points for an instant 0s buzz-in
      const timerMs = (gameState.timerDuration || 20) * 1000;
      const velocityBonus = Math.max(
        0,
        Math.round(((timerMs - Math.min(timerMs, responseTimeMs)) / timerMs) * 500)
      );
      points = basePoints + velocityBonus;
    }
    setPointsWagered(points);

    await onSubmitAnswer(
      guestId,
      guestName,
      activeQuestion.id,
      option,
      isCorrect,
      responseTimeMs,
      points
    );
  };

  // Find ranks
  const myRank = guests.findIndex((g) => g.id === guestId) + 1;

  // Render 1: Enter Username Screen
  if (!isRegistered && !currentGuestRecord) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 md:py-20 font-sans text-brand-gray">
        <div className="bg-white border border-gold/30 p-8 shadow-sm text-center">
          <div className="w-12 h-12 border border-gold rounded-full flex items-center justify-center mx-auto text-gold mb-6">
            <Smartphone className="w-6 h-6 animate-heart-pulse text-gold" />
          </div>

          <h2 className="font-serif text-2xl italic font-semibold text-brand-gray">
            Pulsador del Invitado
          </h2>
          <p className="text-brand-gray/70 text-xs mt-2 leading-relaxed max-w-xs mx-auto">
            ¡Registra tu apodo abajo para conectar tu pulsador móvil y competir contra los demás invitados en tiempo real!
          </p>

          <form onSubmit={handleRegister} className="mt-8 space-y-5 text-left">
            <div>
              <label className="block text-[9px] uppercase font-bold tracking-widest text-[#D4AF37] mb-2">
                Tu Nombre o Apodo
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gold/60">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  maxLength={18}
                  placeholder="ej. Tía Sofía, Primo Carlos"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-[#FDFCFB]/50 border border-gold/20 rounded-none py-3.5 pl-10 pr-4 text-xs font-semibold focus:bg-white focus:outline-none focus:border-gold placeholder-brand-gray/30 transition-colors"
                />
              </div>
            </div>

            {registerError && (
              <p className="text-[10px] text-rose-500 font-semibold text-center animate-fade-in">
                ⚠ {registerError}
              </p>
            )}

            <button
              type="submit"
              id="btn_guest_join_submit"
              disabled={registering}
              className="w-full py-4 bg-brand-gray hover:bg-gold hover:text-brand-gray text-white font-semibold text-[11px] uppercase tracking-[0.2em] transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {registering ? 'Conectando...' : 'Entrar al Juego →'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // Render 2: Active Lobby / Player Screen
  return (
    <div className="max-w-md mx-auto px-4 py-4 md:py-6 font-sans flex flex-col min-h-[85vh] justify-between text-brand-gray">
      {/* Top Header Guest Details */}
      <div className="bg-brand-gray text-white p-4 flex items-center justify-between border border-gold/30">
        <div className="flex items-center space-x-2.5 truncate max-w-[65%]">
          <div className="w-8 h-8 border border-gold rounded-full flex items-center justify-center font-bold text-xs uppercase text-center text-gold">
            {guestName.slice(0, 2)}
          </div>
          <div className="truncate">
            <h4 className="text-xs font-serif italic truncate">{guestName}</h4>
            <span className="text-[9px] text-gold uppercase tracking-widest">Invitado Compitiendo</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono font-bold text-gold">
            {currentGuestRecord?.score || 0} pts
          </div>
          {myRank > 0 && (
            <div className="text-[9px] text-white/70 font-mono font-medium flex items-center justify-end mt-0.5">
              <Trophy className="w-3 h-3 text-gold mr-0.5" />
              <span>Puesto #{myRank}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main interactive state buzzer block */}
      <div className="my-6 flex-grow flex items-center justify-center">
        {questions.length === 0 ? (
          /* Case A: Waiting for host questions to be published */
          <div className="text-center p-6 bg-white border border-gold/30 w-full">
            <ShieldAlert className="w-12 h-12 text-gold/40 mx-auto mb-4" />
            <h3 className="font-serif text-lg italic text-brand-gray">Esperando Preguntas</h3>
            <p className="text-xs text-brand-gray/60 mt-1 max-w-xs mx-auto leading-relaxed">
              Los novios todavía no han cargado las preguntas del juego. ¡Espere un momento o pídales que publiquen la trivia!
            </p>
          </div>
        ) : !gameState.questionActive && !gameState.showResults ? (
          /* Case B: Waiting Lobby */
          <div className="text-center p-8 bg-white border border-gold/30 w-full shadow-sm">
            <Heart className="w-12 h-12 text-gold fill-current animate-heart-pulse mx-auto mb-4" />
            <h3 className="font-serif text-xl italic text-brand-gray">¡Pulsador Preparado!</h3>
            <p className="text-xs text-brand-gray/60 mt-2 leading-relaxed max-w-xs mx-auto font-sans">
              Nos encontramos en la **Pregunta {gameState.currentQuestionIndex + 1}**. Mantén tu mirada en la pantalla central; ¡las opciones se desbloquearán en cualquier momento!
            </p>
            <div className="inline-block mt-6 px-4 py-2 bg-blush/20 text-[9px] text-gold font-bold uppercase tracking-widest border border-gold/20 animate-pulse">
              Esperando que el organizador lance la pregunta...
            </div>
          </div>
        ) : gameState.questionActive && !hasSubmitted ? (
          /* Case C: Four-Quadrant Mobile Grid layouts active */
          <div className="w-full space-y-4">
            <div className="text-center mb-2">
              <div className="text-xs uppercase font-semibold text-gold tracking-widest flex items-center justify-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>¡Responde rápido para mayor bonificación!</span>
              </div>
              <h3 className="font-serif text-lg italic text-brand-gray mt-1">Selecciona tu respuesta:</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 min-h-[280px]">
              {/* Quadrant buttons: A, B, C, D */}
              {activeQuestion?.options.map((opt, oIdx) => {
                const colorSchemes = [
                  'border-gold text-brand-gray hover:bg-blush/10 bg-white active:scale-95',
                  'border-gold text-brand-gray hover:bg-blush/10 bg-white active:scale-95',
                  'border-gold text-brand-gray hover:bg-blush/10 bg-white active:scale-95',
                  'border-gold text-brand-gray hover:bg-blush/10 bg-white active:scale-95'
                ];
                const bgClass = colorSchemes[oIdx] || 'border-brand-gray/10';

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleBuzzerClick(opt)}
                    className={`${bgClass} border rounded-none p-5 font-bold flex flex-col justify-between text-left shadow-sm transition-all relative overflow-hidden group cursor-pointer`}
                  >
                    <span className="text-2xl opacity-20 font-serif leading-none text-gold italic">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="text-xs tracking-tight font-serif italic leading-snug mt-4 text-brand-gray block" title={opt}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : gameState.questionActive && hasSubmitted ? (
          /* Case D: Locked In! Answering on time */
          <div className="text-center p-8 bg-white border border-gold/30 w-full shadow-sm">
            <CheckCircle className="w-12 h-12 text-gold animate-bounce mx-auto mb-4" />
            <h3 className="font-serif text-xl italic text-brand-gray">¡RESPUESTA REGISTRADA!</h3>
            <p className="text-xs text-brand-gray/70 mt-2 font-serif italic text-balance">
              Elección: <span className="font-semibold text-brand-gray">"{selectedOption}"</span>
            </p>
            <p className="text-[10px] text-brand-gray/60 mt-4 leading-relaxed max-w-xs mx-auto">
              Tu respuesta ha sido almacenada. Los aciertos y puntajes se revelarán en la pantalla grande inmediatamente cuando termine la cuenta regresiva.
            </p>
          </div>
        ) : (
          /* Case E: Question expired, showing outcome */
          <div className="w-full bg-white border border-gold/30 p-6 shadow-sm text-center">
            {responses.some(r => r.guestId === guestId && r.questionId === activeQuestion?.id && r.isCorrect) ? (
              /* CORRECT Outcome */
              <div className="animate-fade-in">
                <div className="w-12 h-12 border border-gold rounded-full flex items-center justify-center mx-auto text-gold mb-4">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl italic font-semibold text-gold">¡EXCELENTE!</h3>
                <p className="text-xs text-brand-gray/60 mt-1 font-sans uppercase tracking-widest text-[9px]">
                  Respuesta Correcta. Has sumado puntos en esta ronda.
                </p>

                <div className="mt-6 bg-brand-gray p-4 rounded-none text-white text-center border border-gold/40">
                  <div className="text-[8px] uppercase tracking-[0.2em] text-gold font-bold">PUNTOS OBTENIDOS:</div>
                  <div className="text-3xl font-serif italic font-light text-gold mt-1 animate-pulse">
                    +{responses.find(r => r.guestId === guestId && r.questionId === activeQuestion?.id)?.pointsEarned} pts
                  </div>
                </div>
              </div>
            ) : (
              /* INCORRECT/MISSED Outcome */
              <div className="animate-fade-in">
                <div className="w-12 h-12 border border-brand-gray/20 rounded-full flex items-center justify-center mx-auto text-brand-gray/50 mb-4">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl italic font-semibold text-brand-gray/75">INCORRECTO</h3>
                <p className="text-xs text-brand-gray/55 mt-1 max-w-xs mx-auto italic font-serif">
                  ¡Vaya! Esa no es la respuesta definida por los novios en su historia. ¡Presta mucha atención en la siguiente ronda!
                </p>

                <div className="mt-6 bg-[#FDFCFB] border border-gold/20 p-4.5 text-left">
                  <span className="block text-[8px] text-[#D4AF37] uppercase font-bold tracking-wider">La respuesta correcta era:</span>
                  <p className="mt-1 text-xs text-brand-gray font-serif font-bold italic leading-tight">
                    "{activeQuestion?.correctAnswer}"
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 border-t border-gold/20 pt-4 text-[10px] uppercase tracking-widest text-brand-gray/40">
              Esperando a que el organizador inicie la siguiente...
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
