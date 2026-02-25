"use client";

import { useEffect, useState } from "react";
import { PeriodicReportsSchedule } from "@/lib/periodic-reports";
import { DocumentStatus, InternshipStatus } from "@prisma/client";

interface PeriodicReportsSectionProps {
  internshipId: string;
  internshipStatus: InternshipStatus;
}

const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
  "not_available": {
    bg: "bg-gray-100",
    text: "text-gray-700",
    icon: "🔒",
  },
  "available": {
    bg: "bg-green-100",
    text: "text-green-700",
    icon: "📥",
  },
  "pending_submission": {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    icon: "⏳",
  },
  "pending_analysis": {
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: "📋",
  },
  "approved": {
    bg: "bg-purple-100",
    text: "text-purple-700",
    icon: "✅",
  },
  "signed_submitted": {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    icon: "📝",
  },
  "completed": {
    bg: "bg-green-100",
    text: "text-green-700",
    icon: "🎉",
  },
  "rejected": {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: "❌",
  },
  "overdue": {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: "⚠️",
  },
};

const statusLabels: Record<string, string> = {
  "not_available": "Não Disponível",
  "available": "Disponível para Download",
  "pending_submission": "Aguardando Envio",
  "pending_analysis": "Pendente de Análise",
  "approved": "Aprovado",
  "signed_submitted": "Versão Assinada Enviada",
  "completed": "Finalizado",
  "rejected": "Rejeitado",
  "overdue": "Atrasado",
};

