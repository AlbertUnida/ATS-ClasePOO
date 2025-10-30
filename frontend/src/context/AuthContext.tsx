import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, login as apiLogin, LoginPayload } from '../api/backend';

interface AuthUser {
  id: string;
  email: string;
  tenant: string;
  roles: string[];
  isSuperAdmin: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  initializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'ats_access_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!token) {
        setInitializing(false);
        return;
      }

      try {
        const current = await fetchCurrentUser();
        if (!cancelled) {
          setUser({
            id: current.id,
            email: current.email,
            tenant: current.tenant,
            roles: current.roles,
            isSuperAdmin: current.isSuperAdmin,
          });
        }
      } catch (error) {
        console.warn('No se pudo recuperar la sesión, se limpiará el token.', error);
        if (!cancelled) {
          setToken(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await apiLogin(payload);
    localStorage.setItem(STORAGE_KEY, response.access_token);
    setToken(response.access_token);

    const current = await fetchCurrentUser();
    setUser({
      id: current.id,
      email: current.email,
      tenant: current.tenant,
      roles: current.roles,
      isSuperAdmin: current.isSuperAdmin,
    });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      login,
      logout,
    }),
    [user, token, initializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
