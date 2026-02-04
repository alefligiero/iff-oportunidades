'use client';

import { useNotification } from '@/contexts/NotificationContext';
import { useEffect } from 'react';

export function ToastContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

interface ToastProps {
  notification: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  };
  onClose: () => void;
}

function Toast({ notification, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColorMap = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const textColorMap = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ⓘ',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${bgColorMap[notification.type]} animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <span className={`text-lg font-bold ${textColorMap[notification.type]}`}>
        {iconMap[notification.type]}
      </span>
      <div className="flex-1">
        <p className={`text-sm font-medium ${textColorMap[notification.type]}`}>
          {notification.message}
        </p>
      </div>
      <button
        onClick={onClose}
        className={`text-lg font-bold ${textColorMap[notification.type]} hover:opacity-70 transition-opacity`}
      >
        ✕
      </button>
    </div>
  );
}
