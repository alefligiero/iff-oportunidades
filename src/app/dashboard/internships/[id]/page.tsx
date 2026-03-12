import Link from 'next/link';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient, InternshipStatus, InternshipType, InternshipModality, Gender, Course, DocumentType } from '@prisma/client';
import { redirect } from 'next/navigation';
import { getApprovedSubstatus, getInProgressSubstatus, getFinishedSubstatus, type DocumentSummary } from '@/lib/internship-substatus';
import RequestEarlyTermination from './RequestEarlyTermination';
import DocumentsSection from './DocumentsSection';
import NextStepsGuide from './NextStepsGuide';
import StatusProgress from './StatusProgress';
import InsuranceDataForm from './InsuranceDataForm';
import PeriodicReportsSection from './PeriodicReportsSection';

const prisma = new PrismaClient();

const statusMap = {
  [InternshipStatus.IN_ANALYSIS]: { text: 'Em Análise', color: 'bg-yellow-100 text-yellow-800' },
  [InternshipStatus.APPROVED]: { text: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
  [InternshipStatus.IN_PROGRESS]: { text: 'Em Andamento', color: 'bg-green-100 text-green-800' },
  [InternshipStatus.FINISHED]: { text: 'Finalizado', color: 'bg-gray-100 text-gray-800' },
  [InternshipStatus.REJECTED]: { text: 'Recusado', color: 'bg-red-100 text-red-800' },
  [InternshipStatus.CANCELED]: { text: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
};

const AUTO_CANCEL_NOTE = 'Cancelado automaticamente apos 7 dias em recusado sem correcoes.';

const typeMap = {
  [InternshipType.DIRECT]: 'Estágio Direto',
  [InternshipType.INTEGRATOR]: 'Agente Integrador',
};

const modalityMap = {
  [InternshipModality.PRESENCIAL]: 'Presencial',
  [InternshipModality.REMOTO]: 'Remoto',
};

const genderMap = {
  [Gender.MALE]: 'Masculino',
  [Gender.FEMALE]: 'Feminino',
};

const courseMap = {
  [Course.BSI]: 'Bacharelado em Sistemas de Informação',
  [Course.LIC_QUIMICA]: 'Licenciatura em Química',
  [Course.ENG_MECANICA]: 'Engenharia Mecânica',
  [Course.TEC_ADM_INTEGRADO]: 'Técnico em Administração Integrado',
  [Course.TEC_ELETRO_INTEGRADO]: 'Técnico em Eletrônica Integrado',
  [Course.TEC_INFO_INTEGRADO]: 'Técnico em Informática Integrado',
  [Course.TEC_QUIMICA_INTEGRADO]: 'Técnico em Química Integrado',
  [Course.TEC_AUTOMACAO_SUBSEQUENTE]: 'Técnico em Automação Subsequente',
  [Course.TEC_ELETRO_CONCOMITANTE]: 'Técnico em Eletrônica Concomitante',
  [Course.TEC_MECANICA_CONCOMITANTE]: 'Técnico em Mecânica Concomitante',
  [Course.TEC_QUIMICA_CONCOMITANTE]: 'Técnico em Química Concomitante',
};

async function getInternshipDetails(id: string) {
  const cookieStore = cookies();
  const token = (await cookieStore).get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const userRole = payload.role as string;

    const internship = await prisma.internship.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true
          }
        },
        documents: true
      }
    });

    if (!internship) {
      return { data: null, error: 'Estágio não encontrado.' };
    }

    // Verificar permissões
    if (userRole !== 'ADMIN' && internship.student.userId !== userId) {
      return { data: null, error: 'Acesso negado.' };
    }

    return { data: internship, error: null };

  } catch (error) {
    console.error('Erro ao buscar detalhes do estágio:', error);
    return { data: null, error: 'Erro interno do servidor.' };
  }
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const isDefaultValue = (value: any): boolean => {
  return value === '-' || value === 0 || value === '00000000000' || value === '00000000000000' || value === '00000000';
};

interface InternshipDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function InternshipDetailsPage({ params }: InternshipDetailsPageProps) {
  const { id } = await params;
  const { data: internship, error } = await getInternshipDetails(id);

  const initialDocuments = internship?.documents.map((doc) => ({
    id: doc.id,
    type: doc.type,
    status: doc.status,
    fileUrl: doc.fileUrl,
    rejectionComments: doc.rejectionComments,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  })) || [];

  const approvedSubstatus =
    internship?.status === InternshipStatus.APPROVED
      ? getApprovedSubstatus(internship.documents, internship.startDate, internship.insuranceRequired)
      : null;

  const lifeInsuranceDocument = internship?.documents.find(
    (doc) => doc.type === DocumentType.LIFE_INSURANCE
  );

