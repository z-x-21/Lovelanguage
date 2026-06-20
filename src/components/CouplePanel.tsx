/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Save, Heart, Sparkle, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Question, CoupleBio } from '../types';

interface CouplePanelProps {
  onBackToMenu: () => void;
  savedQuestions: Question[];
  onPublishQuestions: (questions: Question[]) => Promise<void>;
}

export default function CouplePanel({
  onBackToMenu,
  savedQuestions,
  onPublishQuestions,
}: CouplePanelProps) {
  // Couple bio state fields (Translated default backstories to Spanish with local draft retention)
  const [bio, setBio] = React.useState<CoupleBio>(() => {
    const saved = localStorage.getItem('wedding_trivia_draft_bio');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to defaults
      }
    }
    return {
      brideName: 'Raquel',
      groomName: 'Alejandro',
      howWeMet: 'Nos tropezamos en un parque de perros por la tarde cuando nuestros golden retrievers enredaron sus correas, provocando cafés derramados y muchas risas.',
      funnyAnecdote: 'Alejandro intentó hacer un soufflé casero para Raquel en su primer aniversario. Se desinfló por completo a los 30 segundos de salir del horno, por lo que terminamos comiendo palomitas de microondas y pizza fría.',
      coupleBiographyText: 'Raquel es diseñadora de interiores, le encanta la alfarería y la comida picante. Alejandro es programador de software, disfruta del senderismo, toca la guitarra acústica desafinada y siempre pierde su teléfono.'
    };
  });

  const [questions, setQuestions] = React.useState<Question[]>(() => {
    const draft = localStorage.getItem('wedding_trivia_draft_questions');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return savedQuestions.length > 0 ? savedQuestions : [];
  });

  // Keep draft biography and generated questions in sync with localStorage automatically
  React.useEffect(() => {
    localStorage.setItem('wedding_trivia_draft_bio', JSON.stringify(bio));
  }, [bio]);

  React.useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem('wedding_trivia_draft_questions', JSON.stringify(questions));
    }
  }, [questions]);
  const [loadingQuestions, setLoadingQuestions] = React.useState(false);
  const [loadingDistractors, setLoadingDistractors] = React.useState<Record<number, boolean>>({});
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const [apiMessage, setApiMessage] = React.useState<string | null>(null);

  // Generate 15 questions using our AI Architect backend route
  const handleGenerateQuestions = async () => {
    setLoadingQuestions(true);
    setApiMessage(null);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bio),
      });

      if (!response.ok) {
        throw new Error('Server returned an error generating questions.');
      }

      const data = await response.json();
      
      // Map API questions and prepare standard default options (using just the correct answer as the lone option for now)
      const mapped: Question[] = data.questions.map((q: any) => ({
        id: q.id,
        questionText: q.questionText,
        correctAnswer: q.suggestedCorrectAnswer,
        suggestedCorrectAnswer: q.suggestedCorrectAnswer,
        // Default options array containing the correct answer until distractors are fetched
        options: [q.suggestedCorrectAnswer, "Opción B", "Opción C", "Opción D"]
      }));

      setQuestions(mapped);
      if (data.usingFallback) {
        setApiMessage('💡 Ejecutando en Modo de Demostración: Hemos adaptado 15 preguntas divertidas de boda. ¡Configura tu GEMINI_API_KEY en la configuración para generar preguntas personalizadas en tiempo real con IA!');
      } else {
        setApiMessage('✨ ¡Éxito! La IA de Gemini ha analizado su historia de amor y ha redactado 15 preguntas personalizadas para sus invitados.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error al conectar con la API del Quiz de Bodas. Por favor, verifica tu conexión.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Helper utility to shuffle response options
  const shuffleArray = (array: string[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Calls the AI Smart Distractors API line-item by line-item
  const handleGenerateDistractors = async (questionId: number) => {
    const qIndex = questions.findIndex(q => q.id === questionId);
    if (qIndex === -1) return;

    const targetQuestion = questions[qIndex];
    if (!targetQuestion.correctAnswer.trim()) {
      alert('¡Por favor ingresa una respuesta correcta definitiva antes de generar los distractores inteligentes!');
      return;
    }

    setLoadingDistractors(prev => ({ ...prev, [questionId]: true }));
    try {
      const response = await fetch('/api/generate-distractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: targetQuestion.questionText,
          correctAnswer: targetQuestion.correctAnswer
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from distractors database');
      }

      const data = await response.json();
      const generatedDistractors: string[] = data.distractors || [];

      // Combine correct answer and 3 distractors, then shuffle
      const combinedOptions = shuffleArray([
        targetQuestion.correctAnswer,
        ...generatedDistractors.slice(0, 3)
      ]);

      // Update question options list in state
      setQuestions(prev => {
        const updated = [...prev];
        updated[qIndex] = {
          ...updated[qIndex],
          options: combinedOptions
        };
        return updated;
      });
    } catch (err) {
      console.error(err);
      // Fail gracefully and create friendly, wedding-themed distractors
      const defaultSpokes = [
        `Otra opción genérica de respuesta ficticia`,
        `Un escenario completamente diferente en la boda`,
        `${targetQuestion.correctAnswer} - pero con un giro dramático`
      ];
      const combined = shuffleArray([targetQuestion.correctAnswer, ...defaultSpokes]);
      setQuestions(prev => {
        const updated = [...prev];
        updated[qIndex] = { ...updated[qIndex], options: combined };
        return updated;
      });
    } finally {
      setLoadingDistractors(prev => ({ ...prev, [questionId]: false }));
    }
  };

  // Quick helper to auto-generate distractors for ALL questions in a single button click (Highly popular for quick setups)
  const [bulkGenerating, setBulkGenerating] = React.useState(false);
  const handleBulkGenerateDistractors = async () => {
    if (questions.length === 0) return;
    setBulkGenerating(true);
    for (const q of questions) {
      await handleGenerateDistractors(q.id);
    }
    setBulkGenerating(false);
  };

  // Update Correct Answer field directly inside state list
  const handleCorrectAnswerChange = (questionId: number, newAnswer: string) => {
    setQuestions(prev => 
      prev.map(q => q.id === questionId ? { ...q, correctAnswer: newAnswer } : q)
    );
  };

  // Save the complete set back to Firestore
  const handleSaveToFirestore = async () => {
    if (questions.length === 0) {
      alert('¡Genera o carga preguntas primero antes de publicar!');
      return;
    }

    setSaveStatus('saving');
    try {
      await onPublishQuestions(questions);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      alert('No se pudieron guardar las preguntas en Firestore. Verifica tu conexión.');
      setSaveStatus('idle');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 font-sans text-brand-gray">
      {/* Back button */}
      <button
        onClick={onBackToMenu}
        id="btn_back_to_menu"
        className="inline-flex items-center space-x-2 text-[10px] font-semibold text-brand-gray/50 hover:text-brand-gray uppercase tracking-widest transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-gold" />
        <span>Volver al Lobby de Selección</span>
      </button>

      {/* Profile Header */}
      <div className="p-6 md:p-8 border border-gold/30 bg-[#FDFCFB] mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-brand-gray font-normal italic mb-2">
          Creador de Preguntas de la Pareja
        </h1>
        <p className="text-brand-gray/70 text-xs md:text-xs max-w-2xl font-light leading-relaxed">
          Diseña una trivia completamente personalizada basada en cómo se conocieron y sus mejores anécdotas. ¡Nuestro generador inteligente redactará 15 preguntas temáticas con distractores graciosos en segundos!
        </p>
      </div>

      {/* Biography Input Panel */}
      <div className="bg-white border border-gold/30 p-6 mb-8">
        <h3 className="font-serif text-lg font-normal italic text-brand-gray border-b border-gold/20 pb-3 mb-5 flex items-center space-x-2">
          <Heart className="w-5 h-5 text-gold fill-current animate-heart-pulse" />
          <span>Biografía de Amor de la Boda</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2">
              Nombre de la Novia
            </label>
            <input
              type="text"
              value={bio.brideName}
              onChange={(e) => setBio({ ...bio, brideName: e.target.value })}
              className="w-full bg-[#FDFCFB]/50 border border-gold/20 rounded-none p-3 text-xs font-semibold focus:bg-white focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2">
              Nombre del Novio
            </label>
            <input
              type="text"
              value={bio.groomName}
              onChange={(e) => setBio({ ...bio, groomName: e.target.value })}
              className="w-full bg-[#FDFCFB]/50 border border-gold/20 rounded-none p-3 text-xs font-semibold focus:bg-white focus:outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[9px] font-semibold text-[#D4AF37] uppercase tracking-widest mb-2">
              Cómo se conocieron (La historia de origen)
            </label>
            <textarea
              rows={2}
              value={bio.howWeMet}
              onChange={(e) => setBio({ ...bio, howWeMet: e.target.value })}
              className="w-full bg-[#FDFCFB]/50 border border-gold/20 rounded-none p-3 text-xs text-brand-gray leading-relaxed focus:bg-white focus:outline-none focus:border-gold transition-colors"
              placeholder="Cuéntanos el momento más romántico o divertido..."
            />
          </div>

          <div>
            <label className="block text-[9px] font-semibold text-[#D4AF37] uppercase tracking-widest mb-2">
              Anécdota graciosa o desastre divertido (Toque de humor)
            </label>
            <textarea
              rows={2}
              value={bio.funnyAnecdote}
              onChange={(e) => setBio({ ...bio, funnyAnecdote: e.target.value })}
              className="w-full bg-[#FDFCFB]/50 border border-gold/20 rounded-none p-3 text-xs text-brand-gray leading-relaxed focus:bg-white focus:outline-none focus:border-gold transition-colors"
              placeholder="Un percance en la cocina, un desastre en la primera cita, un hábito gracioso..."
            />
          </div>

          <div>
            <label className="block text-[9px] font-semibold text-[#D4AF37] uppercase tracking-widest mb-2">
              Otros datos curiosos, hobbies o detalles adicionales
            </label>
            <textarea
              rows={2}
              value={bio.coupleBiographyText}
              onChange={(e) => setBio({ ...bio, coupleBiographyText: e.target.value })}
              className="w-full bg-[#FDFCFB]/50 border border-gold/20 rounded-none p-3 text-xs text-brand-gray leading-relaxed focus:bg-white focus:outline-none focus:border-gold transition-colors"
              placeholder="Hobbies, manías curiosas, bromas internas de la pareja..."
            />
          </div>
        </div>

        {/* Buttons to trigger API */}
        <div className="mt-6 pt-4 border-t border-gold/20 flex items-center justify-between">
          <button
            onClick={handleGenerateQuestions}
            disabled={loadingQuestions || bulkGenerating}
            id="btn_draft_questions_ai"
            className="w-full md:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-brand-gray hover:bg-gold hover:text-brand-gray text-white font-semibold text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loadingQuestions ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-gold" />
                <span>IA redactando 15 Preguntas...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                <span>Redactar 15 Preguntas Únicas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Display Alert Message feedback */}
      {apiMessage && (
        <div className="mb-8 p-4 bg-brand-gray text-gold text-xs border border-gold/40 flex items-start space-x-2 shadow-sm animate-fade-in font-mono leading-relaxed">
          <span>{apiMessage}</span>
        </div>
      )}

      {/* Generated Questions List (Couples Validation Panel) */}
      {questions.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#FDFCFB] p-5 border border-gold/30">
            <div>
              <h2 className="font-serif text-lg italic text-brand-gray">
                Panel de Validación de la Boda
              </h2>
              <p className="text-xs text-brand-gray/60 font-light mt-0.5">
                Valida las respuestas correctas abajo y pulsa para generar las opciones incorrectas basadas en IA.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleBulkGenerateDistractors}
                disabled={bulkGenerating || loadingQuestions}
                id="btn_bulk_distractors"
                className="px-4 py-2.5 bg-white hover:bg-blush/20 border border-gold/40 text-brand-gray rounded-none text-[10px] uppercase tracking-widest font-semibold transition-all disabled:opacity-55 cursor-pointer"
              >
                {bulkGenerating ? 'Generando opciones...' : 'Generar Opciones para Todas 🪄'}
              </button>

              <button
                onClick={handleSaveToFirestore}
                disabled={saveStatus === 'saving' || bulkGenerating}
                id="btn_publish_db"
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-brand-gray hover:bg-gold hover:text-brand-gray text-white rounded-none text-[10px] uppercase tracking-widest font-semibold shadow-sm transition-all cursor-pointer"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
                    <span>Publicando...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-gold" />
                    <span>¡Publicado con Éxito!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1 text-gold" />
                    <span>Publicar al Juego en Vivo</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white border border-gold/30 p-6 relative group">
                <div className="absolute top-5 right-6 text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                  Pregunta {idx + 1} de 15
                </div>

                <div className="max-w-[80%]">
                  <h4 className="font-serif text-lg font-normal italic text-brand-gray leading-snug">
                    {q.questionText}
                  </h4>
                </div>

                {/* Validation and customizable fields */}
                <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-8">
                    <label className="block text-[9px] uppercase font-bold text-[#D4AF37] tracking-widest mb-1.5">
                      Respuesta Correcta Definitiva de los Novios
                    </label>
                    <input
                      type="text"
                      value={q.correctAnswer}
                      onChange={(e) => handleCorrectAnswerChange(q.id, e.target.value)}
                      className="w-full bg-[#FDFCFB]/50 border border-gold/20 rounded-none px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:border-gold"
                      placeholder="Escribe la respuesta correcta verdadera..."
                    />
                  </div>

                  <div className="md:col-span-4">
                    <button
                      onClick={() => handleGenerateDistractors(q.id)}
                      disabled={loadingDistractors[q.id] || !q.correctAnswer.trim()}
                      id={`btn_distractor_${q.id}`}
                      className="w-full inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-brand-gray hover:bg-gold hover:text-brand-gray disabled:bg-brand-gray/10 text-white disabled:text-brand-gray/40 rounded-none text-[10px] font-semibold uppercase tracking-widest transition-all cursor-pointer"
                    >
                      {loadingDistractors[q.id] ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-gold" />
                          <span>IA Barajando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkle className="w-3.5 h-3.5 fill-current animate-heart-pulse mr-1 text-gold" />
                          <span>Generar Opciones</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Shuffled Result choices Preview */}
                <div className="mt-5 pt-4 border-t border-gold/15">
                  <div className="text-[9px] text-[#D4AF37] uppercase tracking-widest font-semibold mb-3">Vista Previa de Respuestas para el Invitado</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {q.options.map((option, oIdx) => {
                      const isCorrect = option === q.correctAnswer;
                      return (
                        <div
                           key={oIdx}
                           className={`text-xs px-3 py-2 rounded-none border font-serif italic truncate ${
                             isCorrect 
                               ? 'bg-ivory border-gold text-brand-gray font-semibold' 
                               : 'bg-white border-brand-gray/10 text-brand-gray/60'
                           }`}
                           title={option}
                        >
                          <span className="font-sans font-semibold text-[9px] mr-1.5 uppercase tracking-wider text-gold">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          {option}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Published CTA banner at bottom */}
          <div className="bg-brand-gray border border-gold/30 p-8 text-center text-white">
            <h4 className="font-serif text-xl italic text-gold">¿Terminaron de personalizar su trivia de bodas?</h4>
            <p className="text-xs text-white/75 mt-2 max-w-lg mx-auto leading-relaxed">
              Al publicar el juego de preguntas oficial de su unión, el Organizador podrá cargarlas en su consola para coordinar el evento, y todos los asistentes responderán desde sus dispositivos en vivo.
            </p>
            <button
              onClick={handleSaveToFirestore}
              id="btn_publish_bottom"
              className="mt-6 inline-flex items-center space-x-2 bg-white hover:bg-gold text-brand-gray font-semibold text-[11px] uppercase tracking-[0.2em] px-8 py-3.5 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4 mr-1 text-gold" />
              <span>Publicar Juego Oficial</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
