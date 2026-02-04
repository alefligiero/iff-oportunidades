'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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

export default function DashboardHomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      const target = getDefaultRouteByRole(user?.role);
      router.replace(target);
    }
  }, [isLoading, user, router]);

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
    </div>
  );
}
