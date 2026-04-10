// apps/dashboard/src/store/dashboard.store.ts
import { create } from 'zustand';

interface DateRange {
  startDate: string;
  endDate:   string;
}

interface Toast {
  id:       string;
  title:    string;
  message?: string;
  type:     'success' | 'error' | 'info' | 'warning';
}

interface DashboardStore {
  dateRange:    DateRange;
  setDateRange: (range: DateRange) => void;

  statusFilter:    string;
  setStatusFilter: (status: string) => void;

  searchQuery:    string;
  setSearchQuery: (query: string) => void;

  sidebarOpen:    boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar:  () => void;

  toasts:      Toast[];
  addToast:    (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  resetFilters: () => void;
}

const getDefaultDateRange = (): DateRange => {
  const end   = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().split('T')[0] ?? '',
    endDate:   end.toISOString().split('T')[0]   ?? '',
  };
};

// Start sidebar open on desktop (≥1024px), closed on mobile
const getDefaultSidebarOpen = (): boolean => {
  if (typeof window === 'undefined') return true; // SSR default
  return window.innerWidth >= 1024;
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  dateRange:    getDefaultDateRange(),
  setDateRange: (range) => set({ dateRange: range }),

  statusFilter:    '',
  setStatusFilter: (status) => set({ statusFilter: status }),

  searchQuery:    '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  sidebarOpen:    getDefaultSidebarOpen(),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar:  () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  toasts:   [],
  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { ...toast, id: `toast_${Date.now()}` },
      ].slice(-5),
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  resetFilters: () =>
    set({
      statusFilter: '',
      searchQuery:  '',
      dateRange:    getDefaultDateRange(),
    }),
}));