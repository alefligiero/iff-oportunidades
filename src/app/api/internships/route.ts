import { NextResponse, type NextRequest } from 'next/server';
import { Role, InternshipType } from '@prisma/client';
import { createInternshipSchema } from '@/lib/validations/schemas';
import { validateRequestBody, createErrorResponse, createSuccessResponse } from '@/lib/validations/utils';
import { withErrorHandling, withLogging } from '@/lib/validations/middleware';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { processUploadedFile } from '@/lib/file-upload';

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

  // Verificar se aluno já possui estágio em andamento
  const activeInternship = await prisma.internship.findFirst({
    where: {
      studentId: studentProfile.id,
      status: 'IN_PROGRESS',
    },
  });

  if (activeInternship) {
    return createErrorResponse('Você já possui um estágio em andamento. Finalize o atual antes de solicitar um novo.', 409);
  }

  // Processar FormData
  const formData = await request.formData();
  const type = formData.get('type') as InternshipType;

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

  if (type === InternshipType.INTEGRATOR) {
    // Via Agente Integrador - requer TCE e PAE além do formulário completo
    const tceFile = formData.get('tce') as File | null;
    const paeFile = formData.get('pae') as File | null;

    if (!tceFile || !paeFile) {
      return createErrorResponse('TCE e PAE são obrigatórios para estágios via Agente Integrador', 400);
    }

    // Criar internship com dados completos
    const newInternship = await prisma.$transaction(async (tx) => {
      const internship = await tx.internship.create({
        data: {
          ...validation.data,
          type: InternshipType.INTEGRATOR,
          studentId: studentProfile.id,
          hasDetailedInfo: true,
        },
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

      // Upload PAE
      const paeResult = await processUploadedFile(paeFile, internship.id, 'PAE');
      if ('error' in paeResult) {
        throw new Error(paeResult.error);
      }

      await tx.document.create({
        data: {
          type: 'PAE',
          fileUrl: paeResult.file.url,
          status: 'PENDING_ANALYSIS',
          internshipId: internship.id,
        },
      });

      // Criar documento de seguro (sempre, mesmo se não enviado)
      const insuranceFile = formData.get('insurance') as File | null;
      
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
      } else {
        await tx.document.create({
          data: {
            type: 'LIFE_INSURANCE',
            status: 'PENDING_ANALYSIS',
            internshipId: internship.id,
          },
        });
      }

      return internship;
    });

    return createSuccessResponse(newInternship, 201);
    
  } else {
    // Estágio Direto - dados já foram validados acima
    const newInternship = await prisma.$transaction(async (tx) => {
      const internship = await tx.internship.create({
        data: {
          ...validation.data,
          type: InternshipType.DIRECT,
          studentId: studentProfile.id,
          hasDetailedInfo: true,
        },
      });

      // Criar documento de seguro (sempre, mesmo se não enviado)
      const insuranceFile = formData.get('insurance') as File | null;
      
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
      } else {
        // Se não enviado, criar documento pendente sem arquivo
        await tx.document.create({
          data: {
            type: 'LIFE_INSURANCE',
            status: 'PENDING_ANALYSIS',
            internshipId: internship.id,
          },
        });
      }

      return internship;
    });

    return createSuccessResponse(newInternship, 201);
  }
}

export const POST = withErrorHandling(withLogging(createInternship));
