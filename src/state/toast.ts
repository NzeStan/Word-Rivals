import { create } from 'zustand';

export type Toast = { id: number; message: string; tone: 'info' | 'success' | 'danger' };

let nextId = 1;

export const useToasts = create<{
  toasts: Toast[];
  show: (message: string, tone?: Toast['tone']) => void;
  dismiss: (id: number) => void;
}>((set, get) => ({
  toasts: [],
  show: (message, tone = 'info') => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, tone }] }));
    setTimeout(() => get().dismiss(id), 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (message: string, tone?: Toast['tone']) => useToasts.getState().show(message, tone);
