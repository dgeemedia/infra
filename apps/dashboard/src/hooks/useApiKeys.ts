// apps/dashboard/src/hooks/useApiKeys.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiKey, ApiKeyCreated } from '@elorge/types';

export function useApiKeys(partnerId: string) {
  return useQuery({
    queryKey: ['api-keys', partnerId],
    enabled:  !!partnerId,   // don't fire until partnerId is hydrated
    queryFn:  async () => {
      const { data } = await api.get<{ success: boolean; data: { apiKeys: ApiKey[] } }>(
        `/v1/partners/${partnerId}`,
      );
      return (data.data.apiKeys ?? []) as ApiKey[];
    },
  });
}

export function useGenerateApiKey(partnerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { label: string; environment: 'live' | 'sandbox' }) => {
      const { data } = await api.post<{ success: boolean; data: ApiKeyCreated }>(
        `/v1/partners/${partnerId}/api-keys`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['api-keys', partnerId] });
    },
  });
}

export function useRevokeApiKey(partnerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (keyId: string) => {
      await api.patch(`/v1/partners/${partnerId}/api-keys/${keyId}/revoke`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['api-keys', partnerId] });
    },
  });
}