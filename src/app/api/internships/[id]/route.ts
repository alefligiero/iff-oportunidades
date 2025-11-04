import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient, Role, Gender, Course, InternshipModality } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateInternshipSchema = z.object({
  studentGender: z.nativeEnum(Gender),
  studentAddressStreet: z.string().min(1, 'O endereço é obrigatório.'),
  studentAddressNumber: z.string().min(1, 'O número é obrigatório.'),
  studentAddressDistrict: z.string().min(1, 'O bairro é obrigatório.'),
  studentAddressCityState: z.string().min(1, 'A cidade/estado é obrigatória.'),
  studentAddressCep: z.string().min(1, 'O CEP é obrigatório.'),
  studentPhone: z.string().min(1, 'O telefone é obrigatório.'),
  studentCpf: z.string().min(1, 'O CPF é obrigatório.'),
  studentCourse: z.nativeEnum(Course),
  studentCoursePeriod: z.string().min(1, 'O período é obrigatório.'),
  studentSchoolYear: z.string().min(1, 'O ano letivo é obrigatório.'),
  companyName: z.string().min(1, 'O nome da empresa é obrigatório.'),
  companyCnpj: z.string().min(1, 'O CNPJ da empresa é obrigatório.'),
  companyRepresentativeName: z.string().min(1, 'O nome do representante é obrigatório.'),
  companyRepresentativeRole: z.string().min(1, 'O cargo do representante é obrigatório.'),
  companyAddressStreet: z.string().min(1, 'O endereço da empresa é obrigatório.'),
  companyAddressNumber: z.string().min(1, 'O número da empresa é obrigatório.'),
  companyAddressDistrict: z.string().min(1, 'O bairro da empresa é obrigatório.'),
  companyAddressCityState: z.string().min(1, 'A cidade/estado da empresa é obrigatória.'),
  companyAddressCep: z.string().min(1, 'O CEP da empresa é obrigatório.'),
  companyEmail: z.string().email('O e-mail da empresa é inválido.'),
  companyPhone: z.string().min(1, 'O telefone da empresa é obrigatório.'),
  modality: z.nativeEnum(InternshipModality),
  startDate: z.coerce.date({ required_error: 'A data de início é obrigatória.' }),
  endDate: z.coerce.date({ required_error: 'A data de término é obrigatória.' }),
  weeklyHours: z.coerce.number().min(10).max(30, 'A carga horária semanal deve ser entre 10 e 30 horas.'),
  dailyHours: z.string().min(1, 'A jornada diária é obrigatória.'),
  monthlyGrant: z.coerce.number().min(0, 'O valor da bolsa não pode ser negativo.'),
  transportationGrant: z.coerce.number().min(0, 'O valor do auxílio não pode ser negativo.'),
  advisorProfessorName: z.string().min(1, 'O nome do professor orientador é obrigatório.'),
  advisorProfessorId: z.string().min(1, 'A matrícula do professor é obrigatória.'),
  supervisorName: z.string().min(1, 'O nome do supervisor é obrigatório.'),
  supervisorRole: z.string().min(1, 'O cargo do supervisor é obrigatório.'),
  internshipSector: z.string().min(1, 'O setor do estágio é obrigatório.'),
  technicalActivities: z.string().min(1, 'As atividades técnicas são obrigatórias.'),
  insuranceCompany: z.string().min(1, 'O nome da seguradora é obrigatório.'),
  insurancePolicyNumber: z.string().min(1, 'O número da apólice é obrigatório.'),
  insuranceCompanyCnpj: z.string().min(1, 'O CNPJ da seguradora é obrigatório.'),
  insuranceStartDate: z.coerce.date({ required_error: 'A data de início da vigência é obrigatória.' }),
  insuranceEndDate: z.coerce.date({ required_error: 'A data de fim da vigência é obrigatória.' }),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: internshipId } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as Role;

    if (!userId) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 401 });
    }

    // Buscar o estágio
    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
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
      return NextResponse.json({ error: 'Estágio não encontrado.' }, { status: 404 });
    }

    // Verificar permissões: apenas o próprio aluno ou admin pode ver
    if (userRole !== 'ADMIN' && internship.student.userId !== userId) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    return NextResponse.json(internship);

  } catch (error) {
    console.error('Erro ao buscar detalhes do estágio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: internshipId } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as Role;

    if (!userId || userRole !== 'STUDENT') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const existingInternship = await prisma.internship.findFirst({
        where: {
            id: internshipId,
            student: {
                userId: userId
            }
        }
    });

    if (!existingInternship) {
        return NextResponse.json({ error: 'Estágio não encontrado ou não pertence a este utilizador.' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateInternshipSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const updatedData = validation.data;

    const updatedInternship = await prisma.internship.update({
      where: { id: internshipId },
      data: {
        ...updatedData,
        status: 'IN_ANALYSIS', 
        rejectionReason: null,
      },
    });

    return NextResponse.json(updatedInternship, { status: 200 });

  } catch (error: unknown) {
    console.error('Erro ao atualizar estágio:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
