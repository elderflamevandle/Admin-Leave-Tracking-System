"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export function useNotifications() {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await authFetch("/api/notifications");
      const json = await res.json();
      return json.data as { notifications: Notification[]; unreadCount: number } ?? { notifications: [] as Notification[], unreadCount: 0 };
    },
    refetchInterval: 30000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await authFetch("/api/notifications/mark-read", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    markAllRead: markAllRead.mutate,
  };
}
