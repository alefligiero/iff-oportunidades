'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/AuthGuard';
import LogoutButton from './LogoutButton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user) {
    return null; // AuthGuard irá redirecionar
  }

  const getNavigationLinks = () => {
    const baseLinks = [{ name: 'Início', href: '/dashboard' }];
    let roleLinks: { name: string; href: string; }[] = [];
    
    switch (user.role) {
      case 'STUDENT':
        roleLinks = [{ name: 'Meus Estágios', href: '/dashboard/internships' }, { name: 'Vagas', href: '/dashboard/vacancies' }];
        break;
      case 'COMPANY':
        roleLinks = [{ name: 'Publicar Vaga', href: '/dashboard/vacancies/new' }, { name: 'Minhas Vagas', href: '/dashboard/vacancies' }];
        break;
      case 'ADMIN':
        roleLinks = [
          { name: 'Estágios Pendentes', href: '/dashboard/admin/internships' },
          { name: 'Vagas Pendentes', href: '/dashboard/admin/vacancies' },
          { name: 'Vagas Aprovadas', href: '/dashboard/admin/vacancies/approved' }
        ];
        break;
      default:
        roleLinks = [];
    }
    
    return [...baseLinks, ...roleLinks, { name: 'Configurações', href: '/dashboard/settings' }];
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-100">
        <aside className="w-64 bg-white shadow-md flex flex-col">
          <div className="flex items-center justify-center h-20 border-b">
            <Link href="/dashboard">
              <Image src="/logo-iff.png" alt="Logo IFF" width={48} height={48} />
            </Link>
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
            <LogoutButton />
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b h-20 flex items-center px-8">
            <h1 className="text-xl font-semibold text-gray-800">
              {`Olá, ${user.name || user.email}`}
            </h1>
          </header>
          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
