'use client';

import { useState } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

interface Document {
  id: string;
  type: string; // DocumentType
  status: string; // DocumentStatus
  fileUrl: string | null;
  rejectionComments: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DocumentListProps {
  internshipId: string;
  documents: Document[];
  onRefresh?: () => void;
  showUploadButton?: boolean;
}

const documentTypeLabels: Record<string, string> = {
  TCE: 'Termo de Compromisso (TCE)',
  PAE: 'Plano de Atividades (PAE)',
  PERIODIC_REPORT: 'Relatório Periódico',
  TRE: 'Termo de Realização (TRE)',
  RFE: 'Relatório Final (RFE)',
  SIGNED_CONTRACT: 'TCE + PAE assinados (PDF único)',
  LIFE_INSURANCE: 'Seguro de Vida',
};

const statusConfig: Record<string, { text: string; color: string; icon: string }> = {
  PENDING_ANALYSIS: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '🕐' },
  APPROVED: { text: 'Aprovado', color: 'bg-green-100 text-green-800 border-green-300', icon: '✅' },
  REJECTED: { text: 'Rejeitado', color: 'bg-red-100 text-red-800 border-red-300', icon: '❌' },
  SIGNED_VALIDATED: { text: 'Validado', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '✔️' },
};

// Componente para renderizar cada documento
function DocumentRow({
  doc,
  documentTypeLabels,
  statusConfig,
  formatDate,
  downloading,
  handleDownload,
  showUploadButton = false,
}: {
  doc: Document;
  documentTypeLabels: Record<string, string>;
  statusConfig: Record<string, { text: string; color: string; icon: string }>;
  formatDate: (date: string) => string;
  downloading: string | null;
  handleDownload: (id: string, name: string) => void;
  showUploadButton?: boolean;
}) {
  return (
    <div className="p-6 hover:bg-gray-50 transition">
      {/* Cabeçalho: Título + Status + Botão Download */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-gray-900">
            {documentTypeLabels[doc.type]}
          </h4>
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
              statusConfig[doc.status].color
            }`}
          >
            {statusConfig[doc.status].icon} {statusConfig[doc.status].text}
          </span>
        </div>

        {/* Botão de download */}
        {doc.fileUrl && (
          <button
            onClick={() => handleDownload(doc.id, `${doc.type}_${doc.id}.pdf`)}
            disabled={downloading === doc.id}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition whitespace-nowrap"
            title="Fazer download"
          >
            {downloading === doc.id ? (
              <>⏳ Baixando...</>
            ) : (
              <>📥 Download</>
            )}
          </button>
        )}
      </div>

      {/* Data de envio */}
      <p className="text-xs text-gray-500 mb-3">
        Enviado em: {formatDate(doc.createdAt)}
        {doc.updatedAt !== doc.createdAt && (
          <span className="ml-2">• Atualizado em: {formatDate(doc.updatedAt)}</span>
        )}
      </p>

      {/* Comentários de rejeição */}
      {doc.status === 'REJECTED' && doc.rejectionComments && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
          <p className="font-semibold text-red-800 text-sm mb-1">📋 Motivo da rejeição:</p>
          <p className="text-red-700 text-sm">{doc.rejectionComments}</p>
        </div>
      )}

      {/* Mensagem de instrução para reenvio */}
      {doc.status === 'REJECTED' && showUploadButton && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded">
          <p className="text-orange-800 text-sm">
            ℹ️ <strong>Próximo passo:</strong> Corrija o documento conforme o motivo acima e reenvie através da seção de upload.
          </p>
        </div>
      )}
    </div>
  );
}

export default function DocumentList({
  internshipId,
  documents,
  onRefresh,
  showUploadButton = false,
}: DocumentListProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const { addNotification } = useNotification();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    setDownloading(documentId);
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao fazer download');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      addNotification('error', error instanceof Error ? error.message : 'Erro ao fazer download do documento');
    } finally {
      setDownloading(null);
    }
  };

  // Separar documentos por status
  const approvedDocuments = documents.filter((doc) => doc.status === 'APPROVED');
  const pendingDocuments = documents.filter((doc) => doc.status === 'PENDING_ANALYSIS');
  const rejectedDocuments = documents.filter((doc) => doc.status === 'REJECTED');

  // Alertas importantes
  const hasLifeInsurance = documents.some((doc) => doc.type === 'LIFE_INSURANCE');
  const lifeInsuranceApproved = documents.some(
    (doc) => doc.type === 'LIFE_INSURANCE' && doc.status === 'APPROVED'
  );
  const tcePaeApproved = documents.some(
    (doc) => doc.type === 'TCE' && doc.status === 'APPROVED'
  ) && documents.some((doc) => doc.type === 'PAE' && doc.status === 'APPROVED');

  if (documents.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center">
        <div className="text-gray-400 mb-2">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-gray-600 text-sm">Nenhum documento enviado ainda</p>
        {showUploadButton && (
          <p className="text-gray-500 text-xs mt-2">
            Use o formulário acima para enviar documentos
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Documentos Enviados</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-sm text-green-600 hover:text-green-800 font-medium"
          >
            🔄 Atualizar
          </button>
        )}
      </div>

      {/* Alertas importantes */}
      <div className="px-6 py-4 space-y-3 border-b border-gray-200">
        {!hasLifeInsurance && showUploadButton && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded">
            <p className="text-orange-800 text-sm">
              ⚠️ <strong>Seguro de Vida:</strong> Você ainda não enviou o comprovante de seguro de vida. 
              Você pode enviar agora na seção de upload acima ou depois antes de iniciar o estágio.
            </p>
          </div>
        )}

        {hasLifeInsurance && !lifeInsuranceApproved && showUploadButton && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm">
              ⏳ <strong>Seguro de Vida:</strong> Seu comprovante de seguro de vida está pendente de análise.
            </p>
          </div>
        )}

        {tcePaeApproved && !pendingDocuments.some((d) => d.type === 'SIGNED_CONTRACT') && showUploadButton && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 text-sm">
              📋 <strong>Próximo passo:</strong> Baixe os TCE e PAE abaixo, colete as assinaturas e reenvie como um PDF único.
            </p>
          </div>
        )}
      </div>

      {/* Documentos Aprovados */}
      {approvedDocuments.length > 0 && (
        <div>
          <div className="px-6 py-3 bg-green-50 border-b border-green-200">
            <h4 className="font-semibold text-green-900 flex items-center gap-2">
              ✅ Documentos Aprovados ({approvedDocuments.length})
            </h4>
          </div>
          <div className="divide-y divide-gray-200">
            {approvedDocuments.map((doc) => (
              <DocumentRow 
                key={doc.id} 
                doc={doc} 
                documentTypeLabels={documentTypeLabels} 
                statusConfig={statusConfig} 
                formatDate={formatDate} 
                downloading={downloading} 
                handleDownload={handleDownload} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Documentos Pendentes */}
      {pendingDocuments.length > 0 && (
        <div>
          <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
            <h4 className="font-semibold text-yellow-900 flex items-center gap-2">
              🕐 Documentos Pendentes ({pendingDocuments.length})
            </h4>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingDocuments.map((doc) => (
              <DocumentRow 
                key={doc.id} 
                doc={doc} 
                documentTypeLabels={documentTypeLabels} 
                statusConfig={statusConfig} 
                formatDate={formatDate} 
                downloading={downloading} 
                handleDownload={handleDownload} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Documentos Rejeitados */}
      {rejectedDocuments.length > 0 && (
        <div>
          <div className="px-6 py-3 bg-red-50 border-b border-red-200">
            <h4 className="font-semibold text-red-900 flex items-center gap-2">
              ❌ Documentos Rejeitados ({rejectedDocuments.length})
            </h4>
          </div>
          <div className="divide-y divide-gray-200">
            {rejectedDocuments.map((doc) => (
              <DocumentRow 
                key={doc.id} 
                doc={doc} 
                documentTypeLabels={documentTypeLabels} 
                statusConfig={statusConfig} 
                formatDate={formatDate} 
                downloading={downloading} 
                handleDownload={handleDownload}
                showUploadButton={showUploadButton}
              />
            ))}
          </div>
        </div>
      )}

      {/* Legenda de status */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-800 mb-2 font-medium">Legenda de status:</p>
        <div className="flex flex-wrap gap-3 text-xs text-gray-800">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>
            Pendente de análise
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
            Aprovado
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
            Rejeitado (reenvie corrigido)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
            Validado com assinatura
          </span>
        </div>
      </div>
    </div>
  );
}
