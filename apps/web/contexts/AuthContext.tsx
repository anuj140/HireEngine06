import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserProfile } from '../../../packages/types';
import { getProfileFromToken, loginUser, updateUserProfile as apiUpdateUserProfile, registerUser as apiRegisterUser, uploadResume as apiUploadResume, uploadProfilePhoto as apiUploadProfilePhoto, deleteResumeApi as apiDeleteResume } from '../../../packages/api-client';

interface AuthContextType {
  user: User | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string) => Promise<{ user: User, token: string }>;
  loginAfterRegister: (user: User, token: string) => Promise<void>;
  uploadResume: (file: File) => Promise<void>;
  uploadProfilePhoto: (file: File) => Promise<void>;
  deleteResume: () => Promise<void>;
  loginMethod: 'email' | 'google' | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [loginMethod, setLoginMethod] = useState<'email' | 'google' | null>(null);

  const fetchAndSetUser = useCallback(async () => {
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        const response = await getProfileFromToken();
        const userData = response.user;
        setUser(userData);
        setLoginMethod('email'); 
      } catch (error) {
        console.error("Failed to fetch user from token", error);
        sessionStorage.removeItem('token');
        setUser(null);
        setLoginMethod(null);
      }
    }
  }, []);

  useEffect(() => {
    setIsAuthLoading(true);
    fetchAndSetUser().finally(() => setIsAuthLoading(false));
  }, [fetchAndSetUser]);

  const login = async (email: string, password: string) => {
    const response = await loginUser({ email, password });
    sessionStorage.setItem('token', response.token);
    setUser(response.user);
    setLoginMethod('email');
  };

  const register = async (name: string, email: string, password: string, phone: string) => {
    const response = await apiRegisterUser(name, email, password, phone);
    return { user: response.user, token: response.token };
  };

  const loginAfterRegister = async (user: User, token: string) => {
    sessionStorage.setItem('token', token);
    setUser(user);
    setLoginMethod('email');
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
    setLoginMethod(null);
  };

  const updateUserProfile = useCallback(async (updates: Partial<User>) => {
    try {
        const updatedUser = await apiUpdateUserProfile(updates);
        setUser(updatedUser);
    } catch (error) {
        console.error("Failed to update user profile:", error);
        throw error; // Re-throw to be caught in the component
    }
  }, []);
  
  const uploadResume = async (file: File) => {
    if (!user) throw new Error("Not authenticated");
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const { resumeUrl } = await apiUploadResume(formData);
      // Now call updateUserProfile to sync the URL and have the backend recalculate completion
      await updateUserProfile({ profile: { ...user.profile, resumeUrl } });
    } catch (error) {
      console.error("Failed to upload resume:", error);
      throw error;
    }
  };

  const uploadProfilePhoto = async (file: File) => {
    if (!user) throw new Error("Not authenticated");
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const { profilePhoto } = await apiUploadProfilePhoto(formData);
      setUser(prevUser => prevUser ? { ...prevUser, profilePhoto } : null);
    } catch (error) {
      console.error("Failed to upload profile photo:", error);
      throw error;
    }
  };

  const deleteResume = async () => {
    if (!user) throw new Error("Not authenticated");
    try {
      await apiDeleteResume();
      await updateUserProfile({ profile: { ...user.profile, resumeUrl: '' } });
    } catch (error) {
      console.error("Failed to delete resume:", error);
      throw error;
    }
  };

  const value = { user, isAuthLoading, login, logout, updateUserProfile, register, loginAfterRegister, uploadResume, uploadProfilePhoto, deleteResume, loginMethod };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};