import { clsx, type ClassValue } from 'clsx';
import { twMerge }               from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

// ── Tailwind class merger ──────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Currency formatters ────────────────────────────────────
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style:    'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatGbp(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style:    'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style:    'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// ── Date formatters ────────────────────────────────────────
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'dd MMM yyyy, HH:mm');
}

export function formatDateShort(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'dd MMM yyyy');
}

export function timeAgo(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

// ── String helpers ─────────────────────────────────────────
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}

export function truncateId(id: string): string {
  if (id.length <= 16) return id;
  return `${id.substring(0, 8)}...${id.slice(-6)}`;
}

export function maskApiKey(key: string): string {
  if (key.length <= 12) return key;
  const prefix = key.substring(0, 12);
  const suffix = key.slice(-4);
  return `${prefix}${'•'.repeat(12)}${suffix}`;
}

// ── Number helpers ─────────────────────────────────────────
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-GB').format(n);
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

// ── Status colour mapping (Tailwind classes) ───────────────
export const STATUS_CLASSES: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  PROCESSING: 'bg-blue-100   text-blue-800   border-blue-200',
  DELIVERED:  'bg-green-100  text-green-800  border-green-200',
  FAILED:     'bg-red-100    text-red-800    border-red-200',
  FLAGGED:    'bg-orange-100 text-orange-800 border-orange-200',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING:    'Pending',
  PROCESSING: 'Processing',
  DELIVERED:  'Delivered',
  FAILED:     'Failed',
  FLAGGED:    'Under Review',
};

// ── Copy to clipboard ──────────────────────────────────────
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
