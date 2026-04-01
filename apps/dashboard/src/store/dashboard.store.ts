// apps/dashboard/src/store/dashboard.store.ts
import { create } from 'zustand';

interface DateRange {
  startDate: string;
  endDate:   string;
}

interface DashboardStore {
  // Date range filter — shared across pages
  dateRange:    DateRange;
  setDateRange: (range: DateRange) => void;

  // Active status filter for transaction table
  statusFilter:    string;
  setStatusFilter: (status: string) => void;

  // Search query
  searchQuery:    string;
  setSearchQuery: (query: string) => void;

  // Sidebar collapsed state
  sidebarOpen:    boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar:  () => void;

  // Toast notifications
  toasts: Toast[];
  addToast:    (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Reset all filters
  resetFilters: () => void;
}

interface Toast {
  id:       string;
  title:    string;
  message?: string;
  type:     'success' | 'error' | 'info' | 'warning';
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

export const useDashboardStore = create<DashboardStore>((set) => ({
  dateRange:    getDefaultDateRange(),
  setDateRange: (range) => set({ dateRange: range }),

  statusFilter:    '',
  setStatusFilter: (status) => set({ statusFilter: status }),

  searchQuery:    '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  sidebarOpen:    true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar:  () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  toasts:      [],
  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { ...toast, id: `toast_${Date.now()}` },
      ].slice(-5), // max 5 toasts
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
