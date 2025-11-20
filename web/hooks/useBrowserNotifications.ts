// hooks/useBrowserNotifications.ts
import { useEffect } from 'react';

export function useBrowserNotifications() {
  useEffect(() => {
    // Demander permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icon-512.png',
        badge: '/badge-72.png',
        requireInteraction: true, // Ne disparaît pas automatiquement
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    }
  };

  return { sendBrowserNotification };
}
