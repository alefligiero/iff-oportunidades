import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

// Configurações de upload
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB em bytes
};

/**
 * Pasta onde os documentos enviados são gravados.
 * Fica FORA de `public/` de propósito: os arquivos só podem ser lidos pela rota
 * autenticada `/api/documents/[id]/download`, nunca por uma URL estática.
 * Pode ser trocada pela variável de ambiente UPLOAD_DIR (caminho absoluto ou relativo ao cwd).
 */
export function getUploadDir(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  return configured
    ? path.resolve(process.cwd(), configured)
    : path.join(process.cwd(), 'storage', 'documents');
}

/**
 * Converte o `fileUrl` guardado no banco no caminho real do arquivo em disco.
 * O `fileUrl` (ex.: `/uploads/documents/nome.pdf`) é só um identificador do arquivo,
 * não uma URL pública. Usa apenas o nome do arquivo para impedir path traversal.
 */
export function resolveStoredFilePath(fileUrl: string): string {
  return path.join(getUploadDir(), path.basename(fileUrl));
}

/**
 * Remove do disco o arquivo referenciado por um `fileUrl` do banco.
 */
export function deleteStoredFile(fileUrl: string): boolean {
  return deleteFile(resolveStoredFilePath(fileUrl));
}

// Tipos de retorno
export interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  url: string; // Identificador gravado em Document.fileUrl; o acesso é pela rota de download
}

export interface UploadError {
  error: string;
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'UPLOAD_FAILED' | 'NO_FILE';
}

interface AllowedFileTypes {
  mimeTypes: string[];
  extensions: string[];
  description: string;
}

const PDF_ONLY: AllowedFileTypes = {
  mimeTypes: ['application/pdf'],
  extensions: ['.pdf'],
  description: 'Apenas arquivos PDF são aceitos',
};

// O comprovante de seguro pode ser uma foto ou captura da apólice.
const PDF_OR_IMAGE: AllowedFileTypes = {
  mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
  description: 'Apenas PDF, JPEG e PNG são aceitos',
};

/**
 * Define os formatos aceitos para cada tipo de documento:
 * PDF para todos, exceto o comprovante de seguro de vida (PDF, JPEG ou PNG).
 */
export function getAllowedFileTypes(documentType: string): AllowedFileTypes {
  return documentType === 'LIFE_INSURANCE' ? PDF_OR_IMAGE : PDF_ONLY;
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
  const uploadDir = getUploadDir();
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
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

    const allowedTypes = getAllowedFileTypes(documentType);

    // Validar tipo MIME
    const mimeType = fileField.type;
    if (!allowedTypes.mimeTypes.includes(mimeType)) {
      return {
        error: `Tipo de arquivo não permitido. ${allowedTypes.description}`,
        code: 'INVALID_TYPE',
      };
    }

    // Validar extensão
    const extension = path.extname(fileField.name).toLowerCase();
    if (!allowedTypes.extensions.includes(extension)) {
      return {
        error: 'Extensão de arquivo não permitida',
        code: 'INVALID_TYPE',
      };
    }

    // Converter File para Buffer
    const buffer = await fileField.arrayBuffer();
    const filename = generateUniqueFilename(fileField.name, internshipId, documentType);
    const filepath = path.join(getUploadDir(), filename);

    // Salvar arquivo
    fs.writeFileSync(filepath, Buffer.from(buffer));

    // Mantém o prefixo histórico para não exigir migração dos registros existentes
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
