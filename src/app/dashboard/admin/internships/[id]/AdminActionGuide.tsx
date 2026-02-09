'use client';

interface AdminActionGuideProps {
  status: string; // InternshipStatus
}

export default function AdminActionGuide({ status }: AdminActionGuideProps) {
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
          <li>Validar documentos finais (TRE/RFE) quando enviados</li>
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
