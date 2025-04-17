// src/firebase.js
// Configura aquí tu conexión a Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Reemplaza estos valores con los de tu proyecto de Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyDpolvAQ2zLRKyjNfpvgv9q1tGmHtpp_pY',
  authDomain: 'your-portfolio-1b962.firebaseapp.com',
  projectId: 'your-portfolio-1b962',
  storageBucket: 'your-portfolio-1b962.firebasestorage.app',
  messagingSenderId: '803000208121',
  appId: '1:803000208121:web:beb5659bbbab20f1ab3028',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);