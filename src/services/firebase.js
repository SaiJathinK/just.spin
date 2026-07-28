import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

// Mobile browsers (Safari/Chrome on iOS, in-app browsers like Instagram/
// WhatsApp) routinely block or silently kill signInWithPopup, since it
// depends on window.open() surviving strict mobile popup rules. Redirect-based
// auth avoids that entirely by navigating the whole page instead.
function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export async function signInWithGoogle() {
  if (isMobile()) {
    // Navigates away — result comes back via getRedirectResult() /
    // onAuthStateChanged() after Google redirects back to the app.
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Call once on app load to pick up the result of a redirect-based sign-in
// (and surface any error, e.g. account-exists-with-different-credential).
export async function checkRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (err) {
    console.error("Redirect sign-in failed:", err);
    return null;
  }
}

export async function logOut() {
  await signOut(auth);
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}