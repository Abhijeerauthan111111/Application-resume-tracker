import React, { createContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";

import { auth, googleProvider } from "./firebaseClient";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = useMemo(() => {
    return {
      user,
      loading,
      async signIn() {
        await signInWithPopup(auth, googleProvider);
      },
      async signOut() {
        await signOut(auth);
      },
      async getIdToken() {
        if (!auth.currentUser) return null;
        return auth.currentUser.getIdToken();
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

