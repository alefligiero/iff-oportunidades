'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PendingTask {
  id: string;
  title: string;
  description: string;
  href: string;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export default function PendingTasksMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'notifications'>('tasks');
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    setTasksError(null);

    try {
      const response = await fetch('/api/pending-tasks', {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel carregar as pendencias');
      }

      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (err) {
      setTasksError(err instanceof Error ? err.message : 'Erro ao carregar pendencias');
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    setNotificationsError(null);

    try {
      const response = await fetch('/api/notifications?limit=30', {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel carregar as notificacoes');
      }

      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount) || 0);
    } catch (err) {
      setNotificationsError(
        err instanceof Error ? err.message : 'Erro ao carregar notificacoes'
      );
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationsRead = async (ids?: string[], markAll?: boolean) => {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, markAll }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erro ao marcar notificacoes');
    }
  };

  const clearNotifications = async () => {
    const response = await fetch('/api/notifications', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erro ao limpar notificacoes');
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!isOpen) return;
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const totalTasks = tasks.length;
  const totalIndicator = totalTasks + unreadCount;

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.readAt) {
      try {
        await markNotificationsRead([notification.id]);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? { ...item, readAt: new Date().toISOString() }
              : item
          )
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      } catch (err) {
        setNotificationsError(
          err instanceof Error ? err.message : 'Erro ao marcar notificacao'
        );
      }
    }

    setIsOpen(false);
    if (notification.href) {
      router.push(notification.href);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead(undefined, true);
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      setNotificationsError(
        err instanceof Error ? err.message : 'Erro ao marcar notificacoes'
      );
    }
  };

  const handleClearNotifications = async () => {
    try {
      await clearNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      setNotificationsError(
        err instanceof Error ? err.message : 'Erro ao limpar notificacoes'
      );
    }
  };

  const formatDateTime = (value: string) => {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 transition"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Ver pendencias"
      >
        <svg
          className="h-5 w-5 text-gray-700"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {totalIndicator > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-semibold rounded-full px-1.5 py-0.5">
            {totalIndicator > 9 ? '9+' : totalIndicator}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 pt-3 pb-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Central</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                  activeTab === 'tasks'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Pendencias {totalTasks > 0 ? `(${totalTasks})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                  activeTab === 'notifications'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Notificacoes {unreadCount > 0 ? `(${unreadCount})` : ''}
              </button>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {activeTab === 'tasks' && (
              <>
                {loadingTasks && (
                  <div className="px-4 py-6 text-sm text-gray-500">Carregando...</div>
                )}

                {!loadingTasks && tasksError && (
                  <div className="px-4 py-6 text-sm text-red-600">{tasksError}</div>
                )}

                {!loadingTasks && !tasksError && tasks.length === 0 && (
                  <div className="px-4 py-6 text-sm text-gray-500">
                    Tudo certo por aqui. Sem pendencias no momento.
                  </div>
                )}

                {!loadingTasks && !tasksError && tasks.length > 0 && (
                  <ul className="divide-y divide-gray-100">
                    {tasks.map((task) => (
                      <li key={task.id}>
                        <Link
                          href={task.href}
                          className="block px-4 py-3 hover:bg-gray-50 transition"
                          onClick={() => setIsOpen(false)}
                        >
                          <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-600">
                  <span>{notifications.length} notificacao(oes)</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="hover:text-gray-800"
                      disabled={notifications.length === 0}
                    >
                      Marcar tudo como lido
                    </button>
                    <button
                      type="button"
                      onClick={handleClearNotifications}
                      className="text-red-600 hover:text-red-700"
                      disabled={notifications.length === 0}
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {loadingNotifications && (
                  <div className="px-4 py-6 text-sm text-gray-500">Carregando...</div>
                )}

                {!loadingNotifications && notificationsError && (
                  <div className="px-4 py-6 text-sm text-red-600">{notificationsError}</div>
                )}

                {!loadingNotifications && !notificationsError && notifications.length === 0 && (
                  <div className="px-4 py-6 text-sm text-gray-500">
                    Nenhuma notificacao no momento.
                  </div>
                )}

                {!loadingNotifications && !notificationsError && notifications.length > 0 && (
                  <ul className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <li key={notification.id}>
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-1">
                                {formatDateTime(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.readAt && (
                              <span className="mt-1 h-2 w-2 rounded-full bg-blue-600"></span>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
