"use client";

import React, { createContext, useEffect, useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, onAuthStateChanged, User, browserPopupRedirectResolver } from "firebase/auth";
import { auth } from "../firebase/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupAuth = async () => {
      try {
        unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            setUser(user);
            setLoading(false);
          },
          (error) => {
            console.error("Auth state change error:", error);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Auth setup error:", error);
        setLoading(false);
      }
    };

    setupAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      // Use the browserPopupRedirectResolver explicitly to avoid promise issues
      await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      // No need to return the credential, just let the auth state change handle it
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error; // Propagate the error for handling in UI components
    }
  };

  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error; // Propagate the error for handling in UI components
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
