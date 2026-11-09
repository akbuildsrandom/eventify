import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: ({ type = 'info', title, message, duration = 4000 }) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, title, message }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const toast = {
  success: (title, message) => useToastStore.getState().addToast({ type: 'success', title, message }),
  error: (title, message) => useToastStore.getState().addToast({ type: 'error', title, message }),
  info: (title, message) => useToastStore.getState().addToast({ type: 'info', title, message }),
};
