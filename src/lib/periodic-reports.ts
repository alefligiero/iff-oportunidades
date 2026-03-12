/**
 * Biblioteca de utilitários para gerenciamento de relatórios periódicos de estágio
 * 
 * Regras de negócio:
 * - Relatórios periódicos são obrigatórios para estágios com duração > 6 meses
 * - Devem ser enviados a cada 6 meses durante o estágio
 * - Modelo fica disponível 30 dias antes da data de vencimento
 * - Fluxo: Download modelo → Enviar para análise → Admin aprova → Enviar assinado → Admin valida
 */

import { DocumentStatus, DocumentType, InternshipType } from '@prisma/client';
import { addMonths, differenceInMonths, isBefore, isAfter, addDays, startOfDay } from 'date-fns';

export interface PeriodicReportPeriod {
  /** Número do período (1, 2, 3...) */
  periodNumber: number;
  
  /** Data de início do período */
  startDate: Date;
  
  /** Data de vencimento (6 meses após o início do período) */
  dueDate: Date;
  
  /** Data em que o modelo fica disponível (30 dias antes do vencimento) */
  availableDate: Date;
  
  /** Se o modelo já está disponível para download */
  isAvailable: boolean;
  
  /** Se o período já venceu */
  isOverdue: boolean;
  
  /** Documento enviado para este período (se existir) */
  document?: {
    id: string;
    status: DocumentStatus;
    fileUrl: string | null;
    createdAt: Date;
    rejectionComments: string | null;
  };
  
  /** Status consolidado do período */
  status: 'not_available' | 'available' | 'pending_submission' | 'pending_analysis' | 'approved' | 'signed_submitted' | 'completed' | 'rejected' | 'overdue';
}

export interface PeriodicReportsSchedule {
  /** Se o estágio requer relatórios periódicos */
  requiresReports: boolean;
  
  /** Motivo de não requerer relatórios (se aplicável) */
  reasonNotRequired?: string;
  
  /** Total de relatórios esperados */
  totalReportsExpected: number;
  
  /** Períodos de relatórios */
  periods: PeriodicReportPeriod[];
  
  /** Resumo de status */
  summary: {
    completed: number;
    pending: number;
    overdue: number;
    available: number;
  };
}

/**
 * Calcula a duração do estágio em meses
 */
export function calculateInternshipDurationInMonths(startDate: Date, endDate: Date): number {
  return differenceInMonths(endDate, startDate);
}

/**
 * Verifica se o estágio requer relatórios periódicos
 * Regra: duração > 6 meses
 */
export function requiresPeriodicReports(startDate: Date, endDate: Date): boolean {
  const durationInMonths = calculateInternshipDurationInMonths(startDate, endDate);
  return durationInMonths > 6;
}

/**
 * Calcula quantos relatórios periódicos são esperados
 * Um relatório a cada 6 meses, excluindo o período final que coincide com o
 * término do estágio (o relatório final não é um relatório periódico).
 * Fórmula: floor((duração - 1) / 6)
 * Ex: 12 meses → floor(11/6) = 1 relatório (apenas em 6 meses)
 * Ex: 18 meses → floor(17/6) = 2 relatórios (em 6 e 12 meses)
 */
export function calculateExpectedReportsCount(startDate: Date, endDate: Date): number {
  if (!requiresPeriodicReports(startDate, endDate)) {
    return 0;
  }
  
  const durationInMonths = calculateInternshipDurationInMonths(startDate, endDate);
  return Math.floor((durationInMonths - 1) / 6);
}

/**
 * Gera os períodos de relatórios periódicos
 */
export function generateReportPeriods(
  startDate: Date,
  endDate: Date,
  currentDate: Date = new Date()
): Omit<PeriodicReportPeriod, 'document' | 'status'>[] {
  const expectedCount = calculateExpectedReportsCount(startDate, endDate);
  const periods: Omit<PeriodicReportPeriod, 'document' | 'status'>[] = [];
  
  for (let i = 0; i < expectedCount; i++) {
    const periodNumber = i + 1;
    const periodStartDate = i === 0 ? startDate : addMonths(startDate, i * 6);
    const dueDate = addMonths(periodStartDate, 6);

    // Segurança: nunca gerar um período cujo vencimento coincida com ou ultrapasse
    // o fim do estágio — esse período seria o relatório final, não o periódico.
    if (!isBefore(startOfDay(dueDate), startOfDay(endDate))) {
      break;
    }

    const availableDate = addDays(dueDate, -30);
    
    const isAvailable = !isBefore(startOfDay(currentDate), startOfDay(availableDate));
    const isOverdue = isAfter(startOfDay(currentDate), startOfDay(dueDate));
    
    periods.push({
      periodNumber,
      startDate: periodStartDate,
      dueDate,
      availableDate,
      isAvailable,
      isOverdue,
    });
  }
  
  return periods;
}

/**
 * Determina o status de um período com base no documento associado
 */
export function determinePeriodStatus(
  period: Omit<PeriodicReportPeriod, 'document' | 'status'>,
  document?: PeriodicReportPeriod['document']
): PeriodicReportPeriod['status'] {
  // Se já passou do prazo e não tem documento aprovado/completo
  if (period.isOverdue) {
    if (!document || document.status === DocumentStatus.REJECTED) {
      return 'overdue';
    }
  }
  
  // Se tem documento, verificar status
  if (document) {
    switch (document.status) {
      case DocumentStatus.PENDING_ANALYSIS:
        // Verifica se é a primeira submissão ou se já foi aprovado antes (versão assinada)
        // Para isso, precisamos verificar se há 2 documentos para este período
        // Por simplicidade, vamos assumir que PENDING_ANALYSIS é sempre a primeira submissão
        return 'pending_analysis';
      
      case DocumentStatus.APPROVED:
        return 'approved';
      
      case DocumentStatus.SIGNED_VALIDATED:
        return 'completed';
      
      case DocumentStatus.REJECTED:
        return period.isAvailable ? 'rejected' : 'not_available';
    }
  }
  
  // Sem documento ainda
  if (!period.isAvailable) {
    return 'not_available';
  }
  
  if (period.isAvailable && !period.isOverdue) {
    return 'available';
  }
  
  return 'pending_submission';
}

