'use client';

import { DocumentStatus } from '@prisma/client';
import { getFinalDocumentsPolicy } from '@/lib/final-documents-policy';

interface AdminActionGuideProps {
  status: string; // InternshipStatus
  documents: Array<{
    type: string;
    status: string;
  }>;
  earlyTerminationApproved: boolean | null;
  internshipStartDate: string;
  internshipEndDate: string;
  earlyTerminationRequestedAt: string | null;
}

const APPROVED_DOCUMENT_STATUSES = [DocumentStatus.APPROVED, DocumentStatus.SIGNED_VALIDATED];

export default function AdminActionGuide({
  status,
  documents,
  earlyTerminationApproved,
  internshipStartDate,
  internshipEndDate,
  earlyTerminationRequestedAt,
}: AdminActionGuideProps) {
  if (status === 'REJECTED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-red-800 mb-2">Solicitação recusada</h3>
        <p className="text-sm text-red-700">
          Nenhuma ação pendente no momento. Aguarde nova submissão do aluno.
        </p>
      </div>
    );
  }

  if (status === 'CANCELED') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Solicitação cancelada</h3>
        <p className="text-sm text-gray-700">
          O prazo de correção expirou e o estágio foi cancelado automaticamente.
        </p>
      </div>
    );
  }

  if (status === 'FINISHED') {
    const finalDocumentsPolicy = getFinalDocumentsPolicy({
      earlyTerminationApproved,
      startDate: internshipStartDate,
      endDate: internshipEndDate,
      earlyTerminationRequestedAt,
    });

    const treApproved = documents.some(
      (doc) => doc.type === 'TRE' && APPROVED_DOCUMENT_STATUSES.includes(doc.status as DocumentStatus)
    );
    const rfeApproved = documents.some(
      (doc) => doc.type === 'RFE' && APPROVED_DOCUMENT_STATUSES.includes(doc.status as DocumentStatus)
    );
    const parecerAvaliativoApproved = documents.some(
      (doc) =>
        doc.type === 'PARECER_AVALIATIVO' &&
        APPROVED_DOCUMENT_STATUSES.includes(doc.status as DocumentStatus)
    );
    const terminationTermApproved = documents.some(
      (doc) =>
        doc.type === 'TERMINATION_TERM' &&
        APPROVED_DOCUMENT_STATUSES.includes(doc.status as DocumentStatus)
    );
    const finalDeclarationApproved = documents.some(
      (doc) =>
        doc.type === 'FINAL_DECLARATION' &&
        APPROVED_DOCUMENT_STATUSES.includes(doc.status as DocumentStatus)
    );

    const allFinalDocumentsApproved =
      (!finalDocumentsPolicy.requiresCoreFinalDocuments ||
        (treApproved && rfeApproved && parecerAvaliativoApproved)) &&
      (!finalDocumentsPolicy.requiresTerminationTerm || terminationTermApproved);

    if (finalDocumentsPolicy.requiresFinalDeclaration && allFinalDocumentsApproved && !finalDeclarationApproved) {
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-emerald-800 mb-2">Ação pendente do Admin</h3>
          <p className="text-sm text-emerald-700">
            Todos os documentos finais do aluno foram aprovados. Envie a Declaração Final para concluir o fluxo.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Processo finalizado</h3>
        <p className="text-sm text-gray-700">O estágio foi concluído e arquivado.</p>
      </div>
    );
  }

  if (status === 'IN_PROGRESS') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Ações do Admin (Em andamento)</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
          <li>Acompanhar relatórios periódicos (quando aplicável)</li>
          <li>Validar documentos finais (TRE, RFE e Parecer Avaliativo) quando enviados</li>
          <li>Gerenciar pedido de encerramento antecipado, se houver</li>
        </ul>
      </div>
    );
  }

  if (status === 'APPROVED') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-emerald-800 mb-2">Ações do Admin (Aprovado)</h3>
        <ul className="text-sm text-emerald-700 space-y-1 list-disc pl-5">
          <li>Aguardar envio dos documentos assinados pelo aluno</li>
          <li>Validar TCE/PAE assinados e o comprovante de seguro</li>
          <li>Ao validar, o estágio segue para andamento</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-yellow-800 mb-2">Ações do Admin (Em análise)</h3>
      <ul className="text-sm text-yellow-700 space-y-1 list-disc pl-5">
        <li>Revisar dados do formulário de estágio</li>
        <li>Verificar documentos enviados pelo aluno</li>
        <li>Aprovar ou recusar a formalização</li>
      </ul>
    </div>
  );
}
