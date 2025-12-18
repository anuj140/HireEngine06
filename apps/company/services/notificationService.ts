import { Notification } from '../../../packages/types';

type NotificationData = {
  message: string;
  link: string;
  type: Notification['type'];
  id?: string;
};

export const addNotification = (userId: string, notificationData: NotificationData) => {
  try {
    const storageKey = `notifications_${userId}`;
    const storedNotificationsRaw = sessionStorage.getItem(storageKey);
    let storedNotifications: Notification[] = storedNotificationsRaw ? JSON.parse(storedNotificationsRaw) : [];

    // Prevent duplicate notifications if a predictable ID is provided
    if (notificationData.id && storedNotifications.some(n => n.id === notificationData.id)) {
      return; // Notification already exists, do nothing.
    }

    const newNotification: Notification = {
      id: notificationData.id || `notif_${Date.now()}`,
      message: notificationData.message,
      link: notificationData.link,
      type: notificationData.type,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    // Add new notification and keep the list to a max of 10
    const updatedNotifications = [newNotification, ...storedNotifications].slice(0, 10);
    sessionStorage.setItem(storageKey, JSON.stringify(updatedNotifications));

    // Dispatch a custom event to notify the context to reload its state
    window.dispatchEvent(new CustomEvent('notifications_updated', { detail: { userId } }));

  } catch (error) {
    console.error(`Could not create notification for user ${userId}:`, error);
  }
};