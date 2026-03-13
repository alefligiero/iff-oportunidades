"use client";

interface DownloadTemplatesProps {
  showTRE?: boolean;
  showRFE?: boolean;
  showTerminationTerm?: boolean;
}

export default function DownloadTemplates({
  showTRE = true,
  showRFE = true,
  showTerminationTerm = false,
}: DownloadTemplatesProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          📥 Baixar Templates de Documentos Finais
        </h4>
        <p className="text-sm text-blue-800 mb-3">
          Baixe os modelos de documentos abaixo, preencha conforme as orientações e faça o upload após obter todas as assinaturas necessárias.
        </p>
      </div>

      <div className="space-y-3">
        {showTRE && (
          <div className="bg-white rounded-md p-3 border border-blue-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-900 mb-1">
                  Termo de Realização de Estágio (TRE)
                </h5>
                <p className="text-xs text-gray-600">
                  <strong>Responsável:</strong> Deve ser preenchido e assinado pelo <strong>representante da Empresa Concedente</strong>.
                </p>
              </div>
              <a
                href="/templates/tre-template.docx"
                download="TRE-Modelo.docx"
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Baixar TRE
              </a>
            </div>
          </div>
        )}

        {showRFE && (
          <div className="bg-white rounded-md p-3 border border-blue-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-900 mb-1">
                  Relatório Final de Estágio (RFE) - Orientações
                </h5>
                <p className="text-xs text-gray-600">
                  <strong>Responsável:</strong> Deve ser produzido pelo <strong>aluno</strong> em parceria com o <strong>Supervisor</strong> e o <strong>Professor-Orientador</strong>, que também devem assinar o documento.
                </p>
              </div>
              <a
                href="/templates/rfe-orientacoes.pdf"
                download="RFE-Orientacoes.pdf"
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Baixar Orientações
              </a>
            </div>
          </div>
        )}

        {showTerminationTerm && (
          <div className="bg-white rounded-md p-3 border border-blue-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-900 mb-1">
                  Termo de Cancelamento de Estágio
                </h5>
                <p className="text-xs text-gray-600">
                  <strong>Responsável:</strong> Deve ser preenchido pelo <strong>aluno</strong> e assinado pelas partes responsáveis para validação do encerramento antecipado.
                </p>
              </div>
              <a
                href="/templates/termination-term-template.docx"
                download="Termo-Cancelamento-Estagio.docx"
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Baixar Termo
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
        <p className="text-xs text-yellow-800">
          <strong>⚠️ Importante:</strong> Após preencher e coletar todas as assinaturas necessárias, 
          faça o upload dos documentos completos nos campos abaixo. Os documentos serão analisados 
          pela Agência de Oportunidades antes da conclusão final do processo.
        </p>
      </div>
    </div>
  );
}
