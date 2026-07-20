import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { auth, googleProvider, ALLOWED_DOMAIN } from "./firebase";

interface AuthCtx { user: User | null; loading: boolean; error: string; login: () => void; logout: () => void; }
const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, (u) => {
    if (u && !(u.email || "").endsWith("@" + ALLOWED_DOMAIN)) {
      setError("Acesso restrito a contas @" + ALLOWED_DOMAIN + ".");
      signOut(auth); setUser(null);
    } else { setUser(u); if (u) setError(""); }
    setLoading(false);
  }), []);

  const login = async () => {
    setError("");
    try { await signInWithPopup(auth, googleProvider); }
    catch (e: any) { setError(e?.message || "Falha no login."); }
  };
  const logout = () => signOut(auth);

  return <Ctx.Provider value={{ user, loading, error, login, logout }}>{children}</Ctx.Provider>;
}
