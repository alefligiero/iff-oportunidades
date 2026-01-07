'use client';

import { useState } from 'react';
import { DocumentType, DocumentStatus } from '@prisma/client';

interface Document {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
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

const documentTypeLabels: Record<DocumentType, string> = {
  TCE: 'Termo de Compromisso (TCE)',
  PAE: 'Plano de Atividades (PAE)',
  PERIODIC_REPORT: 'Relatório Periódico',
  TRE: 'Termo de Realização (TRE)',
  RFE: 'Relatório Final (RFE)',
  SIGNED_CONTRACT: 'Contrato Assinado',
  LIFE_INSURANCE: 'Seguro de Vida',
};

const statusConfig: Record<DocumentStatus, { text: string; color: string; icon: string }> = {
  PENDING_ANALYSIS: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '🕐' },
  APPROVED: { text: 'Aprovado', color: 'bg-green-100 text-green-800 border-green-300', icon: '✅' },
  REJECTED: { text: 'Rejeitado', color: 'bg-red-100 text-red-800 border-red-300', icon: '❌' },
  SIGNED_VALIDATED: { text: 'Validado', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '✔️' },
};

export default function DocumentList({
  internshipId,
  documents,
  onRefresh,
  showUploadButton = false,
}: DocumentListProps) {
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

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

      // Criar blob e fazer download
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
      alert(error instanceof Error ? error.message : 'Erro ao fazer download do documento');
    } finally {
      setDownloading(null);
    }
  };

  const toggleExpand = (docId: string) => {
    setExpandedDoc(expandedDoc === docId ? null : docId);
  };

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

      <div className="divide-y divide-gray-200">
        {documents.map((doc) => (
          <div key={doc.id} className="p-4 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium text-gray-900">
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

                <p className="text-xs text-gray-500">
                  Enviado em: {formatDate(doc.createdAt)}
                  {doc.updatedAt !== doc.createdAt && (
                    <span className="ml-2">• Atualizado em: {formatDate(doc.updatedAt)}</span>
                  )}
                </p>

                {/* Comentários de rejeição */}
                {doc.status === 'REJECTED' && doc.rejectionComments && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                    <p className="font-medium text-red-800 text-xs mb-1">Motivo da rejeição:</p>
                    <p className="text-red-700 text-xs">{doc.rejectionComments}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                {/* Botão de download */}
                {doc.fileUrl && (
                  <button
                    onClick={() => handleDownload(doc.id, `${doc.type}_${doc.id}.pdf`)}
                    disabled={downloading === doc.id}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-1"
                    title="Fazer download"
                  >
                    {downloading === doc.id ? (
                      <>⏳ Baixando...</>
                    ) : (
                      <>📥 Download</>
                    )}
                  </button>
                )}

                {/* Botão de reenviar (se rejeitado) */}
                {doc.status === 'REJECTED' && showUploadButton && (
                  <button
                    onClick={() => {
                      // Scroll para o componente de upload
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700 transition flex items-center gap-1"
                    title="Reenviar documento"
                  >
                    🔄 Reenviar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
