'use client';

// apps/dashboard/src/hooks/useAdmin.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Unwrap helper ─────────────────────────────────────────────
//
// TransformInterceptor wraps every response as:
//   { success: true, data: <payload>, timestamp: "..." }
//
// Axios puts the HTTP body in .data, so the full chain is:
//   res.data       → { success, data: <payload>, timestamp }
//   res.data.data  → <payload>  ✅
//
// Controllers no longer add their own { success, data } envelope —
// the interceptor handles that exclusively.
//
function unwrap<T>(res: { data: { success: boolean; data: T; timestamp: string } }): T {
  return res.data.data;
}

// ── Platform stats ────────────────────────────────────────────
export interface AdminStats {
  totalPartners:      number;
  activePartners:     number;
  totalPayouts:       number;
  deliveredPayouts:   number;
  failedPayouts:      number;
  flaggedPayouts:     number;
  successRate:        number;
  totalVolumeNaira:   number;
  totalFeesCollected: number;
  flutterwaveBalance: { currency: string; available: number; ledger: number } | null;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn:  async () => unwrap(
      await api.get<{ success: boolean; data: AdminStats; timestamp: string }>('/v1/admin/stats'),
    ),
    staleTime:       60_000,
    refetchInterval: 120_000,
  });
}

// ── All partner balances + Flutterwave wallet ─────────────────
export interface AdminBalancePartner {
  id:               string;
  name:             string;
  email:            string;
  country:          string;
  status:           string;
  currency:         string;
  currencySymbol:   string;
  balancePence:     number;
  balanceFormatted: string;
  lastTopUp:        { createdAt: string; amountPence: number; description: string } | null;
}

export interface AdminBalances {
  partners:           AdminBalancePartner[];
  currencyTotals:     Array<{ currency: string; pence: number; formatted: string }>;
  flutterwaveBalance: { currency: string; available: number; ledger: number } | null;
}

export function useAdminBalances() {
  return useQuery({
    queryKey: ['admin', 'balances'],
    queryFn:  async () => unwrap(
      await api.get<{ success: boolean; data: AdminBalances; timestamp: string }>('/v1/admin/balances'),
    ),
    staleTime:       30_000,
    refetchInterval: 120_000,
  });
}

// ── Top up a partner balance ──────────────────────────────────
export function useTopUpPartnerBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ partnerId, amountPence, description }: {
      partnerId:   string;
      amountPence: number;
      description: string;
    }) => unwrap(
      await api.post<{ success: boolean; data: {
        creditedGbp:   string;
        newBalanceGbp: string;
      }; timestamp: string }>(
        `/v1/admin/partners/${partnerId}/balance/topup`,
        { amountPence, description },
      ),
    ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'balances'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// ── Balance ledger for a specific partner ─────────────────────
export interface LedgerEntry {
  id:              string;
  type:            'CREDIT' | 'DEBIT' | 'REFUND';
  amountGbp:       string;
  balanceAfterGbp: string;
  description:     string;
  payoutReference: string | null;
  createdAt:       string;
}

export interface PartnerLedger {
  entries:    LedgerEntry[];
  total:      number;
  totalPages: number;
}

export function usePartnerBalanceLedger(partnerId: string, page = 1) {
  return useQuery({
    queryKey: ['admin', 'balance-ledger', partnerId, page],
    enabled:  !!partnerId,
    queryFn:  async () => unwrap(
      await api.get<{ success: boolean; data: PartnerLedger; timestamp: string }>(
        `/v1/admin/partners/${partnerId}/balance/ledger?page=${page}&pageSize=20`,
      ),
    ),
    staleTime: 30_000,
  });
}

// ── Receiving account details ─────────────────────────────────
export interface ReceivingAccount {
  provider: string;
  gbp:      Record<string, string>;
  usd:      Record<string, string>;
  eur:      Record<string, string>;
  cad:      Record<string, string>;
}

export function useReceivingAccount() {
  return useQuery({
    queryKey: ['admin', 'receiving-account'],
    queryFn:  async () => unwrap(
      await api.get<{ success: boolean; data: ReceivingAccount | null; timestamp: string }>(
        '/v1/admin/receiving-account',
      ),
    ),
    staleTime: Infinity,
  });
}

// ── All partners ──────────────────────────────────────────────
export interface AdminPartner {
  id:               string;
  name:             string;
  email:            string;
  country:          string;
  status:           string;
  createdAt:        string;
  activeApiKeys:    number;
  totalPayouts:     number;
  activeWebhooks:   number;
  deliveredVolume:  number;
  deliveredCount:   number;
  currency:         string;
  currencySymbol:   string;
  balancePence:     number;
  balanceFormatted: string;
}

export function useAdminPartners() {
  return useQuery({
    queryKey: ['admin', 'partners'],
    queryFn:  async () => unwrap(
      await api.get<{ success: boolean; data: AdminPartner[]; timestamp: string }>('/v1/admin/partners'),
    ),
    staleTime: 30_000,
  });
}

// ── Suspend partner ───────────────────────────────────────────
export function useSuspendPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/v1/admin/partners/${id}/suspend`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
    },
  });
}

// ── Activate partner ──────────────────────────────────────────
export function useActivatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/v1/admin/partners/${id}/activate`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
    },
  });
}

