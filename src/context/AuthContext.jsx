import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('foodbridge_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('foodbridge_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('foodbridge_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.data.success && res.data.data) {
            setUser(res.data.data);
            localStorage.setItem('foodbridge_user', JSON.stringify(res.data.data));
          }
        } catch (error) {
          console.warn('[Auth] Session validation failed or token expired:', error?.message);
          // Only clear if 401 Unauthorized
          if (error.response?.status === 401) {
            localStorage.removeItem('foodbridge_token');
            localStorage.removeItem('foodbridge_user');
            setToken(null);
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token: newToken, user: newUser } = res.data.data;
    localStorage.setItem('foodbridge_token', newToken);
    localStorage.setItem('foodbridge_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (!res.data?.success || !res.data?.data?.token || !res.data?.data?.user) {
      throw new Error(res.data?.message || 'Unexpected response from registration server.');
    }
    const { token: newToken, user: newUser } = res.data.data;
    localStorage.setItem('foodbridge_token', newToken);
    localStorage.setItem('foodbridge_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (err) {
      console.warn('[Auth] Server logout notification:', err?.message);
    } finally {
      localStorage.removeItem('foodbridge_token');
      localStorage.removeItem('foodbridge_user');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('foodbridge_user', JSON.stringify(updatedUser));
  };

  const roleNormalized = (user?.role || '').toLowerCase();
  const isDonor = roleNormalized === 'donor';
  const isRecipient = roleNormalized === 'recipient';
  const isVolunteer = roleNormalized === 'volunteer';
  const isAdmin = roleNormalized === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        role: roleNormalized,
        isDonor,
        isRecipient,
        isVolunteer,
        isAdmin,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
