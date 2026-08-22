import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, socket } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = await api.get('/auth/me');
        setUser(userData);
        socket.auth = { token };
        socket.connect();
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
        socket.disconnect();
      }
    } else {
      setUser(null);
    }
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  useEffect(() => {
    checkUserAuth();
  }, []);

  const signUp = async (email, password, additionalData) => {
    const response = await api.post('/auth/signup', { email, password, ...additionalData });
    localStorage.setItem('token', response.token);
    setUser(response.user);
    socket.auth = { token: response.token };
    socket.connect();
    return response;
  };

  const signIn = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.token);
    setUser(response.user);
    socket.auth = { token: response.token };
    socket.connect();
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    socket.disconnect();
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const userData = await api.get('/auth/me');
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      signUp,
      signIn,
      refreshUser,
    }}>
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
