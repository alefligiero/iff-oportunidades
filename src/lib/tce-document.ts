import { execFile } from 'child_process';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Docxtemplater from 'docxtemplater';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import PizZip from 'pizzip';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const TEMPLATE_PATH = join(process.cwd(), 'public/templates/TCE PAE.docx');
type TemplateValue = string | boolean;

export class PdfConversionUnavailableError extends Error {
  constructor(message = 'Conversão para PDF indisponível no servidor.') {
    super(message);
    this.name = 'PdfConversionUnavailableError';
  }
}

function formatDateBR(value: Date | string | null | undefined) {
  if (!value) return '';
  return format(new Date(value), 'dd/MM/yyyy');
}

function formatLongDateBR(value: Date) {
  return format(value, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function formatCurrencyBR(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCNPJ(value: string | null | undefined) {
  const digits = (value ?? '').replace(/\D/g, '');

  if (digits.length !== 14) {
    return value ?? '';
  }

  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function getInternshipTypeLabel(internship: Record<string, any>) {
  if (internship.type === 'INTEGRATOR') {
    return 'Agente Integrador';
  }

  return 'Estágio Direto';
}

export async function buildTceTemplateData(
  internship: Record<string, any>,
  courseNameMap: Record<string, string>
) {
  const studentName = internship.student?.name ?? '';
  const studentMatricula = internship.student?.matricula ?? '';
  const advisorName = internship.advisorProfessorName ?? '';
  const advisorId = internship.advisorProfessorId ?? '';
  const emissionDate = internship.approvedAt ? new Date(internship.approvedAt) : new Date();
  const insuranceValidity = internship.insuranceStartDate && internship.insuranceEndDate
    ? `${formatDateBR(internship.insuranceStartDate)} a ${formatDateBR(internship.insuranceEndDate)}`
    : '';
  const courseName = courseNameMap[internship.studentCourse] ?? internship.studentCourse ?? '';
  const transportationValue = internship.modality === 'REMOTO'
    ? '( Estágio 100% Remoto )'
    : formatCurrencyBR(internship.transportationGrant);

  return {
    empresa: internship.companyName ?? '',
    cnpj: formatCNPJ(internship.companyCnpj),
    'endereco empresa': internship.companyAddressStreet ?? '',
    'bairro empresa': internship.companyAddressDistrict ?? '',
    'cidade/estado empresa': internship.companyAddressCityState ?? '',
    'cep empresa': internship.companyAddressCep ?? '',
    representante: internship.companyRepresentativeName ?? '',
    'cargo/funcao': internship.companyRepresentativeRole ?? '',
    'num empresa': internship.companyAddressNumber ?? '',
    'numero empresa': internship.companyAddressNumber ?? '',
    'nome do aluno': studentName,
    'endereco aluno': internship.studentAddressStreet ?? '',
    'num end aluno': internship.studentAddressNumber ?? '',
    'numero aluno': internship.studentAddressNumber ?? '',
    'bairro aluno': internship.studentAddressDistrict ?? '',
    'cidade/estado aluno': internship.studentAddressCityState ?? '',
    'cep aluno': internship.studentAddressCep ?? '',
    'tel aluno': internship.studentPhone ?? '',
    'email do aluno': internship.student?.user?.email ?? '',
    curso: courseName,
    'serie/período': internship.studentCoursePeriod ?? '',
    'semestre letivo': internship.studentSchoolYear ?? '',
    inicio: formatDateBR(internship.startDate),
    final: formatDateBR(internship.endDate),
    'tipo estagio': getInternshipTypeLabel(internship),
    'ch semanal': `${internship.weeklyHours ?? ''}h`,
    'jornada diaria': internship.dailyHours ?? '',
    'valor bolsa': formatCurrencyBR(internship.monthlyGrant),
    'valor aux transp': transportationValue,
    seguradora: internship.insuranceCompany ?? '',
    'cnpj seguradora': formatCNPJ(internship.insuranceCompanyCnpj),
    apolice: internship.insurancePolicyNumber ?? '',
    'vig seguro': insuranceValidity,
    orientador: advisorName,
    'matricula orientador': advisorId,
    supervisor: internship.supervisorName ?? '',
    'cargo supervisor': internship.supervisorRole ?? '',
    'setor estagio': internship.internshipSector ?? '',
    'plano de atividades': internship.technicalActivities ?? '',
    'matricula aluno': studentMatricula,
    'data emissao': formatLongDateBR(emissionDate),
    is_remote: internship.modality === 'REMOTO',
  };
}

export async function generateTceDocxBuffer(data: Record<string, TemplateValue>) {
  const content = await fs.readFile(TEMPLATE_PATH, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    delimiters: {
      start: '<',
      end: '>',
    },
    linebreaks: true,
    paragraphLoop: true,
    parser: (tag: string) => ({
      get: (scope: Record<string, TemplateValue>) => scope[tag] ?? '',
    }),
  });

  doc.render(data);

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  }) as Buffer;
}

async function tryConvertWithBinary(binary: string, docxPath: string, outputDir: string) {
  return execFileAsync(binary, [
    '--headless',
    '--convert-to',
    'pdf',
    '--outdir',
    outputDir,
    docxPath,
  ], {
    timeout: 60000,
    maxBuffer: 10 * 1024 * 1024,
  });
}

export async function convertDocxBufferToPdf(docxBuffer: Buffer, baseFileName: string) {
  const workingDir = await fs.mkdtemp(join(tmpdir(), 'iff-tce-'));
  const docxPath = join(workingDir, `${baseFileName}.docx`);
  const pdfPath = join(workingDir, `${baseFileName}.pdf`);

  try {
    await fs.writeFile(docxPath, docxBuffer);

    const configuredBinary = process.env.LIBREOFFICE_BIN;
    const binaries = configuredBinary ? [configuredBinary] : ['soffice', 'libreoffice'];

    let converted = false;

    for (const binary of binaries) {
      try {
        await tryConvertWithBinary(binary, docxPath, workingDir);
        converted = true;
        break;
      } catch (error: any) {
        if (error?.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    if (!converted) {
      throw new PdfConversionUnavailableError();
    }

    return await fs.readFile(pdfPath);
  } catch (error) {
    if (error instanceof PdfConversionUnavailableError) {
      throw error;
    }

    throw new Error('Falha ao converter o DOCX em PDF.');
  } finally {
    await fs.rm(workingDir, { recursive: true, force: true });
  }
}

export function buildTceFileBaseName(studentName: string | null | undefined) {
  const normalizedName = (studentName ?? 'aluno')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return `tce-pae-${normalizedName || 'aluno'}`;
}