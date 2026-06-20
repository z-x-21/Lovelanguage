/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to generate elegant fallback questions dynamically based on provided details
function getFallbackQuestions(bride: string, groom: string, met: string, anecdote: string) {
  return [
    { id: 1, questionText: `Según cómo se conocieron, ¿dónde se cruzaron los caminos de ${bride} y ${groom}?`, suggestedCorrectAnswer: met },
    { id: 2, questionText: `¿Cuál es la parte más memorable de la divertida historia de ${bride} y ${groom} sobre "${anecdote.slice(0, 40)}"?`, suggestedCorrectAnswer: anecdote },
    { id: 3, questionText: `¿Quién es más probable que se despierte más temprano en un fin de semana, ${bride} o ${groom}?`, suggestedCorrectAnswer: bride },
    { id: 4, questionText: `¿Cuál es el plato favorito absoluto de ${bride} que ${groom} intenta cocinar?`, suggestedCorrectAnswer: "Pasta casera gourmet con salsa especial" },
    { id: 5, questionText: `¿Dónde tuvieron ${bride} y ${groom} su primera cita oficial?`, suggestedCorrectAnswer: "Un acogedor bistró local en una tarde lluviosa de viernes" },
    { id: 6, questionText: `¿Quién de los dos es conocido por ser el navegador designado durante los viajes por carretera?`, suggestedCorrectAnswer: groom },
    { id: 7, questionText: `¿Cuál fue la primera película que ${bride} y ${groom} vieron juntos?`, suggestedCorrectAnswer: "Una película de ciencia ficción poco valorada con una trama terrible" },
    { id: 8, questionText: `¿Cuál es la actividad preferida de la pareja para un domingo por la tarde perezoso?`, suggestedCorrectAnswer: "Hacer maratón de documentales de misterio y pedir comida a domicilio" },
    { id: 9, questionText: `¿Quién tiene más probabilidades de perder sus llaves o su teléfono dos veces en un solo día?`, suggestedCorrectAnswer: bride },
    { id: 10, questionText: `¿Cuál es el destino de viaje soñado de ${groom} del que habla constantemente?`, suggestedCorrectAnswer: "Un viaje panorámico por carretera a lo largo de la costa de Japón" },
    { id: 11, questionText: `¿Quién dio el primer paso para iniciar su relación?`, suggestedCorrectAnswer: bride },
    { id: 12, questionText: `¿Cuál es su broma interna compartida favorita sobre sus primeras citas?`, suggestedCorrectAnswer: "Pedir demasiada comida picante y fingir que todo estaba bien" },
    { id: 13, questionText: `¿Qué canción define la vibra de la lista de canciones para viajes por carretera de la pareja?`, suggestedCorrectAnswer: "Una vieja balada de rock de los 80 cantada fuera de tono" },
    { id: 14, questionText: `¿Qué apodo cariñoso usan únicamente cuando creen que nadie los está escuchando?`, suggestedCorrectAnswer: "Cariño" },
    { id: 15, questionText: `¿Qué es lo que más esperan de su luna de miel?`, suggestedCorrectAnswer: "Dormir hasta tarde durante cinco días seguidos cerca de una playa soleada" }
  ];
}

