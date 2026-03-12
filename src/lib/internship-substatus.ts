import { DocumentType, DocumentStatus } from '@prisma/client';

export interface DocumentSummary {
  type: DocumentType;
  status: DocumentStatus;
  fileUrl: string | null;
}

/**
 * Calcula o substatus de um estágio com status APPROVED
 */
export function getApprovedSubstatus(documents: DocumentSummary[], startDate: string | Date): string {
  // Verificar status do SIGNED_CONTRACT
  const signedContract = documents.find((doc) => doc.type === DocumentType.SIGNED_CONTRACT);
  const hasSignedContractApproved = signedContract?.status === DocumentStatus.APPROVED;
  const hasSignedContractPending = signedContract?.status === DocumentStatus.PENDING_ANALYSIS;
  
  // Verificar status do LIFE_INSURANCE
  const lifeInsurance = documents.find((doc) => doc.type === DocumentType.LIFE_INSURANCE);
  const hasLifeInsuranceApproved = lifeInsurance?.status === DocumentStatus.APPROVED && Boolean(lifeInsurance.fileUrl);
  const hasLifeInsurancePending = lifeInsurance?.status === DocumentStatus.PENDING_ANALYSIS;

  // Prioridade 1: Documentos pendentes de aprovação
  if (hasSignedContractPending && hasLifeInsurancePending) {
    return 'Documentos em análise';
  }
  if (hasSignedContractPending) {
    return 'TCE/PAE em análise';
  }
  if (hasLifeInsurancePending) {
    return 'Seguro em análise';
  }
  
  // Prioridade 2: Documentos não enviados ou rejeitados
  if (!hasSignedContractApproved) return 'Aguardando TCE/PAE assinados';
  if (!hasLifeInsuranceApproved) return 'Aguardando Seguro';
  
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
 * Calcula o substatus de um estágio com status FINISHED
 */
export function getFinishedSubstatus(documents: DocumentSummary[]): string {
  // Verificar status do TRE
  const tre = documents.find((doc) => doc.type === DocumentType.TRE);
  const hasTreApproved = tre?.status === DocumentStatus.APPROVED;
  const hasTrePending = tre?.status === DocumentStatus.PENDING_ANALYSIS;
  
  // Verificar status do RFE
  const rfe = documents.find((doc) => doc.type === DocumentType.RFE);
  const hasRfeApproved = rfe?.status === DocumentStatus.APPROVED;
  const hasRfePending = rfe?.status === DocumentStatus.PENDING_ANALYSIS;

  // Se ambos aprovados
  if (hasTreApproved && hasRfeApproved) {
    return 'Concluído';
  }

  // Se ambos em análise
  if (hasTrePending && hasRfePending) {
    return 'Documentos finais em análise';
  }

  // Se apenas um em análise
  if (hasTrePending && !hasRfePending) {
    return 'TRE em análise';
  }
  if (hasRfePending && !hasTrePending) {
    return 'RFE em análise';
  }

  // Se ambos não enviados
  if (!tre && !rfe) {
    return 'Aguardando documentos finais';
  }

  // Se apenas um não enviado
  if (!tre || (tre && tre.status === DocumentStatus.REJECTED)) {
    return 'Aguardando TRE';
  }
  if (!rfe || (rfe && rfe.status === DocumentStatus.REJECTED)) {
    return 'Aguardando RFE';
  }

  // Caso um aprovado e outro pendente
  if (hasTreApproved && !hasRfeApproved) {
    return hasRfePending ? 'RFE em análise' : 'Aguardando RFE';
  }
  if (hasRfeApproved && !hasTreApproved) {
    return hasTrePending ? 'TRE em análise' : 'Aguardando TRE';
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
  documents: DocumentSummary[]
): boolean {
  if (['IN_ANALYSIS', 'APPROVED', 'IN_PROGRESS'].includes(status)) {
    return true;
  }
  if (status === 'FINISHED') {
    return getFinishedSubstatus(documents) !== 'Concluído';
  }
  return false;
}

/**
 * Obtém o label completo de status com substatus (se aplicável)
 */
export function getStatusWithSubstatus(
  status: string,
  documents: DocumentSummary[],
  startDate?: string | Date
): string {
  switch (status) {
    case 'APPROVED':
      if (startDate) {
        const substatus = getApprovedSubstatus(documents, startDate);
        return `Aprovado - ${substatus}`;
      }
      return 'Aprovado';

    case 'IN_PROGRESS':
      const inProgressSubstatus = getInProgressSubstatus(documents);
      return inProgressSubstatus ? `Em Andamento - ${inProgressSubstatus}` : 'Em Andamento';

    case 'FINISHED':
      const finishedSubstatus = getFinishedSubstatus(documents);
      return `Finalizado - ${finishedSubstatus}`;

    default:
      return status;
  }
}
