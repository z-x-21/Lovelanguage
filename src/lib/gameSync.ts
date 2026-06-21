/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  getDocs,
  deleteDoc,
  writeBatch,
  increment,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { GameState, Question, Guest, GuestResponse } from '../types';

// Let's use a single global session document to coordinate everyone instantly
const SESSION_DOC_ID = 'main_wedding_party';

// Preguntas reales de Rafael Robles Pimienta & Ana Cecilia Falcon Missett
// La respuesta correcta rota entre posiciones B-C-D-A para que no sea siempre la primera
export const DEFAULT_LOBBY_QUESTIONS: Question[] = [
  {
    id: 1,
    questionText: "¿En qué lugar se conocieron Rafael y Ceci por primera vez?",
    correctAnswer: "En la secundaria",
    options: ["En la universidad", "En la secundaria", "En un concierto de rock", "En un restaurante"]
  },
  {
    id: 2,
    questionText: "¿En qué universo vivía Rafael cuando Ceci lo conoció?",
    correctAnswer: "Anime, música y videojuegos",
    options: ["Fútbol y natación", "Lectura y cocina", "Anime, música y videojuegos", "Ciclismo y fotografía"]
  },
  {
    id: 3,
    questionText: "¿Qué detalle especial le regaló Rafael a Ceci en la secundaria?",
    correctAnswer: "Una carta y un dibujo",
    options: ["Un ramo de flores", "Un libro de poesía", "Un peluche de anime", "Una carta y un dibujo"]
  },
  {
    id: 4,
    questionText: "¿Qué tipo de películas une más a Rafael y Ceci?",
    correctAnswer: "Terror psicológico",
    options: ["Terror psicológico", "Comedias románticas", "Documentales de naturaleza", "Acción y superhéroes"]
  },
  {
    id: 5,
    questionText: "¿Cuál es el género musical favorito de la pareja?",
    correctAnswer: "Rock alternativo e indie",
    options: ["Reggaeton y cumbia", "Rock alternativo e indie", "Pop en español", "Jazz y blues"]
  },
  {
    id: 6,
    questionText: "¿Qué hacen Rafael y Ceci en un día lluvioso perfecto?",
    correctAnswer: "Acostados con sus perritos escuchando música",
    options: ["Ver fútbol con amigos", "Cocinar recetas nuevas juntos", "Acostados con sus perritos escuchando música", "Jugar videojuegos en competencia"]
  },
  {
    id: 7,
    questionText: "¿Qué actividad eligen cuando quieren pasar tiempo juntos en casa?",
    correctAnswer: "Juegos de mesa",
    options: ["Videojuegos competitivos", "Cartas y póker", "Trivias en línea", "Juegos de mesa"]
  },
  {
    id: 8,
    questionText: "¿Cuál es la serie de terror que más les gusta a los dos?",
    correctAnswer: "La Maldición de Hill House",
    options: ["La Maldición de Hill House", "Stranger Things", "American Horror Story", "The Haunting of Bly Manor"]
  },
  {
    id: 9,
    questionText: "¿Qué tipo de restaurantes son los favoritos de Rafael y Ceci?",
    correctAnswer: "Restaurantes de espadas y buffets",
    options: ["Sushi y comida japonesa", "Restaurantes de espadas y buffets", "Taquerías y antojitos", "Pizzerías italianas"]
  },
  {
    id: 10,
    questionText: "¿Cuál fue la razón de Ceci para no poder entrar al trabajo aquella mañana?",
    correctAnswer: "Traía tenis",
    options: ["Se le olvidó la credencial", "El metro estaba lleno", "Traía tenis", "Había olvidado desayunar"]
  },
  {
    id: 11,
    questionText: "¿Qué hizo Rafael cuando Ceci dijo que quería irse de pinta?",
    correctAnswer: "La cargó hasta los torniquetes del metro",
    options: ["Se regresó a casa con ella", "La convenció de quedarse en cama", "Le compró un café para animarla", "La cargó hasta los torniquetes del metro"]
  },
  {
    id: 12,
    questionText: "¿A dónde fueron Rafael y Ceci después del incidente de los tenis?",
    correctAnswer: "A comer a un restaurante italiano",
    options: ["A comer a un restaurante italiano", "Al parque con sus perritos", "Al cine a ver terror", "A casa a descansar todo el día"]
  },
  {
    id: 13,
    questionText: "¿Cuál es el anime favorito que comparte la pareja?",
    correctAnswer: "Demon Slayer",
    options: ["Dragon Ball Z", "Demon Slayer", "Naruto Shippuden", "Attack on Titan"]
  },
  {
    id: 14,
    questionText: "Según los votos de Ceci, ¿qué le enseñó Rafael con su mundo de anime y música?",
    correctAnswer: "Que la magia se descubre si pones atención",
    options: ["Que el amor es cuestión de suerte", "Que los opuestos siempre se atraen", "Que la magia se descubre si pones atención", "Que el tiempo lo cura todo"]
  },
  {
    id: 15,
    questionText: "¿Cómo define Ceci en sus votos la diferencia entre ella y Rafael?",
    correctAnswer: "Diferentes que se volvieron un equipo",
    options: ["Idénticos en todo desde el principio", "Opuestos que nunca cambiaron", "Parecidos desde que se conocieron", "Diferentes que se volvieron un equipo"]
  }
];

// 1. Subscribe to Global Game State
export function subscribeGameState(callback: (state: GameState | null) => void, onError?: (err: any) => void) {
  const stateDocRef = doc(db, 'sessions', SESSION_DOC_ID);
  return onSnapshot(stateDocRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as GameState);
    } else {
      callback(null);
    }
  }, (err) => {
    console.error('Error fetching game state:', err);
    if (onError) onError(err);
  });
}

// 2. Initialize or Update Game State — throws on Firestore error so callers can handle/display it
export async function updateGameState(update: Partial<GameState>) {
  const stateDocRef = doc(db, 'sessions', SESSION_DOC_ID);
  await setDoc(stateDocRef, update, { merge: true });
}

// 3. Subscribe to Questions
export function subscribeQuestions(callback: (questions: Question[]) => void, onError?: (err: any) => void) {
  // We can save questions inside a nested subcollection or as an array inside a doc.
  // Using a doc is extremely simple and fast for real-time reads!
  const questionsDocRef = doc(db, 'sessions', SESSION_DOC_ID, 'setup', 'questions_data');
  return onSnapshot(questionsDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback((data.list || []) as Question[]);
    } else {
      callback([]);
    }
  }, (err) => {
    console.error('Error listening to questions:', err);
    if (onError) onError(err);
  });
}

// 4. Save Questions to Firestore
export async function saveQuestions(questions: Question[]) {
  const questionsDocRef = doc(db, 'sessions', SESSION_DOC_ID, 'setup', 'questions_data');
  await setDoc(questionsDocRef, { list: questions });
}

// 5. Subscribe to Active Guests
export function subscribeGuests(callback: (guests: Guest[]) => void, onError?: (err: any) => void) {
  const guestsColRef = collection(db, 'sessions', SESSION_DOC_ID, 'guests');
  return onSnapshot(guestsColRef, (querySnap) => {
    const list: Guest[] = [];
    querySnap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Guest);
    });
    // Sort in memory by score (descending), then by joinedAt (ascending)
    list.sort((a, b) => {
      const scoreDiff = (b.score || 0) - (a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.joinedAt || 0) - (b.joinedAt || 0);
    });
    callback(list);
  }, (err) => {
    console.error('Error subscribing to guest list:', err);
    if (onError) onError(err);
  });
}

// 6. Join or Register Guest — throws on error so GuestBuzzer can show it
export async function registerGuest(guestId: string, name: string) {
  const guestDocRef = doc(db, 'sessions', SESSION_DOC_ID, 'guests', guestId);
  await setDoc(guestDocRef, {
    id: guestId,
    name: name,
    score: 0,
    correctCount: 0,
    joinedAt: Date.now()
  }, { merge: true });
}

// 7. Submit Response and Record Velocity Score
export async function submitResponse(
  guestId: string,
  guestName: string,
  questionId: number,
  selectedOption: string,
  isCorrect: boolean,
  responseTimeMs: number,
  pointsEarned: number
) {
  const responseId = `${guestId}_q${questionId}`;
  const responseDocRef = doc(db, 'sessions', SESSION_DOC_ID, 'responses', responseId);

  try {
    // Record guest's specific response
    await setDoc(responseDocRef, {
      guestId,
      guestName,
      questionId,
      selectedOption,
      isCorrect,
      responseTimeMs,
      pointsEarned,
      timestamp: Date.now()
    });

    if (isCorrect && pointsEarned > 0) {
      const guestDocRef = doc(db, 'sessions', SESSION_DOC_ID, 'guests', guestId);
      await updateDoc(guestDocRef, {
        score: increment(pointsEarned),
        correctCount: increment(1)
      });
    }
  } catch (err) {
    console.error('Could not log response:', err);
  }
}

// 8. Subscribe to Response Stream for real-time analytics
export function subscribeResponses(callback: (responses: GuestResponse[]) => void, onError?: (err: any) => void) {
  const responsesColRef = collection(db, 'sessions', SESSION_DOC_ID, 'responses');
  return onSnapshot(responsesColRef, (querySnap) => {
    const list: GuestResponse[] = [];
    querySnap.forEach((d) => {
      list.push(d.data() as GuestResponse);
    });
    callback(list);
  }, (err) => {
    console.error('Error fetching responses in real-time:', err);
    if (onError) onError(err);
  });
}

// 9. Fully Reset/Clear State
export async function resetSessionStore(keepQuestions = true) {
  // Clear game state
  const stateDocRef = doc(db, 'sessions', SESSION_DOC_ID);
  const defaultState: GameState = {
    status: 'setup',
    currentQuestionIndex: 0,
    timerDuration: 20,
    timerEndAt: null,
    questionActive: false,
    showResults: false
  };
  await setDoc(stateDocRef, defaultState);

  // If we should not keep questions, reset to DEFAULT_LOBBY_QUESTIONS
  if (!keepQuestions) {
    const questionsDocRef = doc(db, 'sessions', SESSION_DOC_ID, 'setup', 'questions_data');
    await setDoc(questionsDocRef, { list: DEFAULT_LOBBY_QUESTIONS });
  }

  // Wipe guests subcollection
  const guestsColRef = collection(db, 'sessions', SESSION_DOC_ID, 'guests');
  const guestsSnap = await getDocs(guestsColRef);
  const batch1 = writeBatch(db);
  guestsSnap.forEach((d) => batch1.delete(d.ref));
  await batch1.commit();

  // Wipe responses subcollection
  const responsesColRef = collection(db, 'sessions', SESSION_DOC_ID, 'responses');
  const responsesSnap = await getDocs(responsesColRef);
  const batch2 = writeBatch(db);
  responsesSnap.forEach((d) => batch2.delete(d.ref));
  await batch2.commit();

  console.log('Global game session database reset successfully.');
}