export default function PeriodicReportsSection({
  internshipId,
  internshipStatus,
}: PeriodicReportsSectionProps) {
  const [schedule, setSchedule] = useState<PeriodicReportsSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [downloadingPeriod, setDownloadingPeriod] = useState<number | null>(null);
  const [submittingPeriod, setSubmittingPeriod] = useState<number | null>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitModalPeriod, setSubmitModalPeriod] = useState<number | null>(null);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, [internshipId]);

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/internships/${internshipId}/periodic-reports-schedule`,
        {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar cronograma");
      }

      setSchedule(data.schedule);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      console.error("Erro ao buscar schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async (periodNumber: number) => {
    try {
      setDownloadingPeriod(periodNumber);
      const response = await fetch(
        `/api/internships/${internshipId}/periodic-report-template?period=${periodNumber}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao baixar modelo");
      }

      // Criar blob e fazer download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `modelo-relatorio-periodico-${periodNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao baixar modelo");
    } finally {
      setDownloadingPeriod(null);
    }
  };

  const openSubmitModal = (periodNumber: number) => {
    setSubmitModalPeriod(periodNumber);
    setSubmitFile(null);
    setSubmitError(null);
    setSubmitModalOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!submitFile || !submitModalPeriod) {
      setSubmitError('Selecione um arquivo');
      return;
    }

    setSubmittingPeriod(submitModalPeriod);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('report', submitFile);

      const response = await fetch(
        `/api/internships/${internshipId}/periodic-reports`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar relatório');
      }

      // Pequeno delay para garantir que o banco dados processou a requisição
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Atualizar schedule completamente
      await fetchSchedule();
      setSubmitModalOpen(false);
      setSubmitFile(null);
      alert('Relatório enviado com sucesso! Aguarde a análise do administrador.');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Erro ao enviar relatório'
      );
    } finally {
      setSubmittingPeriod(null);
    }
  };

  if (loading) {
    return (
      <div id="periodic-reports" className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return null;
  }

  if (!schedule.requiresReports) {
    return (
      <div id="periodic-reports" className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          📊 Relatórios Periódicos
        </h2>
        <p className="text-gray-600">
          {schedule.reasonNotRequired}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div id="periodic-reports" className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Relatórios Periódicos
        </h2>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const filteredPeriods =
    activeTab === "pending"
      ? schedule.periods.filter(
          (p) =>
            p.status === "available" ||
            p.status === "pending_submission" ||
            p.status === "pending_analysis" ||
            p.status === "rejected" ||
            p.status === "overdue"
        )
      : schedule.periods;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  return (
    <div id="periodic-reports" className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          📊 Relatórios Periódicos
        </h2>
        <div className="bg-gray-100 rounded-lg p-1 flex gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded transition ${
              activeTab === "all"
                ? "bg-blue-600 text-white"
                : "bg-transparent text-gray-700 hover:text-gray-900"
            }`}
          >
            Todos ({schedule.periods.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded transition ${
              activeTab === "pending"
                ? "bg-blue-600 text-white"
                : "bg-transparent text-gray-700 hover:text-gray-900"
            }`}
          >
            Pendentes ({schedule.summary.pending + schedule.summary.overdue})
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-700">
            {schedule.summary.completed}
          </div>
          <div className="text-sm text-green-600">Finalizados</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">
            {schedule.summary.available}
          </div>
          <div className="text-sm text-blue-600">Disponíveis</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">
            {schedule.summary.pending}
          </div>
          <div className="text-sm text-yellow-600">Pendentes</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-700">
            {schedule.summary.overdue}
          </div>
          <div className="text-sm text-red-600">Atrasados</div>
        </div>
      </div>

      {/* Timeline de Relatórios */}
      <div className="space-y-4">
        {filteredPeriods.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            Nenhum relatório para exibir nesta visualização.
          </p>
        ) : (
          filteredPeriods.map((period, index) => {
            const colors = statusColors[period.status];
            const isActive = ["available", "pending_submission", "pending_analysis", "rejected", "overdue"].includes(period.status);
            // Verificar se já existe documento pendente ou aprovado
            const hasSubmittedDocument = period.document && 
              (period.document.status === DocumentStatus.PENDING_ANALYSIS || period.document.status === DocumentStatus.APPROVED);

            return (
              <div key={period.periodNumber} className={`${colors.bg} ${colors.text} p-4 rounded-lg border-l-4 border-transparent`}>
                {/* Cabeçalho do Período */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{colors.icon}</span>
                      <h3 className="font-semibold text-lg">
                        {period.periodNumber}º Relatório Periódico
                      </h3>
                    </div>
                    <p className="text-sm opacity-80 mb-2">
                      Período: {formatDate(period.startDate)} a {formatDate(period.dueDate)}
                    </p>
                    <p className="text-sm font-medium">
                      {statusLabels[period.status]}
                    </p>
                  </div>
                </div>

                {/* Informações do Período */}
                <div className="mt-3 text-sm space-y-1 opacity-90">
                  <p>
                    <span className="font-medium">Vencimento:</span> {formatDate(period.dueDate)}
                  </p>
                  <p>
                    <span className="font-medium">Modelo disponível em:</span>{" "}
                    {formatDate(period.availableDate)}
                  </p>
                  {period.isOverdue && (
                    <p className="text-red-600 font-semibold">
                      ⚠️ Este relatório venceu - envio urgente necessário!
                    </p>
                  )}
                </div>

                {/* Documento associado */}
                {period.document && (
                  <div className="mt-4 bg-white bg-opacity-50 p-3 rounded text-sm">
                    <p className="font-medium mb-1">📎 Documento Enviado:</p>
                    <p className="text-xs opacity-80">
                      Data: {new Date(period.document.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    {period.document.status === DocumentStatus.REJECTED && period.document.rejectionComments && (
                      <div className="mt-2 bg-red-50 p-2 rounded text-red-700 text-xs">
                        <p className="font-medium">Motivo da rejeição:</p>
                        <p>{period.document.rejectionComments}</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Ações */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {period.isAvailable && !period.document && (
                    <button
                      onClick={() => downloadTemplate(period.periodNumber)}
                      disabled={downloadingPeriod === period.periodNumber}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingPeriod === period.periodNumber ? "📥 Baixando..." : "📥 Baixar Modelo"}
                    </button>
                  )}

                  {isActive && !hasSubmittedDocument && internshipStatus !== InternshipStatus.FINISHED && internshipStatus !== InternshipStatus.CANCELED && internshipStatus !== InternshipStatus.REJECTED && (
                    <button
                      onClick={() => openSubmitModal(period.periodNumber)}
                      disabled={submittingPeriod === period.periodNumber}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingPeriod === period.periodNumber ? '⏳ Enviando...' : '📤 Enviar Relatório'}
                    </button>
                  )}

                  {isActive && hasSubmittedDocument && (period.document?.status === DocumentStatus.PENDING_ANALYSIS) && (
                    <button disabled className="bg-gray-300 text-gray-600 px-4 py-2 rounded text-sm cursor-not-allowed" title="Relatório aguardando análise do administrador">
                      ⏳ Aguardando Análise
                    </button>
                  )}

                  {isActive && (internshipStatus === InternshipStatus.FINISHED || internshipStatus === InternshipStatus.CANCELED || internshipStatus === InternshipStatus.REJECTED) && (
                    <button disabled className="bg-gray-300 text-gray-600 px-4 py-2 rounded text-sm cursor-not-allowed" title="Não é possível enviar relatórios para estágios finalizados, cancelados ou rejeitados">
                      📤 Enviar Relatório (Indisponível)
                    </button>
                  )}

                  {period.document?.status === DocumentStatus.APPROVED && (
                    <button disabled className="bg-green-100 text-green-700 px-4 py-2 rounded text-sm cursor-not-allowed font-medium">
                      ✅ Relatório Aprovado
                    </button>
                  )}

                  {period.document?.status === DocumentStatus.REJECTED && (
                    <button disabled className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm cursor-not-allowed font-medium">
                      ❌ Relatório Recusado
                    </button>
                  )}

                  {period.document?.fileUrl && (
                    <a
                      href={period.document.fileUrl || ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition"
                    >
                      📄 Baixar Arquivo
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Informação de ajuda */}
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informações sobre Relatórios Periódicos</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Relatórios periódicos são obrigatórios para estágios com duração superior a 6 meses</li>
          <li>• Um relatório deve ser enviado a cada 6 meses do estágio</li>
          <li>• O modelo fica disponível 30 dias antes da data de vencimento</li>
          <li>• <strong>Importante:</strong> Envie o relatório já assinado por você, pelo supervisor e pelo professor orientador</li>
          <li>• O administrador analisará e aprovará ou recusará o relatório enviado</li>
        </ul>
      </div>

      {/* Modal de Envio */}
      {submitModalOpen && submitModalPeriod !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900">
              Enviar {submitModalPeriod}º Relatório Periódico
            </h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">
              Envie o relatório <strong>já assinado</strong> por você, pelo supervisor e pelo professor orientador. O arquivo deve estar em PDF, DOC ou DOCX.
            </p>

            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded">
                {submitError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivo do Relatório
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="sr-only"
                  id={`file-input-${submitModalPeriod}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        setSubmitError('Arquivo muito grande (máximo 10MB)');
                        return;
                      }
                      setSubmitFile(file);
                      setSubmitError(null);
                    }
                  }}
                />
                <label
                  htmlFor={`file-input-${submitModalPeriod}`}
                  className="block w-full border-2 border-dashed border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
                >
                  {submitFile ? (
                    <span className="text-green-700 font-medium">✓ {submitFile.name}</span>
                  ) : (
                    <span>📁 Clique para selecionar um arquivo...</span>
                  )}
                </label>
              </div>
              {submitFile && (
                <p className="text-xs text-green-700 mt-1">
                  ✓ Arquivo selecionado: {(submitFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setSubmitModalOpen(false);
                  setSubmitFile(null);
                  setSubmitError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={submittingPeriod !== null || !submitFile}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:bg-green-300"
              >
                {submittingPeriod === submitModalPeriod ? '⏳ Enviando...' : 'Enviar Relatório'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
