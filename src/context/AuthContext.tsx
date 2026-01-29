import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || '',
  authDomain: "echo-med-database.firebaseapp.com",
  projectId: "echo-med-database",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: React.ReactNode) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        const result = await signInAnonymously(auth);
        setUser(result.user);
      } else {
        setUser(firebaseUser);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