  const inProgressSubstatus =
    internship?.status === InternshipStatus.IN_PROGRESS
      ? getInProgressSubstatus(internship.documents)
      : null;

  const finishedSubstatus =
    internship?.status === InternshipStatus.FINISHED
      ? getFinishedSubstatus(internship.documents)
      : null;

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <Link 
          href="/dashboard/internships" 
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          ← Voltar aos meus estágios
        </Link>
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Estágio não encontrado.</p>
        <Link 
          href="/dashboard/internships" 
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          ← Voltar aos meus estágios
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/dashboard/internships" 
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Voltar aos meus estágios
        </Link>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusMap[internship.status]?.color}`}>
            {statusMap[internship.status]?.text}
          </span>
          {approvedSubstatus && (
            <span className="text-xs text-gray-600">Aprovado - {approvedSubstatus}</span>
          )}
          {inProgressSubstatus && (
            <span className="text-xs text-gray-600">Em Andamento - {inProgressSubstatus}</span>
          )}
          {finishedSubstatus && (
            <span className="text-xs text-gray-600">Finalizado - {finishedSubstatus}</span>
          )}
          {internship.status === InternshipStatus.REJECTED && (
            <Link 
              href={`/dashboard/internships/edit/${internship.id}`}
              className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 text-sm"
            >
              Corrigir e Reenviar
            </Link>
          )}
          {internship.status === InternshipStatus.APPROVED && (
            <Link 
              href={`/dashboard/internships/${internship.id}/document`}
              target="_blank"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
            >
              <span>📄</span> Gerar Termo de Compromisso (PDF)
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <RequestEarlyTermination
          internshipId={internship.id}
          status={internship.status}
          earlyTerminationRequested={Boolean(internship.earlyTerminationRequested)}
          earlyTerminationApproved={internship.earlyTerminationApproved}
          earlyTerminationReason={internship.earlyTerminationReason}
          earlyTerminationHandledAt={internship.earlyTerminationHandledAt ? internship.earlyTerminationHandledAt.toISOString() : null}
          earlyTerminationRejectionReason={internship.earlyTerminationRejectionReason}
        />

        <StatusProgress status={internship.status} />

        <NextStepsGuide
          status={internship.status}
          documents={initialDocuments}
          insuranceRequired={internship.insuranceRequired}
        />

        {internship.insuranceRequired && <InsuranceDataForm
          internshipId={internship.id}
          currentData={{
            insuranceCompany: internship.insuranceCompany,
            insurancePolicyNumber: internship.insurancePolicyNumber,
            insuranceCompanyCnpj: internship.insuranceCompanyCnpj,
            insuranceStartDate: internship.insuranceStartDate,
            insuranceEndDate: internship.insuranceEndDate,
          }}
          status={internship.status}
          lifeInsuranceStatus={lifeInsuranceDocument?.status}
          lifeInsuranceRejectionComments={lifeInsuranceDocument?.rejectionComments ?? null}
        />}

        <DocumentsSection
          internshipId={internship.id}
          internshipType={internship.type}
          status={internship.status}
          initialDocuments={initialDocuments}
        />

        {(internship.status === InternshipStatus.IN_PROGRESS || internship.status === InternshipStatus.FINISHED) && (
          <PeriodicReportsSection
            internshipId={internship.id}
            internshipStatus={internship.status}
          />
        )}

        {/* Cabeçalho */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Estágio na {internship.companyName}
          </h1>
          <p className="text-gray-600">
            {formatDate(internship.startDate)} - {formatDate(internship.endDate)}
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Tipo:</span>
              <p className="text-gray-900">{typeMap[internship.type]}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Modalidade:</span>
              <p className="text-gray-900">{modalityMap[internship.modality]}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Carga Horária:</span>
              <p className="text-gray-900">{internship.weeklyHours}h/semana ({internship.dailyHours})</p>
            </div>
          </div>
        </div>

        {/* Conclusao / Rejeicao / Cancelamento */}
        {internship.status === InternshipStatus.FINISHED && internship.earlyTerminationReason && !internship.earlyTerminationRequested && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">Estágio concluído pelo Admin:</h3>
            <p className="text-blue-700 whitespace-pre-line">{internship.earlyTerminationReason}</p>
          </div>
        )}

        {internship.status === InternshipStatus.REJECTED && internship.rejectionReason && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <h3 className="font-medium text-red-800 mb-2">Motivo da Recusa:</h3>
            <p className="text-red-700 whitespace-pre-line">{internship.rejectionReason}</p>
          </div>
        )}

        {internship.status === InternshipStatus.CANCELED && internship.rejectionReason && (
          <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-md">
            <h3 className="font-medium text-gray-800 mb-2">
              {internship.rejectionReason.includes(AUTO_CANCEL_NOTE)
                ? 'Estágio cancelado automaticamente'
                : 'Estágio cancelado pelo Admin'}
              :
            </h3>
            <p className="text-gray-700 whitespace-pre-line">{internship.rejectionReason}</p>
          </div>
        )}

        {/* Informações do Aluno */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados do Aluno</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Nome:</span>
              <p className="text-gray-900">{internship.student.name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Matrícula:</span>
              <p className="text-gray-900">{internship.student.matricula}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Gênero:</span>
              <p className="text-gray-900">{genderMap[internship.studentGender]}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">CPF:</span>
              <p className="text-gray-900">{internship.studentCpf}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Telefone:</span>
              <p className="text-gray-900">{internship.studentPhone}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Curso:</span>
              <p className="text-gray-900">{courseMap[internship.studentCourse]}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Período:</span>
              <p className="text-gray-900">{internship.studentCoursePeriod}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Ano Letivo:</span>
              <p className="text-gray-900">{internship.studentSchoolYear}</p>
            </div>
          </div>
          
          <h3 className="text-md font-semibold text-gray-900 mt-6 mb-2">Endereço</h3>
          <p className="text-sm text-gray-900">
            {internship.studentAddressStreet}, {internship.studentAddressNumber} - {internship.studentAddressDistrict}<br />
            {internship.studentAddressCityState} - CEP: {internship.studentAddressCep}
          </p>
        </div>

        {/* Informações da Empresa */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados da Empresa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Nome:</span>
              <p className="text-gray-900">{internship.companyName}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">CNPJ:</span>
              <p className="text-gray-900">{internship.companyCnpj}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Representante:</span>
              <p className="text-gray-900">{internship.companyRepresentativeName} ({internship.companyRepresentativeRole})</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Telefone:</span>
              <p className="text-gray-900">{internship.companyPhone}</p>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-700">Email:</span>
              <p className="text-gray-900">{internship.companyEmail}</p>
            </div>
          </div>
          
          <h3 className="text-md font-semibold text-gray-900 mt-6 mb-2">Endereço</h3>
          <p className="text-sm text-gray-900">
            {internship.companyAddressStreet}, {internship.companyAddressNumber} - {internship.companyAddressDistrict}<br />
            {internship.companyAddressCityState} - CEP: {internship.companyAddressCep}
          </p>
        </div>

        {/* Detalhes do Estágio */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes do Estágio</h2>
          
          {internship.type === InternshipType.INTEGRATOR && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">📎 Informações do TCE:</span> Os detalhes do estágio estão contidos nos arquivos TCE que você enviou.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Setor:</span>
              <p className="text-gray-900">
                {internship.type === InternshipType.INTEGRATOR && isDefaultValue(internship.internshipSector) 
                  ? '📎 Informações do TCE' 
                  : internship.internshipSector}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Supervisor:</span>
              <p className="text-gray-900">
                {internship.type === InternshipType.INTEGRATOR && isDefaultValue(internship.supervisorName) 
                  ? '📎 Informações do TCE' 
                  : `${internship.supervisorName} (${internship.supervisorRole})`}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Professor Orientador:</span>
              <p className="text-gray-900">
                {internship.type === InternshipType.INTEGRATOR && isDefaultValue(internship.advisorProfessorName) 
                  ? '📎 Informações do TCE' 
                  : `${internship.advisorProfessorName} (SIAPE: ${internship.advisorProfessorId})`}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Bolsa:</span>
              <p className="text-gray-900">
                {internship.type === InternshipType.INTEGRATOR && internship.monthlyGrant === 0 
                  ? '📎 Informações do TCE' 
                  : formatCurrency(internship.monthlyGrant)}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Auxílio Transporte:</span>
              <p className="text-gray-900">
                {internship.type === InternshipType.INTEGRATOR && internship.transportationGrant === 0 
                  ? '📎 Informações do TCE' 
                  : formatCurrency(internship.transportationGrant)}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <span className="font-medium text-gray-700">Atividades Técnicas:</span>
            <p className="text-sm text-gray-900 mt-1">
              {internship.type === InternshipType.INTEGRATOR && isDefaultValue(internship.technicalActivities) 
                ? '📎 Informações do TCE' 
                : internship.technicalActivities}
            </p>
          </div>
        </div>

        {/* Seguro */}
        {internship.insuranceRequired && <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Seguro de Vida</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Seguradora:</span>
              <p className="text-gray-900">{internship.insuranceCompany}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">CNPJ da Seguradora:</span>
              <p className="text-gray-900">{internship.insuranceCompanyCnpj}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Número da Apólice:</span>
              <p className="text-gray-900">{internship.insurancePolicyNumber}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Vigência:</span>
              <p className="text-gray-900">
                {internship.insuranceStartDate && formatDate(internship.insuranceStartDate)} - {' '}
                {internship.insuranceEndDate && formatDate(internship.insuranceEndDate)}
              </p>
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}