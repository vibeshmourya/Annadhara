import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('foodbridge_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('foodbridge_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('foodbridge_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          setUser(res.data.data);
          localStorage.setItem('foodbridge_user', JSON.stringify(res.data.data));
        } catch (error) {
          console.warn('Session expired or invalid token', error);
          logout();
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
    const { token: newToken, user: newUser } = res.data.data;
    localStorage.setItem('foodbridge_token', newToken);
    localStorage.setItem('foodbridge_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('foodbridge_token');
    localStorage.removeItem('foodbridge_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('foodbridge_user', JSON.stringify(updatedUser));
  };

  const isDonor = user?.role === 'donor';
  const isRecipient = user?.role === 'recipient';
  const isVolunteer = user?.role === 'volunteer';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
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

