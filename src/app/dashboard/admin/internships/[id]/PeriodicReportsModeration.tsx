'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentStatus, DocumentType, InternshipStatus } from '@prisma/client';

interface DocumentItem {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  fileUrl: string | null;
  rejectionComments: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PeriodicReportsModerationProps {
  internshipId: string;
  internshipStatus: InternshipStatus;
  initialDocuments: DocumentItem[];
  internshipStartDate: Date;
  internshipEndDate: Date;
}

const statusConfig: Record<DocumentStatus, { text: string; color: string }> = {
  PENDING_ANALYSIS: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  APPROVED: { text: 'Aprovado', color: 'bg-green-100 text-green-800 border-green-300' },
  REJECTED: { text: 'Rejeitado', color: 'bg-red-100 text-red-800 border-red-300' },
  SIGNED_VALIDATED: { text: 'Validado', color: 'bg-blue-100 text-blue-800 border-blue-300' },
};

interface PeriodicReport {
  documentId: string;
  periodNumber: number;
  status: DocumentStatus;
  fileUrl: string | null;
  rejectionComments: string | null;
  createdAt: string;
}

export default function PeriodicReportsModeration({
  internshipId,
  internshipStatus,
  initialDocuments,
  internshipStartDate,
  internshipEndDate,
}: PeriodicReportsModerationProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDocId, setModalDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedTab, setSelectedTab] = useState<'pending' | 'all'>('pending');

  // Filtrar e organizar relatórios periódicos
  const periodicReports = useMemo(() => {
    const reports = documents
      .filter((doc) => doc.type === DocumentType.PERIODIC_REPORT && doc.fileUrl)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Agrupar por período (inferir numero do período pela data)
    const grouped = reports.reduce((acc: Record<number, PeriodicReport[]>, doc) => {
      // Usar a ordem de criação como número do período para simplicidade
      // Em um caso mais complexo, poderia calcular pelo período real
      const periodNumber = (acc[Object.keys(acc).length] || []).length + 1;
      if (!acc[periodNumber]) acc[periodNumber] = [];
      acc[periodNumber].push({
        documentId: doc.id,
        periodNumber,
        status: doc.status,
        fileUrl: doc.fileUrl,
        rejectionComments: doc.rejectionComments,
        createdAt: doc.createdAt,
      });
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([_, reports]) => ({
        reports,
        periodNumber: reports[0]?.periodNumber || 0,
      }))
      .sort((a, b) => b.periodNumber - a.periodNumber);
  }, [documents]);

  const filteredReports = useMemo(() => {
    if (selectedTab === 'pending') {
      return periodicReports.filter((group) =>
        group.reports.some((r) => r.status === DocumentStatus.PENDING_ANALYSIS)
      );
    }
    return periodicReports;
  }, [periodicReports, selectedTab]);

  const refreshDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/internships/${internshipId}/documents`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível carregar os documentos');
      }

      setDocuments(data.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (documentId: string, status: DocumentStatus, reason?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/documents/${documentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, rejectionComments: reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar documento');
      }

      await refreshDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar documento');
    } finally {
      setLoading(false);
      setModalOpen(false);
      setModalDocId(null);
      setRejectionReason('');
    }
  };

  const openRejectModal = (documentId: string) => {
    setModalDocId(documentId);
    setRejectionReason('');
    setModalOpen(true);
  };

  const pendingCount = periodicReports.reduce(
    (sum, group) =>
      sum +
      group.reports.filter((r) => r.status === DocumentStatus.PENDING_ANALYSIS).length,
    0
  );

  const approvedCount = periodicReports.reduce(
    (sum, group) =>
      sum +
      group.reports.filter((r) => r.status === DocumentStatus.APPROVED).length,
    0
  );

  const rejectedCount = periodicReports.reduce(
    (sum, group) =>
      sum +
      group.reports.filter((r) => r.status === DocumentStatus.REJECTED).length,
    0
  );

  if (!periodicReports.length) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Moderação de Relatórios Periódicos</h3>
          <p className="text-sm text-gray-600">Revise e valide os relatórios periódicos enviados pelo aluno. <strong>Importante:</strong> Os relatórios devem estar assinados pelo aluno, supervisor e professor orientador.</p>
        </div>
        <button
          onClick={refreshDocuments}
          className="text-sm text-green-700 hover:text-green-900 font-medium"
          disabled={loading}
        >
          🔄 Atualizar
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
          <div className="text-sm text-yellow-600">Pendentes</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-700">{approvedCount}</div>
          <div className="text-sm text-green-600">Aprovados</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-700">{rejectedCount}</div>
          <div className="text-sm text-red-600">Rejeitados</div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setSelectedTab('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            selectedTab === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Pendentes ({pendingCount})
        </button>
        <button
          onClick={() => setSelectedTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            selectedTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Todos ({periodicReports.length})
        </button>
      </div>

      {/* Lista de Relatórios */}
      {filteredReports.length === 0 ? (
        <p className="text-sm text-gray-600 py-8 text-center">
          {selectedTab === 'pending'
            ? 'Nenhum relatório pendente.'
            : 'Nenhum relatório enviado.'}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((group) => (
            <div key={group.periodNumber} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">
                  {group.periodNumber}º Relatório Periódico
                </h4>
              </div>

              {group.reports.map((report, idx) => (
                <div key={report.documentId} className="bg-gray-50 p-3 rounded flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">
                        Enviado em{' '}
                        <strong>
                          {new Date(report.createdAt).toLocaleDateString('pt-BR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </strong>
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                          statusConfig[report.status].color
                        }`}
                      >
                        {statusConfig[report.status].text}
                      </span>
                    </div>
                    {report.rejectionComments && report.status === DocumentStatus.REJECTED && (
                      <p className="text-xs text-red-700 mt-1">Motivo: {report.rejectionComments}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {report.fileUrl && (
                      <a
                        href={`/api/documents/${report.documentId}/download`}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                      >
                        📥 Download
                      </a>
                    )}

                    {report.status === DocumentStatus.PENDING_ANALYSIS && (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateStatus(report.documentId, DocumentStatus.APPROVED)
                          }
                          disabled={loading}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-green-300"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => openRejectModal(report.documentId)}
                          disabled={loading}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-red-300"
                        >
                          Recusar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Rejeição */}
      {modalOpen && modalDocId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900">Motivo da recusa</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">
              Informe o motivo da recusa. Esta informação será enviada ao aluno.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder="Ex: Documento incompleto, falta de assinatura..."
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setModalDocId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    setError('Informe o motivo da recusa.');
                    return;
                  }
                  handleUpdateStatus(modalDocId, DocumentStatus.REJECTED, rejectionReason);
                }}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:bg-red-300"
              >
                Confirmar recusa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
