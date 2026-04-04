// apps/dashboard/src/hooks/useNotifications.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
    queryFn:  async () => {
      const { data } = await api.get<{ success: boolean; data: NotificationsResponse }>(
        '/v1/notifications',
      );
      return data.data;
    },
    staleTime:       30_000,
    refetchInterval: 30_000, // poll every 30s for new notifications
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/v1/notifications/${id}/read`);
    },
    // Optimistic update — flip read=true immediately in the cache
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