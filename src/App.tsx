/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  subscribeGameState, 
  updateGameState, 
  subscribeQuestions, 
  saveQuestions, 
  subscribeGuests, 
  registerGuest, 
  submitResponse, 
  subscribeResponses, 
  resetSessionStore,
  DEFAULT_LOBBY_QUESTIONS
} from './lib/gameSync';
import { GameState, Question, Guest, GuestResponse } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Importing child modules
import RoleSelector from './components/RoleSelector';
import CouplePanel from './components/CouplePanel';
import HostConsole from './components/HostConsole';
import GuestBuzzer from './components/GuestBuzzer';
import LeaderboardPodium from './components/LeaderboardPodium';
import DisplayScreen from './components/DisplayScreen';

export default function App() {
  // Read initial role from query parameter, hash, or pathname to keep screens independent
  const getInitialRole = (): 'lobby' | 'couple' | 'host' | 'guest' | 'sandbox' | 'display' => {
    if (typeof window === 'undefined') return 'lobby';
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const hashParam = window.location.hash.toLowerCase().replace('#', '');
    const pathParam = window.location.pathname.toLowerCase().replace(/^\//, '');

    const normalized = roleParam || hashParam || pathParam;
    if (normalized === 'organizador' || normalized === 'host') return 'host';
    if (normalized === 'novios' || normalized === 'couple') return 'couple';
    if (normalized === 'sandbox' || normalized === 'pruebas') return 'sandbox';
    if (normalized === 'admin' || normalized === 'lobby') return 'lobby';
    if (normalized === 'guest' || normalized === 'invitado') return 'guest';
    if (normalized === 'display' || normalized === 'pantalla' || normalized === 'tv') return 'display';

    // Auto-resume if the guest already joined previously with a nickname
    const savedName = localStorage.getItem('wedding_trivia_guest_name');
    if (savedName) {
      return 'guest';
    }

    // Default to 'lobby' so the user can choose their seat (Couple, Organizer, or Guest)
    return 'lobby';
  };

  const [role, setRole] = React.useState<'lobby' | 'couple' | 'host' | 'guest' | 'sandbox' | 'display'>(getInitialRole);
  
  // Database real-time values and connection diagnostic tracking
  const [gameState, setGameState] = React.useState<GameState | null>(null);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [guests, setGuests] = React.useState<Guest[]>([]);
  const [responses, setResponses] = React.useState<GuestResponse[]>([]);
  const [connectionError, setConnectionError] = React.useState<string | null>(null);

  // 1. Setup real-time subscribers on mount
  React.useEffect(() => {
    const handleError = (err: any) => {
      console.warn("Caught real-time subscription error:", err);
      // Capture error code to give precise developer advice
      if (err?.code === 'permission-denied' || String(err).includes('permission')) {
        setConnectionError('permission-denied');
      } else {
        setConnectionError('failed-to-connect');
      }
    };

    const unsubState = subscribeGameState((state) => {
      // Clear error on first successful fetch
      setConnectionError(null);
      if (state) {
        setGameState(state);
      } else {
        // If there's no state in Firestore yet, initialize it
        const initialState: GameState = {
          status: 'setup',
          currentQuestionIndex: 0,
          timerDuration: 20,
          timerEndAt: null,
          questionActive: false,
          showResults: false
        };
        updateGameState(initialState).then(() => {
          setGameState(initialState);
        }).catch(handleError);
      }
    }, handleError);

    const unsubQuestions = subscribeQuestions((list) => {
      setConnectionError(null);
      // If there are no questions in Firebase yet, seed default ones automatically!
      if (list && list.length > 0) {
        setQuestions(list);
      } else {
        saveQuestions(DEFAULT_LOBBY_QUESTIONS).then(() => {
          setQuestions(DEFAULT_LOBBY_QUESTIONS);
        }).catch(handleError);
      }
    }, handleError);

    const unsubGuests = subscribeGuests((list) => {
      setConnectionError(null);
      setGuests(list);
    }, handleError);

    const unsubResponses = subscribeResponses((list) => {
      setConnectionError(null);
      setResponses(list);
    }, handleError);

    return () => {
      unsubState();
      unsubQuestions();
      unsubGuests();
      unsubResponses();
    };
  }, []);

  // Standard updates
  const handleUpdateGameState = async (update: Partial<GameState>) => {
    await updateGameState(update);
  };

  const handlePublishQuestions = async (newQuestions: Question[]) => {
    await saveQuestions(newQuestions);
    await updateGameState({
      status: 'lobby',
      currentQuestionIndex: 0,
      questionActive: false,
      showResults: false,
      timerEndAt: null
    });
  };

  const handleResetSession = async () => {
    await resetSessionStore(true); // Wipes guests & responses but keeps questions
  };

  const handleFullReset = async () => {
    await resetSessionStore(false); // Wipes everything and resets questions to default lobby ones
  };

  // Safe checks
  const safeState: GameState = gameState || {
    status: 'setup',
    currentQuestionIndex: 0,
    timerDuration: 20,
    timerEndAt: null,
    questionActive: false,
    showResults: false
  };

  // Display role: full-screen read-only TV/projector view (no shell chrome)
  if (role === 'display') {
    return (
      <DisplayScreen
        gameState={safeState}
        questions={questions}
        guests={guests}
        responses={responses}
        onRestartFromPodium={async () => {
          await handleResetSession();
        }}
      />
    );
  }

  // Override: If game status is 'completed', show LeaderboardPodium globally for host/sandbox/guest!
  if (safeState.status === 'completed') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <LeaderboardPodium
          guests={guests}
          onRestart={async () => {
            await handleResetSession();
            setRole('lobby');
          }}
        />
        <footer className="py-4 text-center text-[10px] text-slate-400 font-mono border-t border-slate-150">
          Sincronizador de Bodas • Trivia en tiempo real
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {connectionError === 'permission-denied' && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3.5 text-xs flex items-center justify-center space-x-2 font-medium animate-fade-in shadow-sm">
          <div className="max-w-3xl leading-relaxed text-center">
            ⚠️ <strong>Atención (Reglas de Firestore):</strong> Los invitados en otros navegadores o móviles no se sincronizarán porque las Reglas de Seguridad de tu proyecto de Firebase <strong>({firebaseConfig.projectId})</strong> están denegando el acceso público.
            <br />
            <span className="text-[11px] text-amber-800 font-normal">
              <strong>Solución Exprés:</strong> Ve a tu <u>Consola de Firebase</u> &rarr; <u>Firestore Database</u> &rarr; pestaña <strong>Reglas (Rules)</strong> y configúralas en modo de prueba (lectura/escritura abiertas) escribiendo: <code className="bg-amber-100 px-1 py-0.5 rounded text-rose-700 font-mono font-bold">allow read, write: if true;</code>
            </span>
          </div>
        </div>
      )}

      {connectionError === 'failed-to-connect' && (
        <div className="bg-red-50 border-b border-red-100 text-red-900 px-4 py-3 text-xs flex items-center justify-center font-medium animate-fade-in">
          <div className="max-w-3xl leading-relaxed text-center">
            ⚠️ <strong>Error de Red / Conexión:</strong> No se pudo conectar con el servidor de Firestore en la nube us-east1. Verifica que la base de datos de tu proyecto exista y esté activa.
          </div>
        </div>
      )}

      <main className="flex-grow">
        {role === 'lobby' && (
          <RoleSelector
            onSelectRole={(r) => setRole(r)}
            guestCount={guests.length}
            questionCount={questions.length}
            gameStatus={safeState.status}
            onResetAll={handleFullReset}
          />
        )}

        {role === 'couple' && (
          <CouplePanel
            onBackToMenu={() => setRole('lobby')}
            savedQuestions={questions}
            onPublishQuestions={handlePublishQuestions}
          />
        )}

        {role === 'host' && (
          <HostConsole
            onBackToMenu={() => setRole('lobby')}
            gameState={safeState}
            questions={questions}
            guests={guests}
            responses={responses}
            onUpdateState={handleUpdateGameState}
            onResetSession={handleResetSession}
          />
        )}

        {role === 'guest' && (
          <GuestBuzzer
            onBackToMenu={() => setRole('lobby')}
            gameState={safeState}
            questions={questions}
            guests={guests}
            responses={responses}
            onRegister={registerGuest}
            onSubmitAnswer={submitResponse}
          />
        )}

        {role === 'sandbox' && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-center mb-6">
              <div className="text-xs bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1 rounded-full inline-block font-semibold">
                🔧 Modo de Pruebas Interactivo Activo (El panel izquierdo actúa como Organizador / El panel derecho actúa como Invitado Móvil)
              </div>
              <button
                onClick={() => setRole('lobby')}
                className="block mx-auto text-xs text-rose-500 hover:text-rose-700 underline mt-2 font-bold cursor-pointer"
              >
                Salir del Modo de Pruebas
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Host Controller Sidebar Left */}
              <div className="lg:col-span-7 bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
                <div className="bg-slate-100 p-2.5 rounded-t-xl text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center">
                  VISTA A: Consola Central de Control del Organizador
                </div>
                <HostConsole
                  onBackToMenu={() => setRole('lobby')}
                  gameState={safeState}
                  questions={questions}
                  guests={guests}
                  responses={responses}
                  onUpdateState={handleUpdateGameState}
                  onResetSession={handleResetSession}
                  isSandbox={true}
                />
              </div>

              {/* Guest Controller Sidebar Right */}
              <div className="lg:col-span-5 bg-white rounded-2xl shadow-lg border border-slate-200 p-2 relative h-fit">
                <div className="bg-rose-50 p-2.5 rounded-t-xl text-[10px] uppercase font-bold text-rose-450 tracking-wider text-center">
                  VISTA B: Dispositivo Móvil del Invitado
                </div>
                <GuestBuzzer
                  onBackToMenu={() => setRole('lobby')}
                  gameState={safeState}
                  questions={questions}
                  guests={guests}
                  responses={responses}
                  onRegister={registerGuest}
                  onSubmitAnswer={submitResponse}
                  isSandbox={true}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-[10px] text-slate-400 font-mono border-t border-slate-200/50 bg-white">
        Consola de Trivia de Bodas • Sincronización en tiempo real vía Firestore
      </footer>
    </div>
  );
}
