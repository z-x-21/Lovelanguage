/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, Clock, Trophy, Users, CheckCircle } from 'lucide-react';
import { GameState, Question, Guest, GuestResponse } from '../types';
import LeaderboardPodium from './LeaderboardPodium';

interface DisplayScreenProps {
  gameState: GameState;
  questions: Question[];
  guests: Guest[];
  responses: GuestResponse[];
  onRestartFromPodium?: () => void;
}

const OPTION_STYLES = [
  { bg: 'bg-rose-500',   border: 'border-rose-600',   shape: '▲', label: 'A' },
  { bg: 'bg-blue-500',   border: 'border-blue-600',   shape: '◆', label: 'B' },
  { bg: 'bg-amber-400',  border: 'border-amber-500',  shape: '●', label: 'C' },
  { bg: 'bg-emerald-500',border: 'border-emerald-600',shape: '■', label: 'D' },
];

export default function DisplayScreen({ gameState, questions, guests, responses, onRestartFromPodium }: DisplayScreenProps) {
  const [timeLeft, setTimeLeft] = React.useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (gameState.questionActive && gameState.timerEndAt) {
      if (timerRef.current) clearInterval(timerRef.current);
      const tick = () => {
        const diff = Math.max(0, Math.ceil((gameState.timerEndAt! - Date.now()) / 1000));
        setTimeLeft(diff);
        if (diff <= 0 && timerRef.current) clearInterval(timerRef.current);
      };
      tick();
      timerRef.current = setInterval(tick, 300);
    } else {
      setTimeLeft(0);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState.questionActive, gameState.timerEndAt]);

  if (gameState.status === 'completed') {
    return <LeaderboardPodium guests={guests} onRestart={onRestartFromPodium || (() => {})} />;
  }

  if (gameState.status === 'setup' || gameState.status === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center text-white">
        <Heart className="w-20 h-20 text-rose-400 animate-heart-pulse mb-6" />
        <h1 className="font-serif text-5xl font-bold text-gold mb-4">Trivia de Bodas</h1>
        <p className="text-slate-400 text-xl">Esperando que el organizador inicie el juego...</p>
        <div className="mt-8 flex items-center gap-3 bg-white/10 rounded-2xl px-6 py-4">
          <Users className="w-6 h-6 text-rose-300" />
          <span className="text-2xl font-bold">{guests.length}</span>
          <span className="text-slate-400">invitados conectados</span>
        </div>
        <p className="mt-10 text-sm text-slate-500">
          Únete con tu celular en:{' '}
          <span className="text-gold font-semibold font-mono text-base">
            {typeof window !== 'undefined' ? window.location.origin : ''}<wbr />/?role=invitado
          </span>
        </p>
      </div>
    );
  }

  const activeQuestion = questions[gameState.currentQuestionIndex] || null;
  const questionNumber = (gameState.currentQuestionIndex || 0) + 1;
  const totalQuestions = questions.length;

  const questionResponses = responses.filter(r => r.questionId === activeQuestion?.id);
  const correctCount = questionResponses.filter(r => r.isCorrect).length;
  const totalResponses = questionResponses.length;

  const timerPercent = gameState.timerEndAt
    ? Math.max(0, Math.min(100, (timeLeft / (gameState.timerDuration || 20)) * 100))
    : 0;
  const timerUrgent = timeLeft <= 5 && gameState.questionActive;

  if (!activeQuestion) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p className="text-2xl text-slate-400">Cargando preguntas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col text-white select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-black/30">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-rose-400" />
          <span className="font-serif text-xl font-semibold text-gold">Trivia de Boda</span>
        </div>
        <div className="text-slate-400 text-sm font-medium">
          Pregunta {questionNumber} de {totalQuestions}
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Users className="w-4 h-4" />
          <span>{guests.length} jugadores</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full h-2 bg-slate-700">
        <div
          className={`h-full transition-all duration-300 ${timerUrgent ? 'bg-rose-500' : 'bg-gold'}`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Question card */}
      <div className="flex-1 flex flex-col px-8 pt-8 pb-4">
        <div className="bg-white/10 backdrop-blur rounded-3xl p-8 mb-8 text-center relative animate-fade-in">
          {gameState.questionActive && (
            <div className={`absolute top-4 right-4 flex items-center gap-2 ${timerUrgent ? 'text-rose-400 animate-heart-pulse' : 'text-gold'}`}>
              <Clock className="w-6 h-6" />
              <span className="text-4xl font-bold font-mono tabular-nums">{timeLeft}</span>
            </div>
          )}
          {gameState.showResults && !gameState.questionActive && (
            <div className="absolute top-4 right-4 flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-6 h-6" />
              <span className="text-sm font-semibold">{correctCount}/{totalResponses} acertaron</span>
            </div>
          )}
          <p className="text-2xl md:text-4xl font-serif font-semibold leading-snug text-white pr-20">
            {activeQuestion.questionText}
          </p>
        </div>

        {/* Answer options grid */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          {(activeQuestion.options || []).map((option, idx) => {
            const style = OPTION_STYLES[idx] || OPTION_STYLES[0];
            const isCorrect = option === activeQuestion.correctAnswer;
            const showingResults = gameState.showResults && !gameState.questionActive;

            let cellClass = `${style.bg} border-b-4 ${style.border} rounded-2xl p-5 flex items-center gap-4 transition-all duration-300`;
            if (showingResults) {
              cellClass += isCorrect
                ? ' ring-4 ring-white scale-105 shadow-2xl'
                : ' opacity-40';
            }

            return (
              <div key={idx} className={cellClass}>
                <span className="text-3xl font-bold opacity-90 w-10 text-center flex-shrink-0">
                  {style.shape}
                </span>
                <span className="text-xl font-semibold leading-snug">
                  {option}
                </span>
                {showingResults && isCorrect && (
                  <CheckCircle className="ml-auto w-8 h-8 text-white flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Results summary row */}
        {gameState.showResults && !gameState.questionActive && (
          <div className="mt-6 flex items-center justify-center gap-6 animate-fade-in">
            <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl px-6 py-3 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-gold" />
              <span className="text-lg font-semibold text-emerald-300">
                {correctCount} de {totalResponses} respondieron correctamente
              </span>
            </div>
          </div>
        )}

        {/* Waiting state */}
        {!gameState.questionActive && !gameState.showResults && (
          <div className="mt-6 text-center text-slate-400 animate-fade-in">
            <p className="text-lg">El organizador está a punto de lanzar el cronómetro...</p>
          </div>
        )}
      </div>

      {/* Bottom scoreboard strip */}
      {guests.length > 0 && (
        <div className="bg-black/40 px-8 py-3 flex items-center gap-4 overflow-hidden">
          <Trophy className="w-4 h-4 text-gold flex-shrink-0" />
          <div className="flex gap-4 overflow-x-auto scrollbar-none">
            {guests.slice(0, 10).map((g, i) => (
              <div key={g.id} className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                <span className={`font-bold ${i === 0 ? 'text-gold' : 'text-slate-300'}`}>#{i + 1}</span>
                <span className="text-slate-400">{g.name}</span>
                <span className={`font-mono font-bold ${i === 0 ? 'text-gold' : 'text-white'}`}>{g.score || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
