'use client';

interface DocumentItem {
  id: string;
  type: string; // DocumentType
  status: string; // DocumentStatus
  fileUrl?: string | null;
}

interface AdminDocumentAlertsProps {
  status: string; // InternshipStatus
  documents: DocumentItem[];
  insuranceRequired: boolean;
}

const documentTypeLabels: Record<string, string> = {
  TCE: 'TCE',
  PAE: 'PAE',
  PERIODIC_REPORT: 'Relatório Periódico',
  TRE: 'TRE',
  RFE: 'Relatório Final (RFE)',
  SIGNED_CONTRACT: 'TCE/PAE assinados',
  LIFE_INSURANCE: 'Seguro de Vida',
};

export default function AdminDocumentAlerts({ status, documents, insuranceRequired }: AdminDocumentAlertsProps) {
  const pendingDocuments = documents.filter(
    (doc) => doc.status === 'PENDING_ANALYSIS' && Boolean(doc.fileUrl)
  );
  const pendingLabels = pendingDocuments.map((doc) => documentTypeLabels[doc.type] || doc.type);

  const hasLifeInsurance = documents.some(
    (doc) => doc.type === 'LIFE_INSURANCE' && Boolean(doc.fileUrl)
  );
  const signedContractExists = documents.some(
    (doc) => doc.type === 'SIGNED_CONTRACT' && Boolean(doc.fileUrl)
  );
  const signedContractPending = documents.some(
    (doc) => doc.type === 'SIGNED_CONTRACT' && doc.status === 'PENDING_ANALYSIS' && Boolean(doc.fileUrl)
  );

  if (pendingDocuments.length === 0 && (!insuranceRequired || hasLifeInsurance) && (status !== 'APPROVED' || signedContractExists)) {
    return null;
  }

  return (
    <div className="space-y-3">
      {pendingDocuments.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 font-medium">📌 Documentos pendentes de análise</p>
          <p className="text-sm text-yellow-700 mt-1">
            {pendingLabels.join(', ') || 'Há documentos aguardando análise.'}
          </p>
        </div>
      )}

      {insuranceRequired && !hasLifeInsurance && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800 font-medium">⚠️ Seguro de vida não enviado</p>
          <p className="text-sm text-amber-700 mt-1">
            O aluno ainda não enviou o comprovante de seguro.
          </p>
        </div>
      )}

      {status === 'APPROVED' && !signedContractExists && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium">✍️ Aguardando documentos assinados</p>
          <p className="text-sm text-blue-700 mt-1">
            O aluno deve enviar o TCE/PAE assinado para validação.
          </p>
        </div>
      )}

      {signedContractPending && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-800 font-medium">🔎 Assinaturas pendentes de validação</p>
          <p className="text-sm text-indigo-700 mt-1">
            Há documentos assinados aguardando sua análise.
          </p>
        </div>
      )}
    </div>
  );
}
