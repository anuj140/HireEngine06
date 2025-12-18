import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
// DO: Add comment above each fix.
// FIX: The authentication function is named `loginAdmin` in the API service, not `adminLogin`.
import { loginAdmin as apiLogin, getAdminProfile } from '../services/api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AdminUser | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const loadUserFromToken = useCallback(async () => {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
        try {
            // The /me endpoint in the new backend is /admin/dashboard/stats, which isn't ideal
            // but we use it to verify the token.
            const userProfile = await getAdminProfile(); 
            // The profile from token doesn't return full user, so we take what we can
            // and maybe store user object in sessionStorage on login
            const storedUser = sessionStorage.getItem('admin_user');
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            } else {
              // Fallback if user isn't in session, though this is less ideal
              setUser({ id: 'unknown', name: 'Admin', email: 'admin', role: 'Admin' });
            }
        } catch(e) {
            console.error("Admin token invalid", e);
            sessionStorage.removeItem('admin_token');
            sessionStorage.removeItem('admin_user');
            setUser(null);
        }
    }
    setIsAuthLoading(false);
  }, []);


  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  const login = async (email: string, password: string) => {
    const { token, user: loggedInUser } = await apiLogin({ email, password });
    sessionStorage.setItem('admin_token', token);
    sessionStorage.setItem('admin_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser as AdminUser);
  };

  const logout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    setUser(null);
  };

  const value = { user, isAuthLoading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};