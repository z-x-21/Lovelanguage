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

// Initial default questions to display immediately if they haven't generated any yet
export const DEFAULT_LOBBY_QUESTIONS: Question[] = [
  {
    id: 1,
    questionText: "¿Dónde tuvieron los novios su primera cita?",
    correctAnswer: "Un acogedor bistró italiano",
    options: ["Un acogedor bistró italiano", "Un bar deportivo ruidoso", "En una estación de metro llena de gente", "Durante una clase en línea por Zoom"]
  },
  {
    id: 2,
    questionText: "¿Quién suele decir 'Te amo' primero con más frecuencia?",
    correctAnswer: "La Novia",
    options: ["La Novia", "El Novio", "Lo dijeron exactamente al mismo segundo", "Ninguno, lo demuestran lavando los platos"]
  },
  {
    id: 3,
    questionText: "¿A dónde irá la pareja de luna de miel?",
    correctAnswer: "Un resort de playa tropical",
    options: ["Un resort de playa tropical", "Un viaje de mochileros a la montaña", "Un recorrido cultural de museos", "Un retiro forestal silencioso y sin conexión"]
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

// 2. Initialize or Update Game State
export async function updateGameState(update: Partial<GameState>) {
  const stateDocRef = doc(db, 'sessions', SESSION_DOC_ID);
  try {
    await setDoc(stateDocRef, update, { merge: true });
  } catch (err) {
    console.error('Error updating game state:', err);
  }
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
  try {
    await setDoc(questionsDocRef, { list: questions });
  } catch (err) {
    console.error('Error storing questions list:', err);
  }
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

// 6. Join or Register Guest
export async function registerGuest(guestId: string, name: string) {
  const guestDocRef = doc(db, 'sessions', SESSION_DOC_ID, 'guests', guestId);
  try {
    await setDoc(guestDocRef, {
      id: guestId,
      name: name,
      score: 0,
      correctCount: 0,
      joinedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.error('Could not register guest:', err);
  }
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
