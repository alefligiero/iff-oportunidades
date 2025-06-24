// src/app/dashboard/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { jwtVerify } from 'jose';
import { PrismaClient, Role } from '@prisma/client';
import LogoutButton from './LogoutButton';

const prisma = new PrismaClient();

async function getSession() {
  const token = cookies().get('auth_token')?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    const userId = payload.userId as string;
    const userRole = payload.role as Role;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) return null;

    let name: string | null = null;
    if (userRole === 'STUDENT') {
      const profile = await prisma.student.findUnique({ where: { userId }, select: { name: true } });
      name = profile?.name ?? null;
    } else if (userRole === 'COMPANY') {
      const profile = await prisma.company.findUnique({ where: { userId }, select: { name: true } });
      name = profile?.name ?? null;
    } else if (userRole === 'ADMIN') {
      name = 'Administrador';
    }

    return { ...user, name };

  } catch (error) {
    console.error("Falha na verificação do token:", error);
    return null;
  }
}


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  const getNavigationLinks = () => {
    const baseLinks = [{ name: 'Início', href: '/dashboard' }];
    switch (session.role) {
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
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b h-20 flex items-center px-8">
          <h1 className="text-xl font-semibold text-gray-800">
            {`Olá, ${session.name}`}
          </h1>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
