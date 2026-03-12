import { NextRequest } from 'next/server';
import { DocumentStatus, DocumentType, InternshipStatus, VacancyStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { generatePeriodicReportsSchedule } from '@/lib/periodic-reports';

interface PendingTask {
  id: string;
  title: string;
  description: string;
  href: string;
}

const APPROVED_DOCUMENT_STATUSES = [DocumentStatus.APPROVED, DocumentStatus.SIGNED_VALIDATED];

const adminDocumentLabels: Record<DocumentType, string> = {
  TCE: 'do TCE',
  PAE: 'do PAE',
  PERIODIC_REPORT: 'do Relatorio Periodico',
  TRE: 'do TRE',
  RFE: 'do RFE',
  SIGNED_CONTRACT: 'do TCE + PAE assinados',
  LIFE_INSURANCE: 'do comprovante do Seguro de Vida',
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const getLatestDocumentByType = (
  documents: Array<{ type: DocumentType; createdAt: Date; updatedAt: Date }>,
  type: DocumentType
) => {
  return documents
    .filter((doc) => doc.type === type)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
};

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);

    if (!userPayload) {
      return createErrorResponse('Nao autenticado', 401);
    }

    if (userPayload.role === 'ADMIN') {
      const [pendingInternships, pendingDocuments, pendingVacancies] = await Promise.all([
        prisma.internship.findMany({
          where: { status: InternshipStatus.IN_ANALYSIS },
          select: {
            id: true,
            companyName: true,
            student: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.document.findMany({
          where: { status: DocumentStatus.PENDING_ANALYSIS },
          select: {
            id: true,
            type: true,
            internshipId: true,
            internship: {
              select: {
                companyName: true,
                student: {
                  select: { name: true },
                },
              },
            },
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.jobVacancy.findMany({
          where: { status: VacancyStatus.PENDING_APPROVAL },
          select: {
            id: true,
            title: true,
            company: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const tasks: PendingTask[] = [];

      pendingInternships.forEach((internship) => {
        tasks.push({
          id: `internship-${internship.id}`,
          title: 'Analisar formalizacao de estagio',
          description: `Aluno ${internship.student.name} - Empresa ${internship.companyName}.`,
          href: `/dashboard/admin/internships/${internship.id}`,
        });
      });

      pendingDocuments.forEach((document) => {
        const label = adminDocumentLabels[document.type] ?? `do ${document.type}`;
        tasks.push({
          id: `document-${document.id}`,
          title: `Aprovar documento ${label}`,
          description: `Aluno ${document.internship.student.name} - Empresa ${document.internship.companyName}.`,
          href: `/dashboard/admin/internships/${document.internshipId}`,
        });
      });

      pendingVacancies.forEach((vacancy) => {
        tasks.push({
          id: `vacancy-${vacancy.id}`,
          title: 'Aprovar vaga',
          description: `Empresa ${vacancy.company.name} - ${vacancy.title}.`,
          href: `/dashboard/admin/vacancies/${vacancy.id}`,
        });
      });

      return createSuccessResponse({ tasks, total: tasks.length });
    }

    if (userPayload.role === 'COMPANY') {
      const company = await prisma.company.findUnique({
        where: { userId: userPayload.userId },
        select: { id: true, name: true },
      });

      if (!company) {
        return createErrorResponse('Perfil de empresa nao encontrado', 404);
      }

      const rejectedVacancies = await prisma.jobVacancy.findMany({
        where: {
          companyId: company.id,
          status: VacancyStatus.REJECTED,
        },
        select: {
          id: true,
          title: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      const tasks: PendingTask[] = rejectedVacancies.map((vacancy) => ({
        id: `vacancy-${vacancy.id}`,
        title: 'Corrigir vaga recusada',
        description: `Vaga ${vacancy.title} precisa de ajustes.`,
        href: `/dashboard/vacancies/${vacancy.id}`,
      }));

      return createSuccessResponse({ tasks, total: tasks.length });
    }

    if (userPayload.role !== 'STUDENT') {
      return createSuccessResponse({ tasks: [], total: 0 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: userPayload.userId },
      select: { id: true },
    });

    if (!student) {
      return createErrorResponse('Perfil de aluno nao encontrado', 404);
    }

    const internships = await prisma.internship.findMany({
      where: {
        studentId: student.id,
        status: { not: InternshipStatus.CANCELED },
      },
      include: {
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const tasks: PendingTask[] = [];

    internships.forEach((internship) => {
      const documents = internship.documents;
      const hasAllInsuranceData = Boolean(
        internship.insuranceCompany &&
          internship.insurancePolicyNumber &&
          internship.insuranceCompanyCnpj &&
          internship.insuranceStartDate &&
          internship.insuranceEndDate
      );
      const isInsuranceRequired = Boolean(internship.insuranceRequired);

      if (isInsuranceRequired && !hasAllInsuranceData) {
        tasks.push({
          id: `${internship.id}-insurance-data`,
          title: 'Enviar dados do seguro',
          description: `Complete os dados do seguro do estagio na empresa ${internship.companyName}.`,
          href: `/dashboard/internships/${internship.id}#insurance-data`,
        });
      }

      if (
        [InternshipStatus.APPROVED, InternshipStatus.IN_PROGRESS, InternshipStatus.FINISHED].includes(
          internship.status
        )
      ) {
        const signedContractLatest = getLatestDocumentByType(documents, DocumentType.SIGNED_CONTRACT);
        const hasSignedContractApproved = documents.some(
          (doc) =>
            doc.type === DocumentType.SIGNED_CONTRACT &&
            APPROVED_DOCUMENT_STATUSES.includes(doc.status)
        );
        const hasSignedContractPending = documents.some(
          (doc) => doc.type === DocumentType.SIGNED_CONTRACT && doc.status === DocumentStatus.PENDING_ANALYSIS
        );

        if (!hasSignedContractApproved && !hasSignedContractPending) {
          const isRejected = signedContractLatest?.status === DocumentStatus.REJECTED;
          tasks.push({
            id: `${internship.id}-signed-contract`,
            title: isRejected
              ? 'Reenviar TCE + PAE assinados'
              : 'Enviar TCE + PAE assinados',
            description: `Falta o PDF unico com TCE e PAE assinados do estagio na empresa ${internship.companyName}.`,
            href: `/dashboard/internships/${internship.id}#documents-section`,
          });
        }
      }

      if (isInsuranceRequired && hasAllInsuranceData) {
        const lifeInsuranceLatest = getLatestDocumentByType(documents, DocumentType.LIFE_INSURANCE);
        const hasLifeInsuranceApproved = documents.some(
          (doc) =>
            doc.type === DocumentType.LIFE_INSURANCE &&
            APPROVED_DOCUMENT_STATUSES.includes(doc.status)
        );
        const hasLifeInsurancePending = documents.some(
          (doc) => doc.type === DocumentType.LIFE_INSURANCE && doc.status === DocumentStatus.PENDING_ANALYSIS
        );

        if (!hasLifeInsuranceApproved && !hasLifeInsurancePending) {
          const isRejected = lifeInsuranceLatest?.status === DocumentStatus.REJECTED;
          tasks.push({
            id: `${internship.id}-life-insurance`,
            title: isRejected
              ? 'Reenviar comprovante do seguro'
              : 'Enviar comprovante do seguro',
            description: `Envie o comprovante do seguro de vida para o estagio na empresa ${internship.companyName}.`,
            href: `/dashboard/internships/${internship.id}#insurance-data`,
          });
        }
      }

      if (internship.status === InternshipStatus.FINISHED) {
        const treLatest = getLatestDocumentByType(documents, DocumentType.TRE);
        const treApproved = documents.some(
          (doc) => doc.type === DocumentType.TRE && APPROVED_DOCUMENT_STATUSES.includes(doc.status)
        );
        const trePending = documents.some(
          (doc) => doc.type === DocumentType.TRE && doc.status === DocumentStatus.PENDING_ANALYSIS
        );

        if (!treApproved && !trePending) {
          const treRejected = treLatest?.status === DocumentStatus.REJECTED;
          tasks.push({
            id: `${internship.id}-tre`,
            title: treRejected ? 'Reenviar TRE' : 'Enviar TRE',
            description: `Envie o TRE do estagio na empresa ${internship.companyName}.`,
            href: `/dashboard/internships/${internship.id}#documents-section`,
          });
        }

        const rfeLatest = getLatestDocumentByType(documents, DocumentType.RFE);
        const rfeApproved = documents.some(
          (doc) => doc.type === DocumentType.RFE && APPROVED_DOCUMENT_STATUSES.includes(doc.status)
        );
        const rfePending = documents.some(
          (doc) => doc.type === DocumentType.RFE && doc.status === DocumentStatus.PENDING_ANALYSIS
        );

        if (!rfeApproved && !rfePending) {
          const rfeRejected = rfeLatest?.status === DocumentStatus.REJECTED;
          tasks.push({
            id: `${internship.id}-rfe`,
            title: rfeRejected ? 'Reenviar RFE' : 'Enviar RFE',
            description: `Envie o relatorio final do estagio na empresa ${internship.companyName}.`,
            href: `/dashboard/internships/${internship.id}#documents-section`,
          });
        }
      }

      if (internship.status === InternshipStatus.IN_PROGRESS || internship.status === InternshipStatus.FINISHED) {
        const schedule = generatePeriodicReportsSchedule(
          internship.startDate,
          internship.endDate,
          documents
        );

        if (schedule.requiresReports) {
          schedule.periods.forEach((period) => {
            if (['available', 'pending_submission', 'rejected', 'overdue'].includes(period.status)) {
              tasks.push({
                id: `${internship.id}-periodic-${period.periodNumber}`,
                title: `Enviar relatorio periodico (Periodo ${period.periodNumber})`,
                description: `Periodo do estagio na empresa ${internship.companyName} com vencimento em ${formatDate(
                  period.dueDate
                )}.`,
                href: `/dashboard/internships/${internship.id}#periodic-reports`,
              });
            }
          });
        }
      }
    });

    return createSuccessResponse({ tasks, total: tasks.length });
  } catch (error: unknown) {
    console.error('Erro ao buscar pendencias:', error);
    return createErrorResponse('Erro ao buscar pendencias', 500);
  }
}
