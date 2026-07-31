import React, { createContext, useContext, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { User, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);

    // Dual Logout: Clear Microsoft MSAL session if active
    if (accounts && accounts.length > 0) {
      try {
        await instance.logoutPopup({
          account: accounts[0],
          mainWindowRedirectUri: window.location.origin,
        });
      } catch (err) {
        console.warn('MSAL popup logout failed or dismissed, performing local logout:', err);
      }
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const roleUpper = (user.role || '').toUpperCase();
    if (roleUpper === 'SUPER_ADMIN') return true;
    const perms = user.permissions || [];
    if (perms.includes('*')) return true;
    return perms.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading: false,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
