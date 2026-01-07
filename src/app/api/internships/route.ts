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

  // Processar FormData
  const formData = await request.formData();
  const type = formData.get('type') as InternshipType;

  if (!type || !Object.values(InternshipType).includes(type)) {
    return createErrorResponse('Tipo de estágio inválido', 400);
  }

  if (type === InternshipType.INTEGRATOR) {
    // Via Agente Integrador - apenas uploads TCE e PAE
    const tceFile = formData.get('tce') as File | null;
    const paeFile = formData.get('pae') as File | null;

    if (!tceFile || !paeFile) {
      return createErrorResponse('TCE e PAE são obrigatórios para estágios via Agente Integrador', 400);
    }

    // Criar internship simplificado
    const newInternship = await prisma.$transaction(async (tx) => {
      const internship = await tx.internship.create({
        data: {
          type: InternshipType.INTEGRATOR,
          studentId: studentProfile.id,
          
          // Dados mínimos obrigatórios do schema (vazios para integrador)
          studentGender: studentProfile.gender || 'MALE',
          studentCpf: studentProfile.cpf || '00000000000',
          studentPhone: '00000000000',
          studentAddressStreet: '-',
          studentAddressNumber: '-',
          studentAddressDistrict: '-',
          studentAddressCityState: '-',
          studentAddressCep: '00000000',
          studentCourse: studentProfile.course || 'BSI',
          studentCoursePeriod: '1',
          studentSchoolYear: new Date().getFullYear().toString(),
          
          companyName: '-',
          companyCnpj: '00000000000000',
          companyRepresentativeName: '-',
          companyRepresentativeRole: '-',
          companyAddressStreet: '-',
          companyAddressNumber: '-',
          companyAddressDistrict: '-',
          companyAddressCityState: '-',
          companyAddressCep: '00000000',
          companyEmail: '-',
          companyPhone: '00000000000',
          
          modality: 'PRESENCIAL',
          startDate: new Date(),
          endDate: new Date(),
          weeklyHours: 0,
          dailyHours: '-',
          monthlyGrant: 0,
          transportationGrant: 0,
          
          advisorProfessorName: '-',
          advisorProfessorId: '-',
          supervisorName: '-',
          supervisorRole: '-',
          internshipSector: '-',
          technicalActivities: '-',
          
          insuranceCompany: '-',
          insurancePolicyNumber: '-',
          insuranceCompanyCnpj: '00000000000000',
          insuranceStartDate: new Date(),
          insuranceEndDate: new Date(),
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

      return internship;
    });

    return createSuccessResponse(newInternship, 201);
    
  } else {
    // Estágio Direto - dados completos
    const dataString = formData.get('data') as string;
    if (!dataString) {
      return createErrorResponse('Dados do formulário não fornecidos', 400);
    }

    const internshipData = JSON.parse(dataString);
    
    // Validar dados
    const validation = validateRequestBody(createInternshipSchema, internshipData);
    if (!validation.success) {
      return validation.error;
    }

    const newInternship = await prisma.$transaction(async (tx) => {
      const internship = await tx.internship.create({
        data: {
          ...validation.data,
          type: InternshipType.DIRECT,
          studentId: studentProfile.id,
        },
      });

      // Criar documentos TCE e PAE pendentes
      await tx.document.createMany({
        data: [
          { type: 'TCE', internshipId: internship.id, status: 'PENDING_ANALYSIS' },
          { type: 'PAE', internshipId: internship.id, status: 'PENDING_ANALYSIS' },
        ],
      });

      // Upload opcional de seguro
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
      }

      return internship;
    });

    return createSuccessResponse(newInternship, 201);
  }
}

export const POST = withErrorHandling(withLogging(createInternship));
