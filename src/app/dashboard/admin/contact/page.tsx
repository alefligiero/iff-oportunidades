'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
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
  user: {
    name: string;
    email: string;
    role: string;
  };
}

function AdminContactPageContent() {
  const { addNotification } = useNotification();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [editingReplies, setEditingReplies] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'OPEN' | 'REPLIED'>('OPEN');

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/contact', {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar mensagens');
      }

      const items = Array.isArray(data.messages) ? data.messages : [];
      setMessages(items);
      setReplyDrafts((prev) => {
        const next = { ...prev };
        items.forEach((message: ContactMessage) => {
          if (next[message.id] === undefined) {
            next[message.id] = message.adminReply || '';
          }
        });
        return next;
      });
      setEditingReplies((prev) => {
        const next = { ...prev };
        items.forEach((message: ContactMessage) => {
          if (next[message.id] === undefined) {
            next[message.id] = message.status !== 'REPLIED';
          }
        });
        return next;
      });
      setReplyErrors({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleReply = async (messageId: string) => {
    const reply = (replyDrafts[messageId] || '').trim();
    if (reply.length < 3 || reply.length > 2000) {
      setReplyErrors((prev) => ({
        ...prev,
        [messageId]: 'Resposta deve ter entre 3 e 2000 caracteres.',
      }));
      addNotification('warning', 'Verifique o tamanho da resposta.');
      return;
    }

    setReplyErrors((prev) => ({ ...prev, [messageId]: '' }));

    setSending((prev) => ({ ...prev, [messageId]: true }));

    try {
      const response = await fetch(`/api/admin/contact/${messageId}/reply`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const fieldError = Array.isArray(data.details.reply) ? data.details.reply[0] : undefined;
          if (fieldError) {
            setReplyErrors((prev) => ({
              ...prev,
              [messageId]: fieldError,
            }));
          }
        }
        throw new Error(data.error || 'Erro ao enviar resposta');
      }

      addNotification('success', 'Resposta enviada com sucesso!');
      setEditingReplies((prev) => ({ ...prev, [messageId]: false }));
      await fetchMessages();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar resposta';
      addNotification('error', errorMessage);
    } finally {
      setSending((prev) => ({ ...prev, [messageId]: false }));
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

  const pendingMessages = messages.filter((item) => item.status === 'OPEN');
  const repliedMessages = messages.filter((item) => item.status === 'REPLIED');
  const visibleMessages = activeTab === 'OPEN' ? pendingMessages : repliedMessages;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Mensagens dos usuarios</h1>
        <p className="text-sm text-gray-600 mt-1">
          Responda as solicitacoes enviadas por alunos e empresas.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Caixa de entrada</h2>
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && visibleMessages.length === 0 && (
          <p className="text-sm text-gray-600">Nenhuma mensagem recebida.</p>
        )}

        {!loading && !error && visibleMessages.length > 0 && (
          <div className="space-y-4">
            {visibleMessages.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.subject}</p>
                    <p className="text-xs text-gray-500">
                      {item.user.name} ({item.user.role}) - {item.user.email}
                    </p>
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

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Resposta</label>
                  {editingReplies[item.id] ? (
                    <>
                      <textarea
                        value={replyDrafts[item.id] || ''}
                        onChange={(event) =>
                          setReplyDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[100px] text-gray-900 placeholder:text-gray-500"
                        placeholder="Digite a resposta do admin"
                        maxLength={2000}
                      />
                      <p className="mt-1 text-xs text-gray-500">Min 3, max 2000 caracteres.</p>
                      {replyErrors[item.id] && (
                        <p className="mt-1 text-xs text-red-600">{replyErrors[item.id]}</p>
                      )}
                    </>
                  ) : (
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 whitespace-pre-line">
                      {item.adminReply || 'Sem resposta registrada.'}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3">
                  {item.repliedAt && (
                    <p className="text-xs text-gray-500">Respondido em {formatDateTime(item.repliedAt)}</p>
                  )}
                  {editingReplies[item.id] ? (
                    <button
                      type="button"
                      onClick={() => handleReply(item.id)}
                      disabled={sending[item.id]}
                      className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:bg-green-300 text-sm font-medium"
                    >
                      {sending[item.id] ? 'Enviando...' : 'Enviar resposta'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingReplies((prev) => ({ ...prev, [item.id]: true }))
                      }
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                    >
                      Atualizar resposta
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminContactPage() {
  return (
    <AuthGuard requiredRole="ADMIN" redirectTo="/">
      <AdminContactPageContent />
    </AuthGuard>
  );
}
