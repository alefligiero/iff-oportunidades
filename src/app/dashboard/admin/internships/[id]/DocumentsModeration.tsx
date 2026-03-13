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

interface DocumentsModerationProps {
  internshipId: string;
  internshipStatus: InternshipStatus;
  internshipType: string;
  insuranceRequired: boolean;
  initialDocuments: DocumentItem[];
}

const documentTypeLabels: Record<DocumentType, string> = {
  TCE: 'Termo de Compromisso (TCE)',
  PAE: 'Plano de Atividades (PAE)',
  PERIODIC_REPORT: 'Relatório Periódico',
  TRE: 'Termo de Realização (TRE)',
  RFE: 'Relatório Final (RFE)',
  TERMINATION_TERM: 'Termo de Cancelamento de Estágio',
  SIGNED_CONTRACT: 'TCE + PAE assinados (PDF único)',
  LIFE_INSURANCE: 'Seguro de Vida',
};
const statusConfig: Record<DocumentStatus, { text: string; color: string }> = {
  PENDING_ANALYSIS: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  APPROVED: { text: 'Aprovado', color: 'bg-green-100 text-green-800 border-green-300' },
  REJECTED: { text: 'Rejeitado', color: 'bg-red-100 text-red-800 border-red-300' },
  SIGNED_VALIDATED: { text: 'Validado', color: 'bg-blue-100 text-blue-800 border-blue-300' },
};

