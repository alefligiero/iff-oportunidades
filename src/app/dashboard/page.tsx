'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface User {
  name: string;
  email: string;
  role: 'STUDENT' | 'COMPANY' | 'ADMIN';
}

const StudentDashboard = ({ user }: { user: User }) => (
  <div>
    <h2 className="text-2xl font-semibold text-gray-800">Painel do Aluno</h2>
    <p className="mt-4">Aqui você poderá gerir os seus estágios, procurar vagas e muito mais.</p>
  </div>
);

const CompanyDashboard = ({ user }: { user: User }) => (
  <div>
    <h2 className="text-2xl font-semibold text-gray-800">Painel da Empresa</h2>
    <p className="mt-4">Publique e gira as suas vagas de estágio e emprego.</p>
  </div>
);

const AdminDashboard = ({ user }: { user: User }) => (
  <div>
    <h2 className="text-2xl font-semibold text-gray-800">Painel do Administrador</h2>
    <p className="mt-4">Modere os estágios e as vagas pendentes de aprovação.</p>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (!response.ok) throw new Error('Falha ao obter dados do utilizador');
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

  const renderDashboardContent = () => {
    if (!user) return null;

    switch (user.role) {
      case 'STUDENT':
        return <StudentDashboard user={user} />;
      case 'COMPANY':
        return <CompanyDashboard user={user} />;
      case 'ADMIN':
        return <AdminDashboard user={user} />;
      default:
        return <p>Papel de utilizador desconhecido.</p>;
    }
  };
  
  const getNavigationLinks = () => {
    if (!user) return [];

    const baseLinks = [
      { name: 'Início', href: '/dashboard' },
    ];

    switch (user.role) {
      case 'STUDENT':
        return [...baseLinks, { name: 'Meus Estágios', href: '/dashboard/internships' }, { name: 'Vagas', href: '/dashboard/vacancies' }];
      case 'COMPANY':
        return [...baseLinks, { name: 'Publicar Vaga', href: '/dashboard/vacancies/new' }, { name: 'Minhas Vagas', href: '/dashboard/vacancies' }];
      case 'ADMIN':
        return [...baseLinks, { name: 'Estágios Pendentes', href: '/dashboard/admin/internships' }, { name: 'Vagas Pendentes', href: '/dashboard/admin/vacancies' }];
      default:
        return baseLinks;
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">A carregar...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="flex items-center justify-center h-20 border-b">
          <Image src="/logo-iff.png" alt="Logo IFF" width={48} height={48} />
        </div>
        <nav className="flex-grow px-4 py-6">
          <ul>
            {getNavigationLinks().map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="flex items-center p-3 my-1 text-gray-700 rounded-lg hover:bg-green-100 hover:text-green-800 transition-colors">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="px-4 py-6 border-t">
          <button onClick={handleLogout} className="w-full text-left flex items-center p-3 text-gray-700 rounded-lg hover:bg-red-100 hover:text-red-800 transition-colors">
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b h-20 flex items-center px-8">
          <h1 className="text-xl font-semibold text-gray-800">
            {user ? `Olá, ${user.name}` : 'Painel'}
          </h1>
        </header>
        <main className="flex-1 p-8">
          {renderDashboardContent()}
        </main>
      </div>
    </div>
  );
}
