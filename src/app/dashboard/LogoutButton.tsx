'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left flex items-center p-3 text-gray-700 rounded-lg hover:bg-red-100 hover:text-red-800 transition-colors"
    >
      Sair
    </button>
  );
}