export default function DocumentsModeration({
  internshipId,
  internshipStatus,
  internshipType,
  insuranceRequired,
  initialDocuments,
}: DocumentsModerationProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDocId, setModalDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingApprovalDocId, setPendingApprovalDocId] = useState<string | null>(null);
  const visibleDocuments = documents.filter((doc) => Boolean(doc.fileUrl));
  const signedContractDocs = visibleDocuments.filter((doc) => doc.type === DocumentType.SIGNED_CONTRACT);
  const otherDocs = visibleDocuments.filter((doc) => doc.type !== DocumentType.SIGNED_CONTRACT);

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
      
      // Atualizar a página completa para refletir mudanças no status do estágio
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar documento');
    } finally {
      setLoading(false);
      setModalOpen(false);
      setModalDocId(null);
      setRejectionReason('');
      setConfirmModalOpen(false);
      setPendingApprovalDocId(null);
    }
  };

  const openRejectModal = (documentId: string) => {
    setModalDocId(documentId);
    setRejectionReason('');
    setModalOpen(true);
  };

  const handleApproveClick = (documentId: string) => {
    // Verificar se ao aprovar este documento, o estágio irá iniciar
    const documentToApprove = documents.find(d => d.id === documentId);
    if (!documentToApprove) return;

    const otherRequiredDocType = documentToApprove.type === DocumentType.SIGNED_CONTRACT
      ? (insuranceRequired ? DocumentType.LIFE_INSURANCE : null)
      : DocumentType.SIGNED_CONTRACT;

    if (!otherRequiredDocType && internshipStatus === InternshipStatus.APPROVED) {
      setPendingApprovalDocId(documentId);
      setConfirmModalOpen(true);
      return;
    }

    const otherDocApproved = documents.some(
      d => d.type === otherRequiredDocType && d.status === DocumentStatus.APPROVED
    );

    // Se o outro documento já está aprovado E estágio está APPROVED, mostrar modal de confirmação
    if (otherDocApproved && internshipStatus === InternshipStatus.APPROVED) {
      setPendingApprovalDocId(documentId);
      setConfirmModalOpen(true);
    } else {
      // Aprovar diretamente
      handleUpdateStatus(documentId, DocumentStatus.APPROVED);
    }
  };

  const canStartInternship = useMemo(() => {
    if (internshipStatus !== InternshipStatus.APPROVED) return false;

    const signedContractApproved = documents.some(
      (doc) => doc.type === DocumentType.SIGNED_CONTRACT && doc.status === DocumentStatus.APPROVED
    );

    const lifeInsuranceApproved = documents.some(
      (doc) => doc.type === DocumentType.LIFE_INSURANCE && doc.status === DocumentStatus.APPROVED
    );

    return signedContractApproved && (!insuranceRequired || lifeInsuranceApproved);
  }, [documents, internshipStatus, insuranceRequired]);

  const missingRequirements = useMemo(() => {
    const missing: string[] = [];

    const signedContractApproved = documents.some(
      (doc) => doc.type === DocumentType.SIGNED_CONTRACT && doc.status === DocumentStatus.APPROVED
    );
    const lifeInsuranceApproved = documents.some(
      (doc) => doc.type === DocumentType.LIFE_INSURANCE && doc.status === DocumentStatus.APPROVED
    );

    if (!signedContractApproved) missing.push('TCE + PAE assinados (PDF único)');
    if (insuranceRequired && !lifeInsuranceApproved) {
      missing.push('Comprovante de seguro de vida');
    }

    return missing;
  }, [documents, insuranceRequired]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Validação de documentos</h3>
          <p className="text-sm text-gray-600">Aprove ou recuse os documentos enviados pelo aluno.</p>
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

      {visibleDocuments.length === 0 ? (
        <p className="text-sm text-gray-600">Nenhum documento enviado ainda.</p>
      ) : (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800">TCE + PAE assinados</h4>
            </div>
            {signedContractDocs.length === 0 ? (
              <div className="p-4 text-sm text-gray-600">Nenhum envio de TCE/PAE assinado.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {signedContractDocs.map((doc) => (
                  <div key={doc.id} className="py-4 px-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{documentTypeLabels[doc.type]}</h4>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${statusConfig[doc.status].color}`}>
                          {statusConfig[doc.status].text}
                        </span>
                      </div>
                      {doc.rejectionComments && doc.status === DocumentStatus.REJECTED && (
                        <p className="text-xs text-red-700 mt-1">Motivo: {doc.rejectionComments}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.fileUrl && (
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                          📥 Download
                        </a>
                      )}

                      {doc.status === DocumentStatus.PENDING_ANALYSIS && (
                        <>
                          <button
                            onClick={() => handleApproveClick(doc.id)}
                            disabled={loading}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-green-300"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => openRejectModal(doc.id)}
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
            )}
          </div>

          <div className="border border-gray-200 rounded-lg">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800">Outros documentos</h4>
            </div>
            {otherDocs.length === 0 ? (
              <div className="p-4 text-sm text-gray-600">Nenhum outro documento enviado.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {otherDocs.map((doc) => (
                  <div key={doc.id} className="py-4 px-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{documentTypeLabels[doc.type]}</h4>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${statusConfig[doc.status].color}`}>
                          {statusConfig[doc.status].text}
                        </span>
                      </div>
                      {doc.rejectionComments && doc.status === DocumentStatus.REJECTED && (
                        <p className="text-xs text-red-700 mt-1">Motivo: {doc.rejectionComments}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.fileUrl && (
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                          📥 Download
                        </a>
                      )}

                      {doc.status === DocumentStatus.PENDING_ANALYSIS && (
                        <>
                          <button
                            onClick={() => handleApproveClick(doc.id)}
                            disabled={loading}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-green-300"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => openRejectModal(doc.id)}
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
            )}
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 pt-4">
        {internshipStatus === InternshipStatus.APPROVED && !canStartInternship ? (
          <div className="text-sm text-gray-700">
            <p className="font-medium">Para que o estágio seja iniciado automaticamente, falta aprovar:</p>
            <ul className="list-disc list-inside mt-1">
              {missingRequirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : internshipStatus === InternshipStatus.APPROVED && canStartInternship ? (
          <p className="text-sm text-green-700 font-medium">
            ✓ Documentos aprovados. O estágio será iniciado automaticamente na data prevista.
          </p>
        ) : internshipStatus === InternshipStatus.IN_PROGRESS ? (
          <p className="text-sm text-green-700 font-medium">
            ✓ Estágio em andamento.
          </p>
        ) : internshipStatus === InternshipStatus.FINISHED ? (
          <p className="text-sm text-green-700 font-medium">
            ✓ Estágio concluído.
          </p>
        ) : internshipStatus === InternshipStatus.CANCELED ? (
          <p className="text-sm text-gray-500 font-medium">
            Estágio cancelado.
          </p>
        ) : internshipStatus === InternshipStatus.REJECTED ? (
          <p className="text-sm text-red-600 font-medium">
            Formulário de estágio recusado.
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Aguardando aprovação do formulário de estágio.
          </p>
        )}
      </div>

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
              placeholder="Ex: Documento ilegível, falta assinatura..."
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

      {confirmModalOpen && pendingApprovalDocId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900">⚠️ Confirmação de aprovação</h3>
            <p className="text-sm text-gray-700 mt-3 mb-4">
              Ao aprovar este documento, <strong>o estágio será iniciado automaticamente</strong> (caso a data de início já tenha chegado).
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Tem certeza que deseja aprovar este documento?
            </p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setConfirmModalOpen(false);
                  setPendingApprovalDocId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (pendingApprovalDocId) {
                    handleUpdateStatus(pendingApprovalDocId, DocumentStatus.APPROVED);
                  }
                }}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:bg-green-300"
              >
                Confirmar aprovação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
