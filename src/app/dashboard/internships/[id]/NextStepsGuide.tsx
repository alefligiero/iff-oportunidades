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
  insuranceRequired: boolean;
  earlyTerminationApproved: boolean | null;
}

export default function NextStepsGuide({
  status,
  documents,
  insuranceRequired,
  earlyTerminationApproved,
}: NextStepsGuideProps) {
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
      const treApproved = documents.some(
        (doc) => doc.type === 'TRE' && doc.status === 'APPROVED'
      );
      const rfeApproved = documents.some(
        (doc) => doc.type === 'RFE' && doc.status === 'APPROVED'
      );
      const trePending = documents.some(
        (doc) => doc.type === 'TRE' && doc.status === 'PENDING_ANALYSIS'
      );
      const rfePending = documents.some(
        (doc) => doc.type === 'RFE' && doc.status === 'PENDING_ANALYSIS'
      );
      const requiresTerminationTerm = earlyTerminationApproved === true;
      const terminationTermApproved = documents.some(
        (doc) => doc.type === 'TERMINATION_TERM' && doc.status === 'APPROVED'
      );
      const terminationTermPending = documents.some(
        (doc) => doc.type === 'TERMINATION_TERM' && doc.status === 'PENDING_ANALYSIS'
      );

      // Todos os documentos finais aprovados
      if (
        treApproved &&
        rfeApproved &&
        (!requiresTerminationTerm || terminationTermApproved)
      ) {
        return {
          title: '🎉 Estágio Concluído com Sucesso!',
          steps: [
            '✅ Todos os documentos finais foram aprovados',
            'Parabéns pela conclusão do seu estágio!',
            'Em breve você receberá a Declaração de Realização de Estágio por e-mail',
          ],
          color: 'bg-green-50 border-green-200',
          textColor: 'text-green-900',
        };
      }

      // Documentos pendentes de análise
      if (trePending || rfePending || (requiresTerminationTerm && terminationTermPending)) {
        const pendingDocs = [];
        if (trePending) pendingDocs.push('TRE (Termo de Realização de Estágio)');
        if (rfePending) pendingDocs.push('RFE (Relatório Final de Estágio)');
        if (requiresTerminationTerm && terminationTermPending) {
          pendingDocs.push('Termo de Cancelamento de Estágio');
        }

        return {
          title: '⏳ Aguardando Aprovação dos Documentos Finais',
          steps: [
            `Documentos em análise: ${pendingDocs.join(' e ')}`,
            'A Agência de Oportunidades está analisando seus documentos',
            'Você será notificado assim que a análise for concluída',
          ],
          color: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-900',
        };
      }

      // Precisa enviar documentos finais
      const missingDocs = [];
      if (!treApproved && !trePending) missingDocs.push('TRE');
      if (!rfeApproved && !rfePending) missingDocs.push('RFE');
      if (requiresTerminationTerm && !terminationTermApproved && !terminationTermPending) {
        missingDocs.push('Termo de Cancelamento de Estágio');
      }

      const templateLine = requiresTerminationTerm
        ? '1️⃣ Baixe os templates de TRE, RFE e Termo de Cancelamento na seção "Documentos Finais" abaixo'
        : '1️⃣ Baixe os templates de TRE e RFE na seção "Documentos Finais" abaixo';

      const terminationLine = requiresTerminationTerm
        ? '4️⃣ Termo de Cancelamento: Preencha, colete as assinaturas e envie junto com os demais documentos'
        : null;

      return {
        title: '📋 Enviar Documentos Finais',
        steps: [
          'Seu estágio foi finalizado! Agora você precisa enviar os documentos finais:',
          templateLine,
          '2️⃣ TRE: Preencha e solicite assinatura do representante da Empresa',
          '3️⃣ RFE: Produza o relatório com seu Supervisor e Professor-Orientador',
          ...(terminationLine ? [terminationLine] : []),
          `${terminationLine ? '5️⃣' : '4️⃣'} Faça o upload dos documentos preenchidos e assinados`,
          `${terminationLine ? '6️⃣' : '5️⃣'} Aguarde a aprovação da Agência de Oportunidades`,
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
        if (insuranceRequired && !lifeInsuranceApproved && (lifecInsurancePending || noLifeInsurance)) {
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
          ...(insuranceRequired ? ['4️⃣ Envie o comprovante de seguro de vida'] : []),
          `${insuranceRequired ? '5️⃣' : '4️⃣'} Após aprovação de tudo, o estágio será iniciado`,
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
