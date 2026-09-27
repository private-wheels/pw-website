"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@/lib/types";
import * as authStore from "@/lib/store/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

interface AuthContextValue {
  /** The signed-in user, or null. Always null while `loading`. */
  user: User | null;
  /** True until the stored session has been checked on first load. */
  loading: boolean;
  login: typeof authStore.login;
  register: typeof authStore.register;
  logout: () => Promise<void>;
  /** Saves name/phone to the profile and updates `user` in place. */
  updateProfile: (updates: { name?: string; phone?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<{ id: string; email: string } | null>(null);
  const [sessionChecked, setSessionChecked] = useState(!isSupabaseConfigured);
  const [user, setUser] = useState<User | null>(null);

  // Track who's signed in. onAuthStateChange fires INITIAL_SESSION on mount,
  // then on every sign-in, sign-out and token refresh (including other tabs).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const {
      data: { subscription },
    } = getSupabaseBrowserClient().auth.onAuthStateChange((_event, session) => {
      const next = session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null;
      setAccount((prev) => (prev?.id === next?.id && prev?.email === next?.email ? prev : next));
      setSessionChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load the profile outside the auth callback (Supabase warns against
  // awaiting other calls inside it).
  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    authStore.loadUser(account.id, account.email).then((loaded) => {
      if (!cancelled) setUser(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [account]);

  const logout = useCallback(async () => {
    await authStore.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: { name?: string; phone?: string }) => {
      if (!user) return;
      await authStore.updateProfile(user.id, updates);
      setUser((u) =>
        u
          ? {
              ...u,
              ...(updates.name !== undefined ? { name: updates.name.trim() || u.name } : {}),
              ...(updates.phone !== undefined ? { phone: updates.phone.trim() } : {}),
            }
          : u,
      );
    },
    [user],
  );

  const currentUser = account && user?.id === account.id ? user : null;
  const loading = !sessionChecked || (account !== null && currentUser === null);

  const value: AuthContextValue = {
    user: currentUser,
    loading,
    login: authStore.login,
    register: authStore.register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
