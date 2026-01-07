"use client";

import { useEffect, useMemo, useState } from "react";
import { DocumentStatus, DocumentType, InternshipStatus } from "@prisma/client";
import DocumentUpload from "./DocumentUpload";
import DocumentList from "./DocumentList";

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
  status: InternshipStatus;
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

export default function DocumentsSection({ internshipId, status, initialDocuments }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(normalizeDocuments(initialDocuments));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedTypes = useMemo<DocumentType[]>(() => {
    const types = new Set<DocumentType>();
    
    // Seguro de vida sempre disponível (opcional desde o início para estágios diretos)
    types.add(DocumentType.LIFE_INSURANCE);

    // TCE e PAE apenas se foram enviados via Agente Integrador
    // (se existem nos documentos, significa que o estágio é via integrador)
    const hasTceOrPae = documents.some(doc => doc.type === DocumentType.TCE || doc.type === DocumentType.PAE);
    if (hasTceOrPae) {
      types.add(DocumentType.TCE);
      types.add(DocumentType.PAE);
    }

    if (status === InternshipStatus.APPROVED || status === InternshipStatus.IN_PROGRESS || status === InternshipStatus.FINISHED) {
      types.add(DocumentType.SIGNED_CONTRACT);
    }

    if (status === InternshipStatus.IN_PROGRESS || status === InternshipStatus.FINISHED) {
      types.add(DocumentType.PERIODIC_REPORT);
    }

    if (status === InternshipStatus.FINISHED) {
      types.add(DocumentType.TRE);
      types.add(DocumentType.RFE);
    }

    return Array.from(types);
  }, [status, documents]);

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
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4 border border-gray-200">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Documentos do Estágio</h2>
          <p className="text-sm text-gray-600">Envie e acompanhe o status dos documentos obrigatórios.</p>
        </div>
        {loading && <span className="text-xs text-gray-500">Atualizando...</span>}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded">
          {error}
        </div>
      )}

      <DocumentUpload
        internshipId={internshipId}
        allowedTypes={allowedTypes}
        onUploadSuccess={refreshDocuments}
        disabled={status === InternshipStatus.CANCELED}
      />

      <DocumentList
        internshipId={internshipId}
        documents={documents}
        onRefresh={refreshDocuments}
        showUploadButton
      />
    </div>
  );
}
