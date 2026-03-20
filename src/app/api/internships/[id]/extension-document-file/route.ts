import { NextRequest } from 'next/server';
import { InternshipType } from '@prisma/client';
import { createErrorResponse } from '@/lib/api-response';
import { getCourseNameMap } from '@/lib/courses';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { prisma } from '@/lib/prisma';
import {
  buildTceAddendumFileBaseName,
  buildTceAddendumTemplateData,
  convertDocxBufferToPdf,
  generateTceAddendumDocxBuffer,
  PdfConversionUnavailableError,
} from '@/lib/tce-document';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: internshipId } = await params;
    const userPayload = await getUserFromToken(request);

    const [internship, courseNameMap] = await Promise.all([
      prisma.internship.findUnique({
        where: { id: internshipId },
        select: {
          id: true,
          type: true,
          companyName: true,
          startDate: true,
          endDate: true,
          internshipExtensionApproved: true,
          internshipExtensionStartDate: true,
          internshipExtensionEndDate: true,
          advisorProfessorName: true,
          advisorProfessorId: true,
          approvedAt: true,
          insuranceStartDate: true,
          insuranceEndDate: true,
          studentCourse: true,
          modality: true,
          transportationGrant: true,
          companyCnpj: true,
          companyAddressStreet: true,
          companyAddressDistrict: true,
          companyAddressCityState: true,
          companyAddressCep: true,
          companyRepresentativeName: true,
          companyRepresentativeRole: true,
          companyAddressNumber: true,
          studentAddressStreet: true,
          studentAddressNumber: true,
          studentAddressDistrict: true,
          studentAddressCityState: true,
          studentAddressCep: true,
          studentPhone: true,
          studentCoursePeriod: true,
          studentSchoolYear: true,
          weeklyHours: true,
          dailyHours: true,
          monthlyGrant: true,
          insuranceCompany: true,
          insuranceCompanyCnpj: true,
          insurancePolicyNumber: true,
          supervisorName: true,
          supervisorRole: true,
          internshipSector: true,
          technicalActivities: true,
          student: {
            select: {
              userId: true,
              name: true,
              matricula: true,
              user: true,
            },
          },
        },
      }),
      getCourseNameMap(true),
    ]);

    if (!internship) {
      return createErrorResponse('Estágio não encontrado', 404);
    }

    if (userPayload.role !== 'ADMIN' && userPayload.userId !== internship.student.userId) {
      return createErrorResponse('Sem permissão para acessar este estágio', 403);
    }

    if (internship.type !== InternshipType.DIRECT) {
      return createErrorResponse('O TCE Aditivo oficial é gerado apenas para estágios diretos', 400);
    }

    if (internship.internshipExtensionApproved !== true) {
      return createErrorResponse('O TCE Aditivo só pode ser gerado após aprovação da prorrogação', 400);
    }

    if (!internship.internshipExtensionStartDate || !internship.internshipExtensionEndDate) {
      return createErrorResponse('Período da prorrogação não definido', 400);
    }

    const format = request.nextUrl.searchParams.get('format') === 'docx' ? 'docx' : 'pdf';
    const templateData = await buildTceAddendumTemplateData(internship, courseNameMap);
    const docxBuffer = await generateTceAddendumDocxBuffer(templateData);
    const fileBaseName = buildTceAddendumFileBaseName(internship.student?.name);

    if (format === 'docx') {
      return new Response(Uint8Array.from(docxBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${fileBaseName}.docx"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    try {
      const pdfBuffer = await convertDocxBufferToPdf(docxBuffer, fileBaseName);

      return new Response(Uint8Array.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileBaseName}.pdf"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } catch (error) {
      if (error instanceof PdfConversionUnavailableError) {
        return createErrorResponse(error.message, 503);
      }

      throw error;
    }
  } catch (error: unknown) {
    console.error('Erro ao gerar TCE Aditivo oficial:', error);

    if (error instanceof Error && error.message.includes('Token')) {
      return createErrorResponse('Token inválido ou expirado', 401);
    }

    return createErrorResponse('Erro ao gerar TCE Aditivo oficial', 500);
  }
}
