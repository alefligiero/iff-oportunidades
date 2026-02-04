import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { jwtVerify } from 'jose';
import { PrismaClient, Role, Course, Gender, InternshipStatus } from '@prisma/client';
import ActionButtons from './ActionButtons';
import DocumentsModeration from './DocumentsModeration';
import AdminStatusProgress from './AdminStatusProgress';
import AdminActionGuide from './AdminActionGuide';
import AdminDocumentAlerts from './AdminDocumentAlerts';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

const statusMap = {
  [InternshipStatus.IN_ANALYSIS]: { text: 'Em Análise', color: 'bg-yellow-100 text-yellow-800' },
  [InternshipStatus.APPROVED]: { text: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
  [InternshipStatus.IN_PROGRESS]: { text: 'Em Andamento', color: 'bg-green-100 text-green-800' },
  [InternshipStatus.FINISHED]: { text: 'Finalizado', color: 'bg-gray-100 text-gray-800' },
  [InternshipStatus.CANCELED]: { text: 'Recusado', color: 'bg-red-100 text-red-800' },
};

const courseLabels: { [key in Course]: string } = {
  [Course.BSI]: 'Bacharelado em Sistemas de Informação',
  [Course.LIC_QUIMICA]: 'Licenciatura em Química',
  [Course.ENG_MECANICA]: 'Bacharelado em Engenharia Mecânica',
  [Course.TEC_ADM_INTEGRADO]: 'Técnico em Administração Integrado',
  [Course.TEC_ELETRO_INTEGRADO]: 'Técnico em Eletrotécnica Integrado',
  [Course.TEC_INFO_INTEGRADO]: 'Técnico em Informática Integrado',
  [Course.TEC_QUIMICA_INTEGRADO]: 'Técnico em Química Integrado',
  [Course.TEC_AUTOMACAO_SUBSEQUENTE]: 'Técnico em Automação Industrial Subsequente',
  [Course.TEC_ELETRO_CONCOMITANTE]: 'Técnico em Eletrotécnica Concomitante',
  [Course.TEC_MECANICA_CONCOMITANTE]: 'Técnico em Mecânica Concomitante',
  [Course.TEC_QUIMICA_CONCOMITANTE]: 'Técnico em Química Concomitante',
};

const genderLabels: { [key in Gender]: string } = {
  [Gender.MALE]: 'Masculino',
  [Gender.FEMALE]: 'Feminino',
};


async function getInternshipDetails(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) redirect('/');

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.role !== Role.ADMIN) redirect('/dashboard');

    const internship = await prisma.internship.findUnique({
      where: { id },
      include: {
        documents: true,
        student: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!internship) return null;
    
    return internship;

  } catch (error) {
    console.error("Erro ao buscar detalhes do estágio:", error);
    redirect('/dashboard/admin/internships');
  }
}

const DetailItem = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value || 'Não informado'}</dd>
    </div>
);

const formatDate = (date: Date) => new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

