import { useAuthContext } from "@/providers/auth-provider";
import { useCallback } from "react";

export function useAuth() {
  const { user, isLoading, login, logout, refreshAuth } = useAuthContext();

  // Access token is an HttpOnly cookie — the browser sends it automatically.
  // authFetch is a thin wrapper that retries once after a silent token refresh
  // on a 401, matching the old behaviour without exposing the token to JS.
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const makeRequest = () =>
        fetch(url, {
          ...options,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

      let res = await makeRequest();

      if (res.status === 401) {
        const ok = await refreshAuth();
        if (ok) res = await makeRequest();
      }

      return res;
    },
    [refreshAuth]
  );

  return { user, isLoading, login, logout, authFetch };
}
