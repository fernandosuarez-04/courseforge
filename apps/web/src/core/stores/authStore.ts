'use client';
import { create } from 'zustand';

interface AuthStore {
  user: any | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (credentials) => {
    console.log('Login', credentials);
    set({ user: { name: 'User' }, isAuthenticated: true });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
