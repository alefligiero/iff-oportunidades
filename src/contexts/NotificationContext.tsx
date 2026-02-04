'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Notification, NotificationContextType, NotificationType } from '@/types/notification';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (type: NotificationType, message: string, duration: number = 5000) => {
    const id = `${Date.now()}-${Math.random()}`;
    const notification: Notification = { id, type, message, duration };

    setNotifications((prev) => [...prev, notification]);

    // Auto-remove após duração
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
}
