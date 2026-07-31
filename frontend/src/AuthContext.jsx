import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearCsrf } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (payload) => {
    const data = await api('/auth/login', { method: 'POST', body: payload });
    clearCsrf();
    if (data.user) setUser(data.user);
    return data;
  };

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' });
    clearCsrf();
    setUser(null);
  };

  const register = async (payload) =>
    api('/auth/register', { method: 'POST', body: payload });

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, register, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
