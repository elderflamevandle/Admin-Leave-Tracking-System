"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/types";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Access token lives in an HttpOnly cookie — not accessible to JS.
  // We only track user metadata in state.
  // `localStorage.session` is a non-sensitive hint that a session cookie may
  // exist. It lets us skip the /api/auth/refresh round-trip (and the resulting
  // 401 console noise) for users who are not logged in.
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        localStorage.removeItem("session");
        return false;
      }
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("session", "1");
        setUser(data.data.user);
        return true;
      }
      localStorage.removeItem("session");
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    // Only attempt refresh when there's a hint a session cookie may exist.
    if (localStorage.getItem("session")) {
      refreshAuth().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshAuth]);

  // Silent re-auth every 13 minutes to keep the 15-minute access token alive
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshAuth();
    }, 13 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, refreshAuth]);

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      localStorage.setItem("session", "1");
      setUser(data.data.user);

      if (data.data.user.forcePasswordChange) {
        router.push("/change-password");
      } else {
        router.push("/dashboard");
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      localStorage.removeItem("session");
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used within AuthProvider");
  return context;
}
