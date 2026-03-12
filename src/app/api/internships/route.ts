import { NextResponse, type NextRequest } from 'next/server';
import { Role, InternshipType, NotificationType } from '@prisma/client';
import { createInternshipSchema } from '@/lib/validations/schemas';
import { isInternshipBlocking } from '@/lib/internship-substatus';
import { validateRequestBody, createErrorResponse, createSuccessResponse } from '@/lib/validations/utils';
import { withErrorHandling, withLogging } from '@/lib/validations/middleware';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { processUploadedFile } from '@/lib/file-upload';
import { getSystemConfig } from '@/lib/system-config';

async function createInternship(request: NextRequest) {
  // Autenticação
  const userPayload = await getUserFromToken(request);
  if (!userPayload || userPayload.role !== 'STUDENT') {
    return createErrorResponse('Acesso negado.', 403);
  }

  const studentProfile = await prisma.student.findUnique({
    where: { userId: userPayload.userId },
  });
  
  if (!studentProfile) {
    return createErrorResponse('Perfil de aluno não encontrado.', 404);
  }

  const systemConfig = await getSystemConfig();
  const insuranceRequired = systemConfig.requireLifeInsuranceForNewInternships;

  // Verificar se aluno já possui estágio que impede nova solicitação
  const allInternships = await prisma.internship.findMany({
    where: { studentId: studentProfile.id },
    include: {
      documents: {
        select: { type: true, status: true, fileUrl: true },
      },
    },
  });

  const blockingInternship = allInternships.find((i) =>
    isInternshipBlocking(i.status, i.documents)
  );

  if (blockingInternship) {
    return createErrorResponse(
      'Você possui um estágio ou uma solicitação de estágio em andamento ou aguardando documentos. Conclua/Cancele o atual antes de solicitar um novo.',
      409
    );
  }

  // Processar FormData
  const formData = await request.formData();
  const type = formData.get('type') as InternshipType;
  const insuranceFile = formData.get('insurance') as File | null;

  if (!type || !Object.values(InternshipType).includes(type)) {
    return createErrorResponse('Tipo de estágio inválido', 400);
  }

  // Para ambos os tipos, precisamos dos dados completos do formulário
  const dataString = formData.get('data') as string;
  if (!dataString) {
    return createErrorResponse('Dados do formulário não fornecidos', 400);
  }

  let internshipData: Record<string, unknown>;
  try {
    internshipData = JSON.parse(dataString);
  } catch (error) {
    return createErrorResponse('Dados do formulário inválidos. Por favor, tente novamente.', 400);
  }
  
  // Validar dados do formulário para ambos os tipos
  const validation = validateRequestBody(createInternshipSchema, internshipData);
  if (!validation.success) {
    return validation.error;
  }

  if (!validation.data) {
    return createErrorResponse('Dados do formulario invalidos.', 400);
  }

  const validatedData = validation.data;

  const insuranceCompany = (validatedData.insuranceCompany ?? '').toString().trim();
  const insurancePolicyNumber = (validatedData.insurancePolicyNumber ?? '').toString().trim();
  const insuranceCompanyCnpj = (validatedData.insuranceCompanyCnpj ?? '').toString().trim();
  const insuranceStartDate = validatedData.insuranceStartDate ?? null;
  const insuranceEndDate = validatedData.insuranceEndDate ?? null;

  const hasInsuranceData = Boolean(
    insuranceCompany ||
    insurancePolicyNumber ||
    insuranceCompanyCnpj ||
    insuranceStartDate ||
    insuranceEndDate
  );
  const hasAllInsuranceFields = Boolean(
    insuranceCompany &&
    insurancePolicyNumber &&
    insuranceCompanyCnpj &&
    insuranceStartDate &&
    insuranceEndDate
  );

  if (insuranceRequired) {
    if (!insuranceFile || !hasAllInsuranceFields) {
      return createErrorResponse('O envio dos dados do seguro e comprovante e obrigatorio para novas solicitacoes.', 400);
    }
  } else if (hasInsuranceData || insuranceFile) {
    if (!insuranceFile || !hasAllInsuranceFields) {
      return createErrorResponse('Envie os dados do seguro e o comprovante no mesmo envio.', 400);
    }
  }

  if (type === InternshipType.INTEGRATOR) {
    // Via Agente Integrador - requer TCE (PAE deve estar em anexo no mesmo PDF)
    const tceFile = formData.get('tce') as File | null;

    if (!tceFile) {
      return createErrorResponse('TCE é obrigatório para estágios via Agente Integrador', 400);
    }

    // Criar internship com dados completos
    const newInternship = await prisma.$transaction(async (tx) => {
      const internship = await tx.internship.create({
        data: {
          ...validatedData,
          type: InternshipType.INTEGRATOR,
          studentId: studentProfile.id,
          hasDetailedInfo: true,
          insuranceRequired,
        } as any,
      });

      // Upload TCE
      const tceResult = await processUploadedFile(tceFile, internship.id, 'TCE');
      if ('error' in tceResult) {
        throw new Error(tceResult.error);
      }

      await tx.document.create({
        data: {
          type: 'TCE',
          fileUrl: tceResult.file.url,
          status: 'PENDING_ANALYSIS',
          internshipId: internship.id,
        },
      });

      // Criar documento de seguro somente se houver arquivo enviado
      if (insuranceFile) {
        const insuranceResult = await processUploadedFile(insuranceFile, internship.id, 'LIFE_INSURANCE');
        if (!('error' in insuranceResult)) {
          await tx.document.create({
            data: {
              type: 'LIFE_INSURANCE',
              fileUrl: insuranceResult.file.url,
              status: 'PENDING_ANALYSIS',
              internshipId: internship.id,
            },
          });
        }
      }

      return internship;
    });

    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: NotificationType.INTERNSHIP_SUBMITTED,
          title: 'Nova formalizacao de estagio',
          message: `Aluno ${studentProfile.name} enviou formalizacao de estagio para a empresa ${newInternship.companyName}.`,
          href: `/dashboard/admin/internships/${newInternship.id}`,
        })),
      });
    }

    return createSuccessResponse(newInternship, 201);
    
  } else {
    // Estágio Direto - dados já foram validados acima
    const newInternship = await prisma.$transaction(async (tx) => {
      const internship = await tx.internship.create({
        data: {
          ...validatedData,
          type: InternshipType.DIRECT,
          studentId: studentProfile.id,
          hasDetailedInfo: true,
          insuranceRequired,
        } as any,
      });

      // Criar documento de seguro somente se houver arquivo enviado
      if (insuranceFile) {
        // Se enviado, fazer upload e criar com arquivo
        const insuranceResult = await processUploadedFile(insuranceFile, internship.id, 'LIFE_INSURANCE');
        if (!('error' in insuranceResult)) {
          await tx.document.create({
            data: {
              type: 'LIFE_INSURANCE',
              fileUrl: insuranceResult.file.url,
              status: 'PENDING_ANALYSIS',
              internshipId: internship.id,
            },
          });
        }
      }

      return internship;
    });

    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: NotificationType.INTERNSHIP_SUBMITTED,
          title: 'Nova formalizacao de estagio',
          message: `Aluno ${studentProfile.name} enviou formalizacao de estagio para a empresa ${newInternship.companyName}.`,
          href: `/dashboard/admin/internships/${newInternship.id}`,
        })),
      });
    }

    return createSuccessResponse(newInternship, 201);
  }
}

export const POST = withErrorHandling(withLogging(createInternship));
