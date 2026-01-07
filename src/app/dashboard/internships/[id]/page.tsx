import Link from 'next/link';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient, InternshipStatus, InternshipType, InternshipModality, Gender, Course } from '@prisma/client';
import { redirect } from 'next/navigation';
import RequestEarlyTermination from './RequestEarlyTermination';

const prisma = new PrismaClient();

const statusMap = {
  [InternshipStatus.IN_ANALYSIS]: { text: 'Em Análise', color: 'bg-yellow-100 text-yellow-800' },
  [InternshipStatus.APPROVED]: { text: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
  [InternshipStatus.IN_PROGRESS]: { text: 'Em Andamento', color: 'bg-green-100 text-green-800' },
  [InternshipStatus.FINISHED]: { text: 'Finalizado', color: 'bg-gray-100 text-gray-800' },
  [InternshipStatus.CANCELED]: { text: 'Recusado', color: 'bg-red-100 text-red-800' },
};

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
  return new Date(date).toLocaleDateString('pt-BR');
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

interface InternshipDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function InternshipDetailsPage({ params }: InternshipDetailsPageProps) {
  const { id } = await params;
  const { data: internship, error } = await getInternshipDetails(id);

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
          {internship.status === InternshipStatus.CANCELED && (
            <Link 
              href={`/dashboard/internships/edit/${internship.id}`}
              className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 text-sm"
            >
              Corrigir e Reenviar
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
        />

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

        {/* Rejeição */}
        {internship.status === InternshipStatus.CANCELED && internship.rejectionReason && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <h3 className="font-medium text-red-800 mb-2">Motivo da Recusa:</h3>
            <p className="text-red-700">{internship.rejectionReason}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Setor:</span>
              <p className="text-gray-900">{internship.internshipSector}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Supervisor:</span>
              <p className="text-gray-900">{internship.supervisorName} ({internship.supervisorRole})</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Professor Orientador:</span>
              <p className="text-gray-900">{internship.advisorProfessorName} (SIAPE: {internship.advisorProfessorId})</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Bolsa:</span>
              <p className="text-gray-900">{formatCurrency(internship.monthlyGrant)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Auxílio Transporte:</span>
              <p className="text-gray-900">{formatCurrency(internship.transportationGrant)}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <span className="font-medium text-gray-700">Atividades Técnicas:</span>
            <p className="text-sm text-gray-900 mt-1">{internship.technicalActivities}</p>
          </div>
        </div>

        {/* Seguro */}
        <div className="bg-white p-6 rounded-lg shadow-md">
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
        </div>
      </div>
    </div>
  );
}