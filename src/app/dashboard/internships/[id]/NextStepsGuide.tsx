'use client';

interface Document {
  id: string;
  type: string; // DocumentType
  status: string; // DocumentStatus
  fileUrl?: string | null;
}

interface NextStepsGuideProps {
  status: string; // InternshipStatus
  documents: Document[];
}

export default function NextStepsGuide({ status, documents }: NextStepsGuideProps) {
  const getNextSteps = () => {
    // Estágio em andamento
    if (status === 'IN_PROGRESS') {
      return {
        title: '✅ Estágio em Andamento',
        steps: [
          'O estágio foi iniciado com sucesso',
          'Você pode enviar relatórios periódicos conforme necessário',
          'Ao finalizar, envie o relatório final e TRE',
        ],
        color: 'bg-green-50 border-green-200',
        textColor: 'text-green-900',
      };
    }

    // Estágio finalizado
    if (status === 'FINISHED') {
      return {
        title: '🎉 Estágio Finalizado',
        steps: [
          'Parabéns! Seu estágio foi concluído com sucesso',
        ],
        color: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-900',
      };
    }

    // Estágio recusado
    if (status === 'REJECTED') {
      return {
        title: '❌ Estágio Recusado',
        steps: [
          'Verifique o motivo da recusa',
          'Corrija os problemas apontados',
          'Reenvie a solicitação',
        ],
        color: 'bg-red-50 border-red-200',
        textColor: 'text-red-900',
      };
    }

    // Estágio cancelado por prazo
    if (status === 'CANCELED') {
      return {
        title: '🚫 Estágio Cancelado',
        steps: [
          'O prazo para correção expirou',
          'Você pode abrir uma nova solicitação de estágio',
        ],
        color: 'bg-gray-50 border-gray-200',
        textColor: 'text-gray-800',
      };
    }

    // Estágio aprovado - aguardando assinaturas
    if (status === 'APPROVED') {
      const signedContractApproved = documents.some(
        (doc) => doc.type === 'SIGNED_CONTRACT' && doc.status === 'APPROVED'
      );
      const lifeInsuranceApproved = documents.some(
        (doc) => doc.type === 'LIFE_INSURANCE' && doc.status === 'APPROVED' && Boolean(doc.fileUrl)
      );
      const lifecInsurancePending = documents.some(
        (doc) => doc.type === 'LIFE_INSURANCE' && doc.status === 'PENDING_ANALYSIS' && Boolean(doc.fileUrl)
      );
      const noLifeInsurance = !documents.some(
        (doc) => doc.type === 'LIFE_INSURANCE' && Boolean(doc.fileUrl)
      );

      // Se já tem TCE/PAE assinados aprovados
      if (signedContractApproved) {
        const insuranceSteps = [];
        if (!lifeInsuranceApproved && (lifecInsurancePending || noLifeInsurance)) {
          insuranceSteps.push(
            'Envie ou complete o formulário de seguro de vida (pode ser feito agora ou antes de iniciar o estágio)'
          );
        }

        return {
          title: '📋 Próximos Passos',
          steps: [
            '✅ TCE e PAE assinados foram aprovados',
            ...insuranceSteps,
            'Após todos os documentos serem aprovados, você poderá iniciar o estágio',
          ],
          color: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-900',
        };
      }

      // Se TCE/PAE ainda estão pendentes de assinatura
      return {
        title: '📋 Próximos Passos',
        steps: [
          '1️⃣ Baixe os documentos TCE e PAE abaixo (já foram aprovados pela agência)',
          '2️⃣ Colete as assinaturas necessárias:',
          '   • Sua assinatura (aluno)',
          '   • Assinatura do supervisor de estágio',
          '   • Assinatura do professor orientador',
          '3️⃣ Reenvie os documentos assinados como um PDF único',
          '4️⃣ Envie o comprovante de seguro de vida',
          '5️⃣ Após aprovação de tudo, o estágio será iniciado',
        ],
        color: 'bg-orange-50 border-orange-200',
        textColor: 'text-orange-900',
      };
    }

    // Estágio em análise
    if (status === 'IN_ANALYSIS') {
      return {
        title: '⏳ Estágio em Análise',
        steps: [
          'Sua solicitação de estágio está sendo analisada pela agência',
          'Verifique os documentos abaixo para saber se falta algo',
          'Assim que a análise terminar, você receberá as próximas instruções',
        ],
        color: 'bg-yellow-50 border-yellow-200',
        textColor: 'text-yellow-900',
      };
    }

    return null;
  };

  const nextSteps = getNextSteps();

  if (!nextSteps) {
    return null;
  }

  return (
    <div className={`border-l-4 rounded-lg p-6 ${nextSteps.color}`}>
      <h3 className={`text-lg font-semibold ${nextSteps.textColor} mb-4`}>
        {nextSteps.title}
      </h3>
      <ol className={`space-y-2 ${nextSteps.textColor} text-sm`}>
        {nextSteps.steps.map((step, index) => (
          <li key={index} className="ml-4">
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
