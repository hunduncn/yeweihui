'use client';

import { createContext, useContext } from 'react';

export interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'member';
}

const AuthContext = createContext<AuthUser | null>(null);

export function AuthProvider({ user, children }: { user: AuthUser | null; children: React.ReactNode }) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthUser | null {
  return useContext(AuthContext);
}

export function useIsAdmin(): boolean {
  return useContext(AuthContext)?.role === 'admin';
}
