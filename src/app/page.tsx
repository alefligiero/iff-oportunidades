'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

type FieldErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateField = (fieldName: keyof FieldErrors): string | undefined => {
    switch (fieldName) {
      case 'email':
        if (!email) return 'O campo de email é obrigatório.';
        if (!/\S+@\S+\.\S+/.test(email)) return 'Por favor, insira um formato de email válido.';
        return undefined;
      case 'password':
        if (!password) return 'O campo de senha é obrigatório.';
        return undefined;
      default:
        return undefined;
    }
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const fieldName = e.target.name as keyof FieldErrors;
    const error = validateField(fieldName);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const emailError = validateField('email');
    const passwordError = validateField('password');

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ form: data.error || 'Falha no login. Verifique suas credenciais.' });
        return;
      }

      console.log('Login bem-sucedido!', data.token);
      router.push('/dashboard');

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
  
  const getInputClassName = (fieldName: keyof FieldErrors) => {
    return `input-form ${errors[fieldName] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
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
          <h1 className="text-2xl font-bold text-gray-900">
            Agência de Oportunidades
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Acesse sua conta para continuar
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleBlur}
              className={getInputClassName('email')}
            />
             {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={handleBlur}
              className={getInputClassName('password')}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>
          
          {errors.form && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
              {errors.form}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="button-primary"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-gray-600">
          Não tem uma conta?{' '}
          <Link href="/register" className="font-medium text-green-700 hover:text-green-600">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
