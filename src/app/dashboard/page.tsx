'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface User {
  name: string;
  email: string;
  role: 'STUDENT' | 'COMPANY' | 'ADMIN';
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (!response.ok) {
          throw new Error('Falha ao obter dados do utilizador');
        }
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error(error);
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    Cookies.remove('auth_token');
    router.push('/');
  };
  
  const welcomeMessage = user ? `Bem-vindo, ${user.name}!` : 'Bem-vindo ao seu Painel';

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Image
                src="/logo-iff.png"
                alt="Logo do Instituto Federal Fluminense"
                width={40}
                height={40}
              />
            </div>
            <div>
              <button
                onClick={handleLogout}
                className="cursor-pointer text-sm font-medium text-gray-600 hover:text-green-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <p className="text-gray-600">A carregar...</p>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900">
                {welcomeMessage}
              </h1>
              <p className="mt-2 text-gray-600">
                Este é o seu dashboard. Em breve, aqui estarão as funcionalidades específicas para o seu perfil.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
