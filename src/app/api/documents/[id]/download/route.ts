import { NextRequest } from 'next/server';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { createErrorResponse } from '@/lib/api-response';
import { fileExists } from '@/lib/file-upload';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/documents/[id]/download
 * Download de um documento específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // Autenticação
    const userPayload = await getUserFromToken(request);
    if (!userPayload) {
      return createErrorResponse('Não autenticado', 401);
    }

    // Buscar documento com informações do estágio
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        internship: {
          include: {
            student: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!document) {
      return createErrorResponse('Documento não encontrado', 404);
    }

    // Verificar permissão: aluno dono ou admin
    if (
      userPayload.role !== 'ADMIN' &&
      document.internship.student.userId !== userPayload.userId
    ) {
      return createErrorResponse('Você não tem permissão para acessar este documento', 403);
    }

    // Verificar se arquivo existe
    if (!document.fileUrl) {
      return createErrorResponse('Arquivo não disponível', 404);
    }

    // Construir caminho completo do arquivo
    const filename = document.fileUrl.replace('/uploads/documents/', '');
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'documents', filename);

    if (!fileExists(filePath)) {
      return createErrorResponse('Arquivo não encontrado no servidor', 404);
    }

    // Ler arquivo
    const fileBuffer = fs.readFileSync(filePath);

    // Determinar tipo MIME
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    }

    // Retornar arquivo com headers apropriados
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    console.error('Erro ao fazer download de documento:', error);

    if (error instanceof Error && error.message.includes('Token')) {
      return createErrorResponse(error.message, 401);
    }

    return createErrorResponse('Erro ao processar download', 500);
  }
}
