import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setSession: (params: { access: string; refresh: string; user: User }) => void;
  setAccessToken: (token: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

/**
 * Single source of truth for auth state, persisted to localStorage so a page
 * refresh doesn't bounce the user to /login. Tokens live here (not in the
 * API client module) so React components can reactively read `isAuthenticated`
 * and `user.role` for role-gated UI without prop drilling.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setSession: ({ access, refresh, user }) =>
        set({ accessToken: access, refreshToken: refresh, user, isAuthenticated: true }),
      setAccessToken: (token) => set({ accessToken: token }),
      updateUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    { name: "bizops-auth" }
  )
);
