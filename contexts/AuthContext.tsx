
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  role: Role | null;
  loading: boolean;
  login: (pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedRole = localStorage.getItem('oui-oui-tacos-role');
      if (savedRole) {
        setRole(JSON.parse(savedRole));
      }
    } catch (error) {
      console.error("Failed to parse saved role:", error);
      localStorage.removeItem('oui-oui-tacos-role');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (pin: string) => {
    setLoading(true);
    try {
      const userRole = await api.loginWithPin(pin);
      if (userRole) {
        setRole(userRole);
        localStorage.setItem('oui-oui-tacos-role', JSON.stringify(userRole));
      } else {
        throw new Error("PIN invalide");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    localStorage.removeItem('oui-oui-tacos-role');
  }, []);

  return (
    <AuthContext.Provider value={{ role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
