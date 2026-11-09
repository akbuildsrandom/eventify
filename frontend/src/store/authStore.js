import { create } from 'zustand';
import { authService } from '../services/authService.js';
import { toast } from './toastStore.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    try {
      const res = await authService.getMe();
      if (res?.data?.user) {
        set({ user: res.data.user, isAuthenticated: true, isLoading: false });
        return res.data.user;
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
    return null;
  },

  login: async (credentials) => {
    try {
      const res = await authService.login(credentials);
      if (res?.data?.user) {
        set({ user: res.data.user, isAuthenticated: true });
        toast.success('Welcome back!', `Signed in as ${res.data.user.name}`);
        return res.data.user;
      }
    } catch (err) {
      toast.error('Login Failed', err.message || 'Invalid credentials');
      throw err;
    }
  },

  register: async (data) => {
    try {
      const res = await authService.register(data);
      toast.success('Account Created', 'Registration successful! You may now sign in.');
      return res.data;
    } catch (err) {
      toast.error('Registration Failed', err.message || 'Could not register');
      throw err;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      set({ user: null, isAuthenticated: false });
      toast.info('Logged Out', 'You have been signed out.');
    }
  },

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
}));
