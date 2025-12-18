import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';

export const useToast = (): { addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void; } => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
