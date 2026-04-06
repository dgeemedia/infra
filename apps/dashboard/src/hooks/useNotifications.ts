'use client';

// apps/dashboard/src/hooks/useNotifications.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Same unwrap pattern as useAdmin.ts ────────────────────────
// TransformInterceptor wraps responses as { success, data, timestamp }.
// res.data.data is the actual payload.
function unwrap<T>(res: { data: { success: boolean; data: T; timestamp: string } }): T {
  return res.data.data;
}

interface Notification {
  id:        string;
  type:      string;
  title:     string;
  body:      string;
  read:      boolean;
  metadata:  Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount:   number;
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn:  async () => unwrap(
      await api.get<{ success: boolean; data: NotificationsResponse; timestamp: string }>(
        '/v1/notifications',
      ),
    ),
    staleTime:       60_000,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/v1/notifications/${id}/read`);
    },
    // Optimistic update — flip the notification to read immediately
    // so the UI doesn't wait for a refetch to clear the badge.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<NotificationsResponse>(['notifications']);
      queryClient.setQueryData<NotificationsResponse>(['notifications'], (old) => {
        if (!old) return old;
        return {
          notifications: old.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
          unreadCount: Math.max(0, old.unreadCount - 1),
        };
      });
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['notifications'], ctx.previous);
      }
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.patch('/v1/notifications/read-all');
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<NotificationsResponse>(['notifications']);
      queryClient.setQueryData<NotificationsResponse>(['notifications'], (old) => {
        if (!old) return old;
        return {
          notifications: old.notifications.map((n) => ({ ...n, read: true })),
          unreadCount:   0,
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['notifications'], ctx.previous);
      }
    },
  });
}