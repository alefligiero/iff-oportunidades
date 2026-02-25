'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

interface ContactMessage {
  id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'REPLIED';
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ContactPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { addNotification } = useNotification();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ subject?: string; message?: string }>({});
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'OPEN' | 'REPLIED'>('OPEN');

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar mensagens');
      }

      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && user?.role === 'ADMIN') {
      router.replace('/dashboard/admin/contact');
      return;
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!isLoading && user?.role && user.role !== 'ADMIN') {
      fetchMessages();
    }
  }, [isLoading, user?.role]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const subjectValue = subject.trim();
    const messageValue = message.trim();
    const nextErrors: { subject?: string; message?: string } = {};

    if (subjectValue.length < 5 || subjectValue.length > 100) {
      nextErrors.subject = 'Assunto deve ter entre 5 e 100 caracteres.';
    }

    if (messageValue.length < 10 || messageValue.length > 2000) {
      nextErrors.message = 'Mensagem deve ter entre 10 e 2000 caracteres.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      addNotification('warning', 'Verifique o tamanho do assunto e da mensagem.');
      return;
    }

    setFieldErrors({});

    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectValue,
          message: messageValue,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setFieldErrors({
            subject: Array.isArray(data.details.subject) ? data.details.subject[0] : undefined,
            message: Array.isArray(data.details.message) ? data.details.message[0] : undefined,
          });
        }
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      addNotification('success', 'Mensagem enviada com sucesso!');
      setSubject('');
      setMessage('');
      setFieldErrors({});
      await fetchMessages();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
      setError(errorMessage);
      addNotification('error', errorMessage);
    } finally {
      setSending(false);
    }
  };

  const formatDateTime = (value: string) => {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (user?.role === 'ADMIN') {
    return null;
  }

  const pendingMessages = messages.filter((item) => item.status === 'OPEN');
  const repliedMessages = messages.filter((item) => item.status === 'REPLIED');
  const visibleMessages = activeTab === 'OPEN' ? pendingMessages : repliedMessages;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Contato com a Agencia</h1>
        <p className="text-sm text-gray-600 mt-1">
          Envie uma mensagem para o admin e acompanhe as respostas por aqui.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Assunto
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500"
            placeholder="Ex: Duvida sobre estagio"
            maxLength={100}
          />
          <p className="mt-1 text-xs text-gray-500">Min 5, max 100 caracteres.</p>
          {fieldErrors.subject && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.subject}</p>
          )}
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Mensagem
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[120px] text-gray-900 placeholder:text-gray-500"
            placeholder="Descreva sua duvida ou solicitacao"
            maxLength={2000}
          />
          <p className="mt-1 text-xs text-gray-500">Min 10, max 2000 caracteres.</p>
          {fieldErrors.message && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.message}</p>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={sending}
          className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:bg-green-300 text-sm font-medium"
        >
          {sending ? 'Enviando...' : 'Enviar mensagem'}
        </button>
      </form>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Minhas mensagens</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('OPEN')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
                activeTab === 'OPEN'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Pendentes ({pendingMessages.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REPLIED')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
                activeTab === 'REPLIED'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Respondidas ({repliedMessages.length})
            </button>
            <button
              type="button"
              onClick={fetchMessages}
              className="text-sm text-green-700 hover:text-green-900"
              disabled={loading}
            >
              Atualizar
            </button>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-500">Carregando...</p>}
        {!loading && visibleMessages.length === 0 && (
          <p className="text-sm text-gray-600">Nenhuma mensagem enviada ainda.</p>
        )}

        {!loading && visibleMessages.length > 0 && (
          <div className="space-y-4">
            {visibleMessages.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.subject}</p>
                    <p className="text-xs text-gray-500">Enviado em {formatDateTime(item.createdAt)}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'REPLIED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {item.status === 'REPLIED' ? 'Respondido' : 'Pendente'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-3 whitespace-pre-line">{item.message}</p>

                {item.adminReply && (
                  <div className="mt-4 border-t border-gray-200 pt-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Resposta do admin</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{item.adminReply}</p>
                    {item.repliedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Respondido em {formatDateTime(item.repliedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
