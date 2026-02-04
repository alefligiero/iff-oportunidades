'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

export default function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();
  const { addNotification } = useNotification();

  const handleLogout = () => {
    try {
      sessionStorage.setItem('logout_intent', '1');
    } catch {
      // Ignorar erros de storage
    }
    logout();
    addNotification('success', 'Você saiu com sucesso.');
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
