/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  id: number;
  questionText: string;
  correctAnswer: string;
  options: string[]; // Structured array of 4 choices (shuffled)
  suggestedCorrectAnswer?: string; // Cache the originally generated correct answer
}

export interface GameState {
  status: 'setup' | 'lobby' | 'active' | 'completed';
  currentQuestionIndex: number;
  timerDuration: number; // usually 20
  timerEndAt: number | null; // Milliseconds timestamp of when current question timer locks
  questionActive: boolean; // Is dynamic countdown running
  showResults: boolean; // Show analytics for active question or not
}

export interface Guest {
  id: string; // socket/browser generated ID or firebase generated
  name: string;
  score: number;
  correctCount: number;
  joinedAt: number;
}

export interface GuestResponse {
  guestId: string;
  guestName: string;
  questionId: number;
  selectedOption: string;
  isCorrect: boolean;
  responseTimeMs: number; // Time elapsed between question trigger and click
  pointsEarned: number;
  timestamp: number;
}

export interface CoupleBio {
  brideName: string;
  groomName: string;
  howWeMet: string;
  funnyAnecdote: string;
  coupleBiographyText: string; // Combined custom input
}
