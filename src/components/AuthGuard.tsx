'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'STUDENT' | 'COMPANY';
  redirectTo?: string;
}

// Função para obter a rota padrão baseada no role do usuário
function getDefaultRouteByRole(role?: string): string {
  switch (role) {
    case 'STUDENT':
      return '/dashboard/internships';
    case 'COMPANY':
      return '/dashboard/vacancies';
    case 'ADMIN':
      return '/dashboard/admin/internships';
    default:
      return '/';
  }
}

export function AuthGuard({ 
  children, 
  requiredRole, 
  redirectTo = '/' 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { addNotification } = useNotification();
  const notificationShownRef = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        let logoutIntent = false;
        try {
          logoutIntent = sessionStorage.getItem('logout_intent') === '1';
          if (logoutIntent) {
            sessionStorage.removeItem('logout_intent');
          }
        } catch {
          logoutIntent = false;
        }

        if (!notificationShownRef.current && !logoutIntent) {
          addNotification('warning', 'Sua sessão expirou ou você não está autenticado. Redirecionando para login...');
          notificationShownRef.current = true;
        }
        setTimeout(() => router.push(redirectTo), 500);
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        if (!notificationShownRef.current) {
          addNotification('error', 'Você não tem permissão para acessar esta página. Redirecionando...');
          notificationShownRef.current = true;
        }
        const defaultRoute = getDefaultRouteByRole(user?.role);
        setTimeout(() => router.push(defaultRoute), 500);
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, redirectTo, addNotification]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-green-700"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar (elemento vazio enquanto redireciona)
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-green-700"></div>
          <p className="text-gray-600">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  // Se tiver role específica e não for a correta, redirecionar
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-green-700"></div>
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
