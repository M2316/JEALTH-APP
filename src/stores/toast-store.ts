import { create } from 'zustand';

export type ToastVariant = 'success' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  current: ToastItem | null;
  show: (opts: { message: string; variant: ToastVariant }) => void;
  hide: () => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  current: null,
  show: ({ message, variant }) =>
    set({ current: { id: nextId++, message, variant } }),
  hide: () => set({ current: null }),
}));
