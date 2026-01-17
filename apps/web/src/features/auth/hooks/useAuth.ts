'use client';
import { useAuthStore } from '@/core/stores/authStore';

export const useAuth = () => {
  const { user, login, logout } = useAuthStore();
  return { user, login, logout };
};
