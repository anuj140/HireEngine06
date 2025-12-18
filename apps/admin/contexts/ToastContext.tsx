import React, { createContext, useState, useCallback, ReactNode, useEffect, useContext } from 'react';
import { CheckCircleIcon, InformationCircleIcon } from '../components/Icons';

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  addToast: (message: string, type?: ToastMessage['type']) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

const toastConfig = {
  success: {
    bg: 'bg-green-100',
    icon: <CheckCircleIcon className="w-6 h-6 mr-3 text-green-500" />,
    text: 'text-green-800'
  },
  error: {
    bg: 'bg-red-100',
    icon: <InformationCircleIcon className="w-6 h-6 mr-3 text-red-500" />,
    text: 'text-red-800'
  },
  info: {
    bg: 'bg-blue-100',
    icon: <InformationCircleIcon className="w-6 h-6 mr-3 text-blue-500" />,
    text: 'text-blue-800'
  },
  warning: {
    bg: 'bg-yellow-100',
    icon: <InformationCircleIcon className="w-6 h-6 mr-3 text-yellow-500" />,
    text: 'text-yellow-800'
  },
};

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [toast, onDismiss]);

  const config = toastConfig[toast.type];

  return (
    <div
      className={`flex items-center ${config.bg} ${config.text} p-3 rounded-lg shadow-lg animate-fade-in-up max-w-sm`}
      role="alert"
    >
      <div className="flex-shrink-0">{config.icon}</div>
      <p className="font-semibold text-sm">{toast.message}</p>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const id = toastId++;
    setToasts(currentToasts => [{ id, message, type }, ...currentToasts].slice(0, 5));
  }, []);
  
  const removeToast = useCallback((id: number) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[100] space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
