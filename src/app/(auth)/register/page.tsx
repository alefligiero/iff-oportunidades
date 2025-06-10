'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function RegisterPage() {
  const [role, setRole] = useState<'STUDENT' | 'COMPANY'>('STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, document }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDetails = data.details ? Object.values(data.details).flat().join(' ') : '';
        throw new Error(errorDetails || data.error || 'Falha ao realizar o cadastro.');
      }

      setSuccess('Cadastro realizado com sucesso! Redirecionando para a página de login...');
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const documentLabel = role === 'STUDENT' ? 'Matrícula' : 'CNPJ';
  const documentPlaceholder = role === 'STUDENT' ? 'Ex: 20231BSI0101' : '00.000.000/0000-00';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo-iff.png"
              alt="Logo do Instituto Federal Fluminense"
              width={80}
              height={80}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Criar uma Conta</h1>
          <p className="mt-2 text-sm text-gray-600">
            Preencha os dados para se cadastrar na plataforma
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <fieldset className="space-y-2">
            <legend className="block text-sm font-medium text-gray-700">Eu sou</legend>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <input id="role-student" name="role" type="radio" value="STUDENT" checked={role === 'STUDENT'} onChange={() => setRole('STUDENT')} className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500" />
                <label htmlFor="role-student" className="ml-2 block text-sm text-gray-900">Aluno</label>
              </div>
              <div className="flex items-center">
                <input id="role-company" name="role" type="radio" value="COMPANY" checked={role === 'COMPANY'} onChange={() => setRole('COMPANY')} className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500" />
                <label htmlFor="role-company" className="ml-2 block text-sm text-gray-900">Empresa</label>
              </div>
            </div>
          </fieldset>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome {role === 'COMPANY' ? ' da Empresa' : 'Completo'}</label>
            <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 input-form" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 input-form" />
          </div>
          <div>
            <label htmlFor="document" className="block text-sm font-medium text-gray-700">{documentLabel}</label>
            <input id="document" type="text" required value={document} onChange={(e) => setDocument(e.target.value)} placeholder={documentPlaceholder} className="mt-1 input-form" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 input-form" />
          </div>

          {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
          {success && <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md">{success}</div>}

          <div>
            <button type="submit" disabled={isLoading || !!success} className="w-full button-primary">
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-gray-600">
          Já tem uma conta?{' '}
          <Link href="/" className="font-medium text-green-700 hover:text-green-600">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