// ── All transactions ──────────────────────────────────────────
export interface AdminTransaction {
  id:               string;
  partnerId:        string;
  partnerReference: string;
  sendAmount:       number;
  sendCurrency:     string;
  nairaAmount:      number;
  fee:              number;
  status:           string;
  createdAt:        string;
  deliveredAt:      string | null;
  failureReason:    string | null;
  partner:          { id: string; name: string; email: string; country: string };
  recipient:        { fullName: string; accountNumber: string; bankName: string } | null;
}

export interface AdminTransactionPage {
  data:       AdminTransaction[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export function useAdminTransactions(filters: {
  page?:      number;
  pageSize?:  number;
  status?:    string;
  partnerId?: string;
  startDate?: string;
  endDate?:   string;
} = {}) {
  return useQuery({
    queryKey: ['admin', 'transactions', filters],
    queryFn:  async () => {
      const params = new URLSearchParams();
      if (filters.page)      params.set('page',      String(filters.page));
      if (filters.pageSize)  params.set('pageSize',  String(filters.pageSize));
      if (filters.status)    params.set('status',    filters.status);
      if (filters.partnerId) params.set('partnerId', filters.partnerId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate)   params.set('endDate',   filters.endDate);
      return unwrap(
        await api.get<{ success: boolean; data: AdminTransactionPage; timestamp: string }>(
          `/v1/admin/transactions?${params.toString()}`,
        ),
      );
    },
    staleTime: 30_000,
  });
}

// ── Flagged payouts ───────────────────────────────────────────
export interface FlaggedPayout {
  id:               string;
  partnerId:        string;
  partnerReference: string;
  nairaAmount:      number;
  sendAmount:       number;
  sendCurrency:     string;
  failureReason:    string | null;
  createdAt:        string;
  partner:          { id: string; name: string; email: string };
  recipient:        { fullName: string; accountNumber: string; bankName: string } | null;
}

export function useFlaggedPayouts() {
  return useQuery({
    queryKey: ['admin', 'flagged'],
    queryFn:  async () => unwrap(
      await api.get<{ success: boolean; data: FlaggedPayout[]; timestamp: string }>('/v1/admin/flagged'),
    ),
    staleTime:       15_000,
    refetchInterval: 30_000,
  });
}

export function useReleasePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/v1/admin/flagged/${id}/release`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'flagged'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useRejectPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/v1/admin/flagged/${id}/reject`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'flagged'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// ── Admin inbox ───────────────────────────────────────────────
export interface InboxMessage {
  id:        string;
  type:      string;
  title:     string;
  body:      string;
  read:      boolean;
  metadata:  Record<string, unknown> | null;
  createdAt: string;
}

export interface InboxPage {
  messages:   InboxMessage[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export function useAdminInbox(page = 1) {
  return useQuery({
    queryKey: ['admin', 'inbox', page],
    queryFn:  async () => unwrap(
      await api.get<{ success: boolean; data: InboxPage; timestamp: string }>(
        `/v1/admin/inbox?page=${page}&pageSize=20`,
      ),
    ),
    staleTime:       30_000,
    refetchInterval: 60_000,
  });
}