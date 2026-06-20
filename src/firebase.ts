/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Explicitly retrieve credentials from our provisioned config
import config from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

// Initialize App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the exact databaseId provisioned by AI Studio
export const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

console.log('Firebase services initialized successfully with Firestore database:', config.firestoreDatabaseId);