export default async function InternshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const internship = await getInternshipDetails(id);

  const initialDocuments = internship?.documents.map((doc) => ({
    id: doc.id,
    type: doc.type,
    status: doc.status,
    fileUrl: doc.fileUrl,
    rejectionComments: doc.rejectionComments,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  })) || [];

  if (!internship) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Estágio não encontrado</h1>
        <p className="mt-2">O estágio que você está a tentar visualizar não existe ou foi movido.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Detalhes da Formalização</h1>
        <div className="flex items-center space-x-4">
          <span className={`px-4 py-2 text-sm font-medium rounded-full ${statusMap[internship.status]?.color}`}>
            {statusMap[internship.status]?.text}
          </span>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md space-y-8">
        <AdminStatusProgress status={internship.status} />
        <AdminActionGuide status={internship.status} />
        <AdminDocumentAlerts status={internship.status} documents={initialDocuments} />

        <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ações de Moderação</h3>
            <p className="text-sm text-gray-600 mb-4">Reveja as informações abaixo e aprove ou recuse a solicitação de estágio.</p>
            <ActionButtons
              internshipId={internship.id}
              internshipStatus={internship.status}
              earlyTerminationRequested={Boolean(internship.earlyTerminationRequested)}
              earlyTerminationApproved={internship.earlyTerminationApproved}
              earlyTerminationReason={internship.earlyTerminationReason}
            />
        </div>

        <DocumentsModeration
          internshipId={internship.id}
          internshipStatus={internship.status}
          initialDocuments={initialDocuments}
        />

        <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Aluno</h3>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8">
                <DetailItem label="Nome Completo" value={internship.student.name} />
                <DetailItem label="Email" value={internship.student.user.email} />
                <DetailItem label="Matrícula" value={internship.student.matricula} />
                <DetailItem label="Gênero" value={genderLabels[internship.studentGender]} />
                <DetailItem label="CPF" value={internship.studentCpf} />
                <DetailItem label="Telefone" value={internship.studentPhone} />
                <DetailItem label="Endereço" value={`${internship.studentAddressStreet}, ${internship.studentAddressNumber}`} />
                <DetailItem label="Bairro" value={internship.studentAddressDistrict} />
                <DetailItem label="Cidade/Estado" value={internship.studentAddressCityState} />
                <DetailItem label="CEP" value={internship.studentAddressCep} />
                <DetailItem label="Curso" value={courseLabels[internship.studentCourse]} />
                <DetailItem label="Período" value={internship.studentCoursePeriod} />
                <DetailItem label="Ano Letivo" value={internship.studentSchoolYear} />
            </dl>
        </div>

        <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados da Empresa</h3>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8">
                <DetailItem label="Nome da Empresa" value={internship.companyName} />
                <DetailItem label="CNPJ" value={internship.companyCnpj} />
                <DetailItem label="Email de Contato" value={internship.companyEmail} />
                <DetailItem label="Telefone de Contato" value={internship.companyPhone} />
                <DetailItem label="Representante Legal" value={internship.companyRepresentativeName} />
                <DetailItem label="Cargo do Representante" value={internship.companyRepresentativeRole} />
                <DetailItem label="Endereço" value={`${internship.companyAddressStreet}, ${internship.companyAddressNumber}`} />
                <DetailItem label="Bairro" value={internship.companyAddressDistrict} />
                <DetailItem label="Cidade/Estado" value={internship.companyAddressCityState} />
                <DetailItem label="CEP" value={internship.companyAddressCep} />
            </dl>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes do Estágio</h3>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8">
                <DetailItem label="Modalidade" value={internship.modality} />
                <DetailItem label="Data de Início" value={formatDate(internship.startDate)} />
                <DetailItem label="Data Final" value={formatDate(internship.endDate)} />
                <DetailItem label="Carga Horária Semanal" value={`${internship.weeklyHours} horas`} />
                <DetailItem label="Jornada Diária" value={internship.dailyHours} />
                <DetailItem label="Bolsa Mensal" value={`R$ ${internship.monthlyGrant.toFixed(2)}`} />
                <DetailItem label="Auxílio Transporte" value={`R$ ${internship.transportationGrant.toFixed(2)}`} />
                <DetailItem label="Professor Orientador" value={internship.advisorProfessorName} />
                <DetailItem label="Matrícula do Orientador" value={internship.advisorProfessorId} />
                <DetailItem label="Supervisor do Estágio" value={internship.supervisorName} />
                <DetailItem label="Cargo do Supervisor" value={internship.supervisorRole} />
                <DetailItem label="Setor do Estágio" value={internship.internshipSector} />
            </dl>
             <div className="mt-8">
                <DetailItem label="Atividades Técnicas Previstas" value={internship.technicalActivities} />
            </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Seguro</h3>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8">
                <DetailItem label="Seguradora" value={internship.insuranceCompany} />
                <DetailItem label="Nº da Apólice" value={internship.insurancePolicyNumber} />
                <DetailItem label="CNPJ da Seguradora" value={internship.insuranceCompanyCnpj} />
                <DetailItem label="Vigência do Seguro" value={`${formatDate(internship.insuranceStartDate)} a ${formatDate(internship.insuranceEndDate)}`} />
            </dl>
        </div>

      </div>
    </div>
  );
}
