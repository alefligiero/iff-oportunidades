import { NextRequest } from 'next/server';
import { InternshipStatus } from '@prisma/client';
import { createErrorResponse } from '@/lib/api-response';
import { getCourseNameMap } from '@/lib/courses';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { prisma } from '@/lib/prisma';
import {
  buildTceFileBaseName,
  buildTceTemplateData,
  convertDocxBufferToPdf,
  generateTceDocxBuffer,
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
        include: {
          student: {
            include: {
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

    if (internship.status !== InternshipStatus.APPROVED) {
      return createErrorResponse('O TCE/PAE só pode ser gerado para estágios aprovados', 400);
    }

    const format = request.nextUrl.searchParams.get('format') === 'docx' ? 'docx' : 'pdf';
    const templateData = await buildTceTemplateData(internship, courseNameMap);
    const docxBuffer = await generateTceDocxBuffer(templateData);
    const fileBaseName = buildTceFileBaseName(internship.student?.name);

    if (format === 'docx') {
      return new Response(docxBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${fileBaseName}.docx"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    try {
      const pdfBuffer = await convertDocxBufferToPdf(docxBuffer, fileBaseName);

      return new Response(pdfBuffer, {
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
    console.error('Erro ao gerar documento de estágio:', error);

    if (error instanceof Error && error.message.includes('Token')) {
      return createErrorResponse('Token inválido ou expirado', 401);
    }

    return createErrorResponse('Erro ao gerar documento de estágio', 500);
  }
}