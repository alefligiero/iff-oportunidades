import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import mime from 'mime-types';

// Configurações de upload
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB em bytes
  ALLOWED_MIME_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png'],
  UPLOAD_DIR: path.join(process.cwd(), 'public', 'uploads', 'documents'),
};

// Tipos de retorno
export interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  url: string; // URL pública para acesso
}

export interface UploadError {
  error: string;
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'UPLOAD_FAILED' | 'NO_FILE';
}

/**
 * Valida se o tipo MIME do arquivo é permitido
 */
function isAllowedMimeType(mimeType: string): boolean {
  return UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Valida se a extensão do arquivo é permitida
 */
function isAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Gera nome único para o arquivo
 */
function generateUniqueFilename(originalName: string, internshipId: string, documentType: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const sanitizedType = documentType.toLowerCase();
  return `${internshipId}_${sanitizedType}_${timestamp}${ext}`;
}

/**
 * Garante que o diretório de upload existe
 */
function ensureUploadDirExists(): void {
  if (!fs.existsSync(UPLOAD_CONFIG.UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_CONFIG.UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Remove arquivo do sistema de arquivos
 */
export function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return false;
  }
}

/**
 * Processa o arquivo já extraído do FormData
 */
export async function processUploadedFile(
  fileField: File,
  internshipId: string,
  documentType: string
): Promise<{ file: UploadedFile } | UploadError> {
  ensureUploadDirExists();

  try {
    if (!fileField || !(fileField instanceof File)) {
      return {
        error: 'Nenhum arquivo foi enviado',
        code: 'NO_FILE',
      };
    }

    // Validar tamanho
    if (fileField.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      return {
        error: 'Arquivo muito grande. Tamanho máximo: 10MB',
        code: 'FILE_TOO_LARGE',
      };
    }

    // Validar tipo MIME
    const mimeType = fileField.type;
    if (!isAllowedMimeType(mimeType)) {
      return {
        error: 'Tipo de arquivo não permitido. Apenas PDF, JPEG e PNG são aceitos',
        code: 'INVALID_TYPE',
      };
    }

    // Validar extensão
    if (!isAllowedExtension(fileField.name)) {
      return {
        error: 'Extensão de arquivo não permitida',
        code: 'INVALID_TYPE',
      };
    }

    // Converter File para Buffer
    const buffer = await fileField.arrayBuffer();
    const filename = generateUniqueFilename(fileField.name, internshipId, documentType);
    const filepath = path.join(UPLOAD_CONFIG.UPLOAD_DIR, filename);

    // Salvar arquivo
    fs.writeFileSync(filepath, Buffer.from(buffer));

    // Gerar URL pública
    const publicUrl = `/uploads/documents/${filename}`;

    return {
      file: {
        filename,
        originalName: fileField.name,
        size: fileField.size,
        mimeType,
        path: filepath,
        url: publicUrl,
      },
    };
  } catch (error) {
    console.error('Erro ao processar upload:', error);
    return {
      error: 'Erro ao processar upload do arquivo',
      code: 'UPLOAD_FAILED',
    };
  }
}

/**
 * Valida se um arquivo existe no sistema
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Obtém informações de um arquivo
 */
export function getFileInfo(filePath: string): { size: number; mimeType: string } | null {
  try {
    if (!fileExists(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';

    return {
      size: stats.size,
      mimeType,
    };
  } catch (error) {
    console.error('Erro ao obter informações do arquivo:', error);
    return null;
  }
}
