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
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshAuth = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success) {
        setUser(data.data.user);
        setAccessToken(data.data.accessToken);
        return data.data.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    refreshAuth().finally(() => setIsLoading(false));
  }, [refreshAuth]);

  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(() => {
      refreshAuth();
    }, 13 * 60 * 1000);
    return () => clearInterval(interval);
  }, [accessToken, refreshAuth]);

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      setUser(data.data.user);
      setAccessToken(data.data.accessToken);

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
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {},
      });
    } finally {
      setUser(null);
      setAccessToken(null);
      router.push("/login");
    }
  }, [accessToken, router]);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, logout, refreshAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
