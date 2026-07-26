import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your sandbox project's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCT7sn3_tPmjfWCvj9X8HaRfLN-JJ4ZQBo",
  authDomain: "productionv2.firebaseapp.com",
  projectId: "productionv2",
  storageBucket: "productionv2.firebasestorage.app",
  messagingSenderId: "128103165981",
  appId: "1:128103165981:web:7b043753e9cd066da056f4",
  measurementId: "G-CYGJ0QC176",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logOut() {
  await signOut(auth);
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}