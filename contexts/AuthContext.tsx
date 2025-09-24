
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  role: Role | null;
  loading: boolean;
  login: (pin: string) => Promise<void>;
  logout: () => void;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoleFromStorage = async () => {
      try {
        const savedRole = localStorage.getItem('oui-oui-tacos-role');
        if (!savedRole) {
          return;
        }

        const parsedRole: Role = JSON.parse(savedRole);
        if (!parsedRole?.id) {
          setRole(parsedRole);
          return;
        }

        const freshRole = await api.getRoleById(parsedRole.id);
        if (freshRole) {
          setRole(freshRole);
          localStorage.setItem('oui-oui-tacos-role', JSON.stringify(freshRole));
        } else {
          localStorage.removeItem('oui-oui-tacos-role');
          setRole(null);
        }
      } catch (error) {
        console.error("Failed to restore role:", error);
        localStorage.removeItem('oui-oui-tacos-role');
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    loadRoleFromStorage();
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

  const refreshRole = useCallback(async () => {
    if (!role?.id) {
      return;
    }

    try {
      const updatedRole = await api.getRoleById(role.id);
      if (updatedRole) {
        setRole(updatedRole);
        localStorage.setItem('oui-oui-tacos-role', JSON.stringify(updatedRole));
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to refresh role:', error);
    }
  }, [logout, role?.id]);

  return (
    <AuthContext.Provider value={{ role, loading, login, logout, refreshRole }}>
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
