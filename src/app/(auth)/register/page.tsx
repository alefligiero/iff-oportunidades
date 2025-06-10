'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

type FieldErrors = {
  name?: string;
  email?: string;
  document?: string;
  password?: string;
  form?: string;
};

export default function RegisterPage() {
  const [role, setRole] = useState<'STUDENT' | 'COMPANY'>('STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccess(null);

    const tempErrors: FieldErrors = {};
    if (!name) tempErrors.name = 'O campo de nome é obrigatório.';
    if (!password) tempErrors.password = 'O campo de senha é obrigatório.';

    if (!email) {
      tempErrors.email = 'O campo de email é obrigatório.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Por favor, insira um formato de email válido.';
    }
    
    const unmaskedDocument = document.replace(/[^\d]/g, '');
    if (!unmaskedDocument) {
      tempErrors.document = `O campo de ${role === 'STUDENT' ? 'matrícula' : 'CNPJ'} é obrigatório.`;
    } else if (role === 'STUDENT') {
      if (unmaskedDocument.length !== 12) {
        tempErrors.document = 'A matrícula deve conter exatamente 12 números.';
      }
    } else if (role === 'COMPANY') {
      if (unmaskedDocument.length !== 14) {
        tempErrors.document = 'O CNPJ deve conter 14 números.';
      }
    }
    
    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, document: unmaskedDocument }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const formattedErrors: FieldErrors = {};
          for (const key in data.details) {
            formattedErrors[key as keyof FieldErrors] = data.details[key][0];
          }
          setErrors(formattedErrors);
        } else {
          setErrors({ form: data.error || 'Falha ao realizar o cadastro.' });
        }
        return;
      }

      setSuccess('Cadastro realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors({ form: 'Não foi possível conectar ao servidor. Verifique sua conexão.' });
      } else {
        setErrors({ form: 'Ocorreu um erro inesperado.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCNPJ = (value: string) => {
    if (!value) return value;
    const cnpj = value.replace(/[^\d]/g, '');
  
    if (cnpj.length <= 2) return cnpj;
    if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
    if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
    if (cnpj.length <= 12) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
  };
  
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (role === 'COMPANY') {
      setDocument(formatCNPJ(value));
    } else {
      setDocument(value);
    }
  };

  const documentLabel = role === 'STUDENT' ? 'Matrícula' : 'CNPJ';
  const documentPlaceholder = role === 'STUDENT' ? 'Ex: 202019700392' : '00.000.000/0000-00';
  const maxLength = role === 'STUDENT' ? 12 : 18;
  
  const getInputClassName = (fieldName: keyof FieldErrors) => {
    return `input-form ${errors[fieldName] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo-iff.png" alt="Logo do Instituto Federal Fluminense" width={80} height={80} priority />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Criar uma Conta</h1>
          <p className="mt-2 text-sm text-gray-600">Preencha os dados para se cadastrar</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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
            <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={getInputClassName('name')} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={getInputClassName('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="document" className="block text-sm font-medium text-gray-700">{documentLabel}</label>
            <input id="document" type="text" required value={document} onChange={handleDocumentChange} placeholder={documentPlaceholder} className={getInputClassName('document')} maxLength={maxLength} />
            {errors.document && <p className="mt-1 text-xs text-red-600">{errors.document}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={getInputClassName('password')} />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          {errors.form && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">{errors.form}</div>}
          {success && <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md">{success}</div>}

          <div>
            <button type="submit" disabled={isLoading || !!success} className="w-full button-primary">
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-gray-600">
          Já tem uma conta?{' '}
          <Link href="/" className="font-medium text-green-700 hover:text-green-600">Faça login</Link>
        </p>
      </div>
    </div>
  );
}