// Helper to instantiate GoogleGenAI lazily and safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// 1. Generate 15 Relationship Questions API
app.post('/api/generate-questions', async (req, res) => {
  const { brideName, groomName, howWeMet, funnyAnecdote, coupleBiographyText } = req.body;

  const bride = brideName || 'La Novia';
  const groom = groomName || 'El Novio';
  const met = howWeMet || 'una boda';
  const anecdote = funnyAnecdote || 'un reencuentro divertido';
  const customBio = coupleBiographyText || '';

  const aiClient = getGeminiClient();

  if (!aiClient) {
    console.warn('GEMINI_API_KEY is not set or placeholder. Initiating elegant default questions fallback.');
    const fallbackQuestions = getFallbackQuestions(bride, groom, met, anecdote);
    return res.json({ 
      questions: fallbackQuestions, 
      usingFallback: true, 
      message: 'Using simulated generative engine (configure GEMINI_API_KEY for custom AI quiz)' 
    });
  }

  try {
    const prompt = `
      You are an expert Relationship Question Architect.
      Create exactly 15 unique, fun, and highly personalized wedding trivia questions based on the details below:
      Bride's name: ${bride}
      Groom's name: ${groom}
      How they met: ${met}
      Funny story/anecdote: ${anecdote}
      Other biographical details: ${customBio}

      CRITICAL: Write ALL questions and suggested correct answers entirely in Spanish (Español).
      Focus on romantic, lighthearted, and humorous moments. Craft realistic, customized questions that guests will enjoy debating. 
      For each question, provide a short, accurate suggested correct answer based on the biography. Keep answers concise (1-5 words preferred).
      
      Output MUST be direct JSON with schema:
      [
        { "id": 1, "questionText": "string", "suggestedCorrectAnswer": "string" },
        ...
      ]
      Generate EXACTLY 15 questions.
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              questionText: { type: Type.STRING },
              suggestedCorrectAnswer: { type: Type.STRING }
            },
            required: ['id', 'questionText', 'suggestedCorrectAnswer']
          }
        }
      }
    });

    const parsedText = response.text;
    const questions = JSON.parse(parsedText);
    return res.json({ questions, usingFallback: false });
  } catch (error: any) {
    console.error('Error generating questions with Gemini:', error);
    console.warn('Falling back to default questions gracefully on error.');
    const fallbackQuestions = getFallbackQuestions(bride, groom, met, anecdote);
    return res.json({ 
      questions: fallbackQuestions, 
      usingFallback: true, 
      message: 'Error en servicio de IA. Usando lista por defecto.' 
    });
  }
});

// 2. Generate AI Smart Distractors API
app.post('/api/generate-distractors', async (req, res) => {
  const { questionText, correctAnswer } = req.body;

  if (!questionText || !correctAnswer) {
    return res.status(400).json({ error: 'Missing questionText or correctAnswer context.' });
  }

  const aiClient = getGeminiClient();

  if (!aiClient) {
    // Graceful fallback distractors generators (Translated to Spanish)
    const fallbackDistractors = [
      `Un lugar completamente diferente en otra ciudad`,
      `Un viaje desastroso a ${correctAnswer.length > 15 ? 'un zoológico' : 'París'}`,
      `Hacer literalmente cualquier otra cosa, totalmente ajena a ${correctAnswer.slice(0, 10)}`
    ];
    return res.json({ 
      distractors: fallbackDistractors, 
      usingFallback: true 
    });
  }

  try {
    const prompt = `
      You are a witty wedding host creating incorrect choices (distractors) for a wedding trivia question.
      Craft exactly three (3) highly plausible, clever, or humorous incorrect answer options (distractors) in Spanish (Español) for guests to choose from.
      The distractors should fit the lighthearted tone of a wedding reception and make the real choice challenging but light.

      Trivia Question: "${questionText}"
      Definitive Correct Answer: "${correctAnswer}"

      CRITICAL: Write ALL distractors entirely in Spanish (Español).
      Provide EXACTLY three options. 
      Output MUST be direct JSON with schema:
      {
        "distractors": ["alternative answer 1", "alternative answer 2", "alternative answer 3"]
      }
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            distractors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['distractors']
        }
      }
    });

    const parsedData = JSON.parse(response.text);
    return res.json({ distractors: parsedData.distractors, usingFallback: false });
  } catch (error: any) {
    console.error('Error generating distractors with Gemini:', error);
    console.warn('Falling back to default distractors gracefully.');
    const fallbackDistractors = [
      `Un lugar completamente diferente en otra ciudad`,
      `Un viaje desastroso a ${correctAnswer.length > 15 ? 'un zoológico' : 'París'}`,
      `Hacer literalmente cualquier otra cosa, totalmente ajena a ${correctAnswer.slice(0, 10)}`
    ];
    return res.json({ 
      distractors: fallbackDistractors, 
      usingFallback: true,
      message: 'Fallo al generar distractores con IA. Usando lista por defecto.'
    });
  }
});

// Setup Vite & Static Assets serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
    console.log('Vite middleware and dev fallback handler mounted.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static path configured:', distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wedding Quiz Server active at http://localhost:${PORT}`);
  });
}

startServer();
