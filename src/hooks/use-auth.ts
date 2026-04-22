"use client";

import { useAuthContext } from "@/providers/auth-provider";
import { useCallback } from "react";

export function useAuth() {
  const { user, accessToken, isLoading, login, logout, refreshAuth } =
    useAuthContext();

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      let token = accessToken;

      const makeRequest = (t: string | null) =>
        fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
            ...(t ? { Authorization: `Bearer ${t}` } : {}),
          },
        });

      let res = await makeRequest(token);

      if (res.status === 401) {
        token = await refreshAuth();
        if (token) {
          res = await makeRequest(token);
        }
      }

      return res;
    },
    [accessToken, refreshAuth]
  );

  return { user, isLoading, login, logout, authFetch };
}
