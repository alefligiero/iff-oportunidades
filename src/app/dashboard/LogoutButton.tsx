'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('auth_token');
    router.push('/');
    router.refresh();
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
