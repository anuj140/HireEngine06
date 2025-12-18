import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useCompanyAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useCompanyAuth must be used within an AuthProvider');
  }
  return context;
};