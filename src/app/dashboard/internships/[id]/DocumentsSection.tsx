"use client";

import { useEffect, useMemo, useState } from "react";
import { DocumentStatus, DocumentType, InternshipStatus, InternshipType } from "@prisma/client";
import DocumentUpload from "./DocumentUpload";
import DocumentList from "./DocumentList";
import DownloadTemplates from "./DownloadTemplates";

export type DocumentItem = {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  fileUrl: string | null;
  rejectionComments: string | null;
  createdAt: string;
  updatedAt: string;
};

interface DocumentsSectionProps {
  internshipId: string;
  internshipType: InternshipType;
  status: InternshipStatus;
  earlyTerminationApproved: boolean | null;
  initialDocuments: DocumentItem[];
}

const normalizeDocuments = (docs: Array<DocumentItem | (Partial<DocumentItem> & { createdAt: string | Date; updatedAt: string | Date })>): DocumentItem[] => {
  return docs.map((doc) => ({
    id: doc.id ?? "",
    type: doc.type as DocumentType,
    status: doc.status as DocumentStatus,
    fileUrl: doc.fileUrl ?? null,
    rejectionComments: doc.rejectionComments ?? null,
    createdAt: typeof doc.createdAt === "string" ? doc.createdAt : new Date(doc.createdAt).toISOString(),
    updatedAt: typeof doc.updatedAt === "string" ? doc.updatedAt : new Date(doc.updatedAt).toISOString(),
  }));
};

export default function DocumentsSection({
  internshipId,
  internshipType,
  status,
  earlyTerminationApproved,
  initialDocuments,
}: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(normalizeDocuments(initialDocuments));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Documentos "TCE + PAE assinados"
  const signedContractDocs = useMemo(
    () => documents.filter((doc) => doc.type === DocumentType.SIGNED_CONTRACT),
    [documents]
  );
  const signedContractApproved = signedContractDocs.some(
    (doc) => doc.status === DocumentStatus.APPROVED || doc.status === DocumentStatus.SIGNED_VALIDATED
  );
  const signedContractPending = signedContractDocs.some(
    (doc) => doc.status === DocumentStatus.PENDING_ANALYSIS
  );
  const canUploadSignedContract =
    status !== InternshipStatus.CANCELED &&
    (status === InternshipStatus.APPROVED || status === InternshipStatus.IN_PROGRESS || status === InternshipStatus.FINISHED) &&
    !signedContractApproved &&
    !signedContractPending;

  // TRE (apenas se internship está finalizado)
  const treDocs = useMemo(
    () => documents.filter((doc) => doc.type === DocumentType.TRE),
    [documents]
  );
  const treApproved = treDocs.some(
    (doc) => doc.status === DocumentStatus.APPROVED || doc.status === DocumentStatus.SIGNED_VALIDATED
  );
  const trePending = treDocs.some((doc) => doc.status === DocumentStatus.PENDING_ANALYSIS);
  const canUploadTre =
    status !== InternshipStatus.CANCELED &&
    status === InternshipStatus.FINISHED && !treApproved && !trePending;

  // RFE (apenas se internship está finalizado)
  const rfeDocs = useMemo(
    () => documents.filter((doc) => doc.type === DocumentType.RFE),
    [documents]
  );
  const rfeApproved = rfeDocs.some(
    (doc) => doc.status === DocumentStatus.APPROVED || doc.status === DocumentStatus.SIGNED_VALIDATED
  );
  const rfePending = rfeDocs.some((doc) => doc.status === DocumentStatus.PENDING_ANALYSIS);
  const canUploadRfe =
    status !== InternshipStatus.CANCELED &&
    status === InternshipStatus.FINISHED && !rfeApproved && !rfePending;

  // Termo de Cancelamento (obrigatório apenas para encerramento antecipado aprovado)
  const terminationTermDocs = useMemo(
    () => documents.filter((doc) => doc.type === DocumentType.TERMINATION_TERM),
    [documents]
  );
  const terminationTermApproved = terminationTermDocs.some(
    (doc) => doc.status === DocumentStatus.APPROVED || doc.status === DocumentStatus.SIGNED_VALIDATED
  );
  const terminationTermPending = terminationTermDocs.some(
    (doc) => doc.status === DocumentStatus.PENDING_ANALYSIS
  );
  const requiresTerminationTerm = earlyTerminationApproved === true;
  const canUploadTerminationTerm =
    requiresTerminationTerm &&
    status !== InternshipStatus.CANCELED &&
    status === InternshipStatus.FINISHED &&
    !terminationTermApproved &&
    !terminationTermPending;

  // LIFE_INSURANCE (Comprovante de Seguro de Vida)
  const lifeInsuranceDocs = useMemo(
    () => documents.filter((doc) => doc.type === DocumentType.LIFE_INSURANCE),
    [documents]
  );

  const tceDocs = useMemo(
    () => documents.filter((doc) => doc.type === DocumentType.TCE),
    [documents]
  );

  const tceRejected = tceDocs.some((doc) => doc.status === DocumentStatus.REJECTED);
  const tcePending = tceDocs.some((doc) => doc.status === DocumentStatus.PENDING_ANALYSIS);
  const tceApproved = tceDocs.some(
    (doc) => doc.status === DocumentStatus.APPROVED || doc.status === DocumentStatus.SIGNED_VALIDATED
  );
  const canUploadTce =
    internshipType === InternshipType.INTEGRATOR &&
    status !== InternshipStatus.CANCELED &&
    tceRejected &&
    !tcePending &&
    !tceApproved;

  const refreshDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/internships/${internshipId}/documents`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível carregar os documentos");
      }

      setDocuments(normalizeDocuments(data.documents || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar documentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDocuments(normalizeDocuments(initialDocuments));
  }, [initialDocuments]);

  return (
    <div id="documents-section" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Documentos</h2>
          <p className="text-sm text-gray-600">Envie e acompanhe o status dos documentos obrigatórios.</p>
        </div>
        {loading && <span className="text-xs text-gray-500">Atualizando...</span>}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded">
          {error}
        </div>
      )}

      {(status === InternshipStatus.APPROVED || status === InternshipStatus.IN_PROGRESS || status === InternshipStatus.FINISHED) && (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4 border border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-900">TCE + PAE assinados</h3>
            <p className="text-sm text-gray-600">
              Envie o PDF unico com as assinaturas do aluno, supervisor e professor orientador.
            </p>
          </div>

          {canUploadSignedContract && (
            <DocumentUpload
              internshipId={internshipId}
              documentType={DocumentType.SIGNED_CONTRACT}
              onUploadSuccess={refreshDocuments}
              disabled={false}
            />
          )}

          <DocumentList
            internshipId={internshipId}
            documents={signedContractDocs}
            onRefresh={refreshDocuments}
            showUploadButton={true}
            title="Envios de TCE + PAE assinados"
            showAlerts={false}
          />
        </div>
      )}

      {lifeInsuranceDocs.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4 border border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Comprovante de Seguro de Vida</h3>
            <p className="text-sm text-gray-600">
              Acompanhe o status de análise do comprovante de seguro de vida enviado.
            </p>
          </div>

          <DocumentList
            internshipId={internshipId}
            documents={lifeInsuranceDocs}
            onRefresh={refreshDocuments}
            showUploadButton={status !== InternshipStatus.CANCELED}
            title="Comprovantes de Seguro de Vida enviados"
            showAlerts={false}
          />
        </div>
      )}

      {internshipType === InternshipType.INTEGRATOR && tceDocs.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4 border border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Termo de Compromisso (TCE)</h3>
            <p className="text-sm text-gray-600">
              TCE enviado na formalizacao do estagio via Agente Integrador.
            </p>
          </div>

          {canUploadTce && (
            <DocumentUpload
              internshipId={internshipId}
              documentType={DocumentType.TCE}
              onUploadSuccess={refreshDocuments}
              disabled={false}
            />
          )}

          <DocumentList
            internshipId={internshipId}
            documents={tceDocs}
            onRefresh={refreshDocuments}
            showUploadButton={false}
            title="TCE enviados"
            showAlerts={false}
          />
        </div>
      )}

      {status === InternshipStatus.FINISHED && (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6 border border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-900">📋 Documentos Finais de Estágio</h3>
            <p className="text-sm text-gray-600">
              Parabéns pela conclusão do estágio! Agora você precisa enviar os documentos finais para formalizar o encerramento.
            </p>
          </div>

          {/* Templates para Download */}
          <DownloadTemplates showTRE={true} showRFE={true} showTerminationTerm={requiresTerminationTerm} />

          {/* Seção TRE */}
          <div className="border-t pt-4">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Enviar TRE Preenchido</h4>
              <p className="text-xs text-gray-600">
                Após o representante da empresa assinar o TRE, faça o upload do documento completo.
              </p>
            </div>

            {canUploadTre && (
              <DocumentUpload
                internshipId={internshipId}
                documentType={DocumentType.TRE}
                onUploadSuccess={refreshDocuments}
                disabled={false}
              />
            )}

            <DocumentList
              internshipId={internshipId}
              documents={treDocs}
              onRefresh={refreshDocuments}
              showUploadButton={true}
              title="TRE enviados"
              showAlerts={false}
            />
          </div>

          {/* Seção RFE */}
          <div className="border-t pt-4">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Enviar Relatório Final de Estágio</h4>
              <p className="text-xs text-gray-600">
                Após produzir o relatório com seu Supervisor e Professor-Orientador e coletar as assinaturas, faça o upload.
              </p>
            </div>

            {canUploadRfe && (
              <DocumentUpload
                internshipId={internshipId}
                documentType={DocumentType.RFE}
                onUploadSuccess={refreshDocuments}
                disabled={false}
              />
            )}

            <DocumentList
              internshipId={internshipId}
              documents={rfeDocs}
              onRefresh={refreshDocuments}
              showUploadButton={true}
              title="RFE enviados"
              showAlerts={false}
            />
          </div>

          {requiresTerminationTerm && (
            <div className="border-t pt-4">
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Enviar Termo de Cancelamento de Estágio</h4>
                <p className="text-xs text-gray-600">
                  Como seu encerramento antecipado foi aprovado, este termo é obrigatório para concluir o processo.
                </p>
              </div>

              {canUploadTerminationTerm && (
                <DocumentUpload
                  internshipId={internshipId}
                  documentType={DocumentType.TERMINATION_TERM}
                  onUploadSuccess={refreshDocuments}
                  disabled={false}
                />
              )}

              <DocumentList
                internshipId={internshipId}
                documents={terminationTermDocs}
                onRefresh={refreshDocuments}
                showUploadButton={true}
                title="Termos de Cancelamento enviados"
                showAlerts={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
