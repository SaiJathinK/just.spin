import { createContext, useContext, useEffect, useState } from "react";
import { subscribeToAuthChanges, signInWithGoogle, logOut, checkRedirectResult } from "../services/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Picks up the result of a mobile signInWithRedirect flow, if the user
    // is returning from Google's sign-in page. onAuthStateChanged below
    // will also fire once this resolves, but calling this explicitly lets
    // us catch/log redirect-specific errors.
    checkRedirectResult();

    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google sign-in failed:", err);
    }
  };

  const logout = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}