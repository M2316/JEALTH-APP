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
  hide: (id?: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  current: null,
  show: ({ message, variant }) =>
    set({ current: { id: nextId++, message, variant } }),
  hide: (id) =>
    set((state) =>
      id === undefined || state.current?.id === id ? { current: null } : state,
    ),
}));
