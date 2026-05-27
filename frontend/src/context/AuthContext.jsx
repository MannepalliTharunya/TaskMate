/**
 * AuthContext — global authentication state for the TaskAI frontend.
 *
 * Provides:
 *   user          — current user object (null if not logged in)
 *   loading       — true while the initial session check is in progress
 *   loginSuccess  — call after a successful login API response
 *   logout        — clears tokens and user state
 *   isAdmin       — boolean shortcut for role === 'admin'
 *   isUser        — boolean shortcut for role === 'user'
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  /** On mount, restore session from stored access token. */
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await getMe();
      setUser(data);
    } catch {
      // Token invalid or expired — clear storage silently
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  /**
   * Store tokens and set user state after a successful login or register.
   * @param {{ access: string, refresh: string, user: object }} data
   */
  const loginSuccess = (data) => {
    localStorage.setItem('access_token',  data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setUser(data.user);
  };

  /** Clear tokens and user state, effectively logging out. */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const isAdmin = user?.role?.name === 'admin';
  const isUser  = user?.role?.name === 'user';

  return (
    <AuthContext.Provider value={{ user, loading, loginSuccess, logout, isAdmin, isUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context.
 * Must be used inside <AuthProvider>.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
