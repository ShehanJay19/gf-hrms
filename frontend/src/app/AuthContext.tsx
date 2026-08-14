import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  clearStoredAuth,
  getAccessToken,
  getStoredAuthUser,
  storeAuthSession,
  type AuthUser,
} from '../lib/auth-session';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (tokens: { accessToken: string; refreshToken?: string }, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => (getAccessToken() ? getStoredAuthUser() : null));

  const login = useCallback((tokens: { accessToken: string; refreshToken?: string }, nextUser: AuthUser) => {
    storeAuthSession(tokens, nextUser);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: Boolean(user), login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