/**
 * Associa documentos aos períodos correspondentes
 * Lógica: documentos do tipo PERIODIC_REPORT são associados aos períodos na ordem cronológica
 */
export function matchDocumentsToPeriods(
  periods: Omit<PeriodicReportPeriod, 'document' | 'status'>[],
  documents: Array<{
    id: string;
    type: DocumentType;
    status: DocumentStatus;
    fileUrl: string | null;
    createdAt: Date;
    rejectionComments: string | null;
  }>
): PeriodicReportPeriod[] {
  // Filtra apenas PERIODIC_REPORT e ordena por data de criação
  const periodicDocs = documents
    .filter(doc => doc.type === DocumentType.PERIODIC_REPORT)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
  // Estratégia robusta: associação sequencial simples
  // 1º documento -> 1º período, 2º documento -> 2º período, etc.
  // Documentos rejeitados permitem reenvio para o mesmo período
  const periodDocuments = new Map<number, PeriodicReportPeriod['document'][]>();
  
  let currentPeriodIndex = 0;
  
  periodicDocs.forEach((doc) => {
    let assignedPeriod = -1;
    
    // Se o documento anterior foi rejeitado, permite reenvio para o mesmo período
    if (currentPeriodIndex > 0) {
      const currentPeriodDocs = periodDocuments.get(currentPeriodIndex);
      if (currentPeriodDocs && currentPeriodDocs.length > 0) {
        const lastDoc = currentPeriodDocs[currentPeriodDocs.length - 1];
        if (lastDoc.status === DocumentStatus.REJECTED) {
          // Reenvio para o mesmo período
          assignedPeriod = currentPeriodIndex;
        }
      }
    }
    
    // Se não é reenvio, atribui ao próximo período disponível
    if (assignedPeriod === -1) {
      assignedPeriod = currentPeriodIndex + 1;
      
      // Verifica se o período atual já tem documento não-rejeitado
      const currentPeriodDocs = periodDocuments.get(assignedPeriod);
      if (currentPeriodDocs && currentPeriodDocs.length > 0) {
        const hasNonRejected = currentPeriodDocs.some(
          d => d.status !== DocumentStatus.REJECTED
        );
        if (hasNonRejected) {
          // Move para o próximo período
          currentPeriodIndex++;
          assignedPeriod = currentPeriodIndex + 1;
        }
      } else {
        // Período vazio, incrementa índice
        currentPeriodIndex++;
      }
    }
    
    // Associa o documento ao período
    if (assignedPeriod > 0 && assignedPeriod <= periods.length) {
      if (!periodDocuments.has(assignedPeriod)) {
        periodDocuments.set(assignedPeriod, []);
      }
      periodDocuments.get(assignedPeriod)!.push({
        id: doc.id,
        status: doc.status,
        fileUrl: doc.fileUrl,
        createdAt: doc.createdAt,
        rejectionComments: doc.rejectionComments,
      });
    }
  });
  
  // Monta os períodos com documentos e status
  return periods.map(period => {
    const docs = periodDocuments.get(period.periodNumber) || [];
    
    // Sempre pega o documento mais recente (último adicionado ao array após sort)
    // Se há múltiplos documentos (ex: rejeitado + reenviado), o mais novo será considerado
    const activeDoc = docs.length > 0 ? docs[docs.length - 1] : undefined;
    
    const status = determinePeriodStatus(period, activeDoc);
    
    return {
      ...period,
      document: activeDoc,
      status,
    };
  });
}

/**
 * Gera o schedule completo de relatórios periódicos
 */
export function generatePeriodicReportsSchedule(
  internshipStartDate: Date,
  internshipEndDate: Date,
  documents: Array<{
    id: string;
    type: DocumentType;
    status: DocumentStatus;
    fileUrl: string | null;
    createdAt: Date;
    rejectionComments: string | null;
  }>,
  currentDate: Date = new Date()
): PeriodicReportsSchedule {
  // Verifica se requer relatórios
  if (!requiresPeriodicReports(internshipStartDate, internshipEndDate)) {
    return {
      requiresReports: false,
      reasonNotRequired: 'Estágio com duração de 6 meses ou menos não requer relatórios periódicos',
      totalReportsExpected: 0,
      periods: [],
      summary: {
        completed: 0,
        pending: 0,
        overdue: 0,
        available: 0,
      },
    };
  }
  
  // Gera períodos
  const basePeriods = generateReportPeriods(internshipStartDate, internshipEndDate, currentDate);
  const periods = matchDocumentsToPeriods(basePeriods, documents);
  
  // Calcula resumo
  const summary = {
    completed: periods.filter(p => p.status === 'completed').length,
    pending: periods.filter(p => ['pending_submission', 'pending_analysis', 'approved', 'rejected'].includes(p.status)).length,
    overdue: periods.filter(p => p.status === 'overdue').length,
    available: periods.filter(p => p.status === 'available').length,
  };
  
  return {
    requiresReports: true,
    totalReportsExpected: basePeriods.length,
    periods,
    summary,
  };
}
