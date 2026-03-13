import { DocumentType, DocumentStatus } from '@prisma/client';

export interface DocumentSummary {
  type: DocumentType;
  status: DocumentStatus;
  fileUrl: string | null;
}

/**
 * Calcula o substatus de um estágio com status APPROVED
 */
export function getApprovedSubstatus(
  documents: DocumentSummary[],
  startDate: string | Date,
  insuranceRequired: boolean = true
): string {
  // Verificar status do SIGNED_CONTRACT
  const signedContract = documents.find((doc) => doc.type === DocumentType.SIGNED_CONTRACT);
  const hasSignedContractApproved = signedContract?.status === DocumentStatus.APPROVED;
  const hasSignedContractPending = signedContract?.status === DocumentStatus.PENDING_ANALYSIS;
  
  // Verificar status do LIFE_INSURANCE
  const lifeInsurance = documents.find((doc) => doc.type === DocumentType.LIFE_INSURANCE);
  const hasLifeInsuranceApproved = lifeInsurance?.status === DocumentStatus.APPROVED && Boolean(lifeInsurance.fileUrl);
  const hasLifeInsurancePending = lifeInsurance?.status === DocumentStatus.PENDING_ANALYSIS;

  // Prioridade 1: Documentos pendentes de aprovação
  if (hasSignedContractPending && insuranceRequired && hasLifeInsurancePending) {
    return 'Documentos em análise';
  }
  if (hasSignedContractPending) {
    return 'TCE/PAE em análise';
  }
  if (insuranceRequired && hasLifeInsurancePending) {
    return 'Seguro em análise';
  }
  
  // Prioridade 2: Documentos não enviados ou rejeitados
  if (!hasSignedContractApproved) return 'Aguardando TCE/PAE assinados';
  if (insuranceRequired && !hasLifeInsuranceApproved) return 'Aguardando Seguro';
  
  // Prioridade 3: Verificar se a data de início já chegou
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  if (start > today) {
    return 'Aguardando data de início';
  }
  
  return 'Pronto para iniciar';
}

/**
 * Calcula o substatus de um estágio com status IN_PROGRESS
 */
export function getInProgressSubstatus(documents: DocumentSummary[]): string | null {
  // Verificar relatórios periódicos pendentes
  const periodicReports = documents.filter((doc) => doc.type === DocumentType.PERIODIC_REPORT);
  const hasPendingReports = periodicReports.some((doc) => doc.status === DocumentStatus.PENDING_ANALYSIS);
  
  if (hasPendingReports) {
    return 'Relatório em análise';
  }
  
  // TODO: Implementar lógica de verificação de relatórios vencidos
  // Isso requer comparar datas de início/fim com os relatórios já enviados
  // Por enquanto, retornamos null (sem substatus)
  
  return null;
}

/**
 * Calcula o substatus de um estágio com status FINISHED.
 * Para encerramento antecipado aprovado, o Termo de Cancelamento também é obrigatório.
 */
export function getFinishedSubstatus(
  documents: DocumentSummary[],
  earlyTerminationApproved: boolean | null = false
): string {
  const requiredDocuments: Array<{ type: DocumentType; label: string }> = [
    { type: DocumentType.TRE, label: 'TRE' },
    { type: DocumentType.RFE, label: 'RFE' },
  ];

  if (earlyTerminationApproved === true) {
    requiredDocuments.push({
      type: DocumentType.TERMINATION_TERM,
      label: 'Termo de Cancelamento',
    });
  }

  const approvedLabels = requiredDocuments
    .filter(({ type }) =>
      documents.some((doc) => doc.type === type && doc.status === DocumentStatus.APPROVED)
    )
    .map(({ label }) => label);

  const pendingLabels = requiredDocuments
    .filter(({ type }) =>
      documents.some((doc) => doc.type === type && doc.status === DocumentStatus.PENDING_ANALYSIS)
    )
    .map(({ label }) => label);

  const missingLabels = requiredDocuments
    .filter(({ label }) => !approvedLabels.includes(label) && !pendingLabels.includes(label))
    .map(({ label }) => label);

  if (approvedLabels.length === requiredDocuments.length) {
    return 'Concluído';
  }

  if (pendingLabels.length === requiredDocuments.length) {
    return 'Documentos finais em análise';
  }

  if (pendingLabels.length > 0 && missingLabels.length === 0) {
    if (pendingLabels.length === 1) {
      return `${pendingLabels[0]} em análise`;
    }

    return 'Documentos finais em análise';
  }

  if (missingLabels.length === requiredDocuments.length) {
    return 'Aguardando documentos finais';
  }

  if (missingLabels.length === 1) {
    return `Aguardando ${missingLabels[0]}`;
  }

  if (missingLabels.length > 1) {
    return 'Aguardando documentos finais';
  }

  if (pendingLabels.length === 1) {
    return `${pendingLabels[0]} em análise`;
  }

  if (pendingLabels.length > 1) {
    return 'Documentos finais em análise';
  }

  return 'Aguardando documentos finais';
}

/**
 * Verifica se um estágio bloqueia a criação de um novo estágio pelo aluno.
 * Bloqueia se: IN_ANALYSIS, APPROVED, IN_PROGRESS, ou FINISHED sem todos os documentos finais aprovados.
 * Não bloqueia se: REJECTED, CANCELED, ou FINISHED com TRE e RFE aprovados ("Concluído").
 */
export function isInternshipBlocking(
  status: string,
  documents: DocumentSummary[],
  earlyTerminationApproved: boolean | null = false
): boolean {
  if (['IN_ANALYSIS', 'APPROVED', 'IN_PROGRESS'].includes(status)) {
    return true;
  }
  if (status === 'FINISHED') {
    return getFinishedSubstatus(documents, earlyTerminationApproved) !== 'Concluído';
  }
  return false;
}

/**
 * Obtém o label completo de status com substatus (se aplicável)
 */
export function getStatusWithSubstatus(
  status: string,
  documents: DocumentSummary[],
  startDate?: string | Date,
  insuranceRequired: boolean = true,
  earlyTerminationApproved: boolean | null = false
): string {
  switch (status) {
    case 'APPROVED':
      if (startDate) {
        const substatus = getApprovedSubstatus(documents, startDate, insuranceRequired);
        return `Aprovado - ${substatus}`;
      }
      return 'Aprovado';

    case 'IN_PROGRESS':
      const inProgressSubstatus = getInProgressSubstatus(documents);
      return inProgressSubstatus ? `Em Andamento - ${inProgressSubstatus}` : 'Em Andamento';

    case 'FINISHED':
      const finishedSubstatus = getFinishedSubstatus(documents, earlyTerminationApproved);
      return `Finalizado - ${finishedSubstatus}`;

    default:
      return status;
  }
}
