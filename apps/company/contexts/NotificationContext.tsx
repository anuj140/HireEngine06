import React, { createContext, useState, useCallback, useContext, ReactNode, useEffect, useMemo } from 'react';
import { useCompanyAuth } from '../hooks/useCompanyAuth';
import { Notification } from '../../../packages/types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useCompanyAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = useCallback(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const storedNotifications = sessionStorage.getItem(`notifications_${user.id}`);
      const parsed = storedNotifications ? (JSON.parse(storedNotifications) as Notification[]) : [];
      setNotifications(parsed);
    } catch (error) {
      console.error("Failed to load notifications from session storage", error);
      setNotifications([]);
    }
  }, [user]);

  // Initial load and on user change
  useEffect(() => {
    loadNotifications();
  }, [user, loadNotifications]);

  // Listen for external updates to notifications
  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (user && customEvent.detail?.userId === user.id) {
        loadNotifications();
      }
    };
    window.addEventListener('notifications_updated', handleUpdate);
    return () => {
      window.removeEventListener('notifications_updated', handleUpdate);
    };
  }, [user, loadNotifications]);

  // Persist notifications to storage when they change
  useEffect(() => {
    if (user) {
      try {
        sessionStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
      } catch (error) {
        console.error("Failed to save notifications to session storage", error);
      }
    }
  }, [notifications, user]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const value = { notifications, unreadCount, markAllAsRead };

  return (
    <NotificationContext.Provider value={user ? value : undefined}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType | undefined => {
  return useContext(NotificationContext);
};