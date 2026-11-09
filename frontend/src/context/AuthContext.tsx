import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { api } from '../services/api';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('powerguard_token'),
    isAuthenticated: !!localStorage.getItem('powerguard_token'),
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const hydrateUser = async () => {
      const token = localStorage.getItem('powerguard_token');
      if (token) {
        try {
          const profile = await api.getMe();
          setAuthState({
            user: profile,
            token,
            isAuthenticated: true,
          });
        } catch (err) {
          // Token expired or invalid
          localStorage.removeItem('powerguard_token');
          setAuthState({ user: null, token: null, isAuthenticated: false });
        }
      }
      setIsLoading(false);
    };
    hydrateUser();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(username, password);
      localStorage.setItem('powerguard_token', res.access_token);
      setAuthState({
        user: {
          id: 1,
          username: res.username,
          email: `${res.username}@powerguard.edu`,
          role: res.role,
          assigned_room_id: res.assigned_room_id,
        },
        token: res.access_token,
        isAuthenticated: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('powerguard_token');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, isLoading }}>
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
