import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Librarian } from '../types';

interface AuthContextType {
  token: string | null;
  user: Librarian | null;
  isAuthenticated: boolean;
  login: (token: string, user: Librarian) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('shelflife_token')
  );
  const [user, setUser] = useState<Librarian | null>(() => {
    const savedUser = localStorage.getItem('shelflife_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('shelflife_token', token);
    } else {
      localStorage.removeItem('shelflife_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('shelflife_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('shelflife_user');
    }
  }, [user]);

  const login = (newToken: string, newUser: Librarian) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('shelflife_token');
    localStorage.removeItem('shelflife_user');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
