import { PrismaClient, Role, VacancyType, VacancyStatus, VacancyModality } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

const Course = {
  BSI: 'BSI',
  LIC_QUIMICA: 'LIC_QUIMICA',
  ENG_MECANICA: 'ENG_MECANICA',
  TEC_ADM_INTEGRADO: 'TEC_ADM_INTEGRADO',
  TEC_ELETRO_INTEGRADO: 'TEC_ELETRO_INTEGRADO',
  TEC_INFO_INTEGRADO: 'TEC_INFO_INTEGRADO',
  TEC_QUIMICA_INTEGRADO: 'TEC_QUIMICA_INTEGRADO',
  TEC_AUTOMACAO_SUBSEQUENTE: 'TEC_AUTOMACAO_SUBSEQUENTE',
  TEC_ELETRO_CONCOMITANTE: 'TEC_ELETRO_CONCOMITANTE',
  TEC_MECANICA_CONCOMITANTE: 'TEC_MECANICA_CONCOMITANTE',
  TEC_QUIMICA_CONCOMITANTE: 'TEC_QUIMICA_CONCOMITANTE',
} as const;

// Helper para copiar PDF de exemplo e gerar nome único
async function copyExamplePdf(internshipId: string, documentType: string): Promise<string | null> {
  try {
    const samplePdfPath = path.join(process.cwd(), 'public/templates/sample-document.pdf');
    const uploadsDir = path.join(process.cwd(), 'public/uploads/documents');

    // Verificar se o arquivo de exemplo existe
    try {
      await fs.access(samplePdfPath);
    } catch {
      console.warn('⚠️  PDF de exemplo não encontrado em:', samplePdfPath);
      return null;
    }

    // Garantir que o diretório de uploads existe
    await fs.mkdir(uploadsDir, { recursive: true });

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const filename = `${internshipId}_${documentType}_${timestamp}.pdf`;
    const destPath = path.join(uploadsDir, filename);

    // Copiar arquivo
    await fs.copyFile(samplePdfPath, destPath);

    // Retornar caminho relativo para armazenar no banco
    return `/uploads/documents/${filename}`;
  } catch (error) {
    console.error('❌ Erro ao copiar PDF de exemplo:', error);
    return null;
  }
}

async function main() {
  console.log('🌱 Iniciando o seed...');

  const adminSeedEmail = process.env.ADMIN_SEED_EMAIL?.trim();
  const adminSeedPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!adminSeedEmail || !adminSeedPassword) {
    throw new Error('Defina ADMIN_SEED_EMAIL e ADMIN_SEED_PASSWORD no ambiente para executar o seed.');
  }

  const autoCancelNote = 'Cancelado automaticamente apos 7 dias em recusado sem correcoes.';
  const autoCloseNote = 'Fechada automaticamente apos 7 dias em rejeitada sem correcoes.';

  // Limpar dados existentes
  await prisma.document.deleteMany({});
  await prisma.internship.deleteMany({});
  await prisma.jobVacancy.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🗑️  Dados anteriores removidos');

  const defaultPassword = await bcrypt.hash('123456', 10);
  const adminPassword = await bcrypt.hash(adminSeedPassword, 10);

  // 1. Admin
  const adminUser = await prisma.user.create({
    data: {
      email: adminSeedEmail,
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log('👨‍💼 Admin criado:', adminUser.email);

  // 2. Estudante com estágio EM ANÁLISE
  const student1 = await prisma.user.create({
    data: {
      email: 'joao.silva@estudante.iff.edu.br',
      password: defaultPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          name: 'João Silva dos Santos',
          matricula: '20241001',
        },
      },
    },
  });

  // 3. Estudante com estágio APROVADO
  const student2 = await prisma.user.create({
    data: {
      email: 'maria.oliveira@estudante.iff.edu.br',
      password: defaultPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          name: 'Maria Oliveira Costa',
          matricula: '20241002',
        },
      },
    },
  });

  // 4. Estudante com estágio EM ANDAMENTO
  const student3 = await prisma.user.create({
    data: {
      email: 'pedro.santos@estudante.iff.edu.br',
      password: defaultPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          name: 'Pedro Santos Almeida',
          matricula: '20241003',
        },
      },
    },
  });

  // 5. Estudante com estágio FINALIZADO
  const student4 = await prisma.user.create({
    data: {
      email: 'ana.costa@estudante.iff.edu.br',
      password: defaultPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          name: 'Ana Costa Ferreira',
          matricula: '20241004',
        },
      },
    },
  });

  // 6. Estudante com estágio RECUSADO
  const student5 = await prisma.user.create({
    data: {
      email: 'lucas.lima@estudante.iff.edu.br',
      password: defaultPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          name: 'Lucas Lima Rodrigues',
          matricula: '20241005',
        },
      },
    },
  });

  // 7. Estudante com estágio EM ANÁLISE
  const student6 = await prisma.user.create({
    data: {
      email: 'carla.mendes@estudante.iff.edu.br',
      password: defaultPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          name: 'Carla Mendes Souza',
          matricula: '20241006',
        },
      },
    },
  });

  // 8. Estudante com estágio RECÉM FINALIZADO (para testar documentos finais)
  const student7 = await prisma.user.create({

    data: {
      email: 'bruno.oliveira@estudante.iff.edu.br',
      password: defaultPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          name: 'Bruno Oliveira Nascimento',
          matricula: '20241007',
        },
      },
    },
  });

  // 9. Estudante com estágio REJEITADO (aguardando correção)
  const student8 = await prisma.user.create({
    data: {
      email: 'rafaela.lima@estudante.iff.edu.br',
      password: defaultPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          name: 'Rafaela Lima Barbosa',
          matricula: '20241008',
        },
      },
    },
  });

  // 10. Estudante com estágio EM ANÁLISE e documento em análise
  const student9 = await prisma.user.create({
    data: {
      email: 'gabriel.ferreira@estudante.iff.edu.br',
      password: defaultPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          name: 'Gabriel Ferreira Nunes',
          matricula: '20241009',
        },
      },
    },
  });

  // 11. Estudante com estágio EM ANDAMENTO com extensão solicitada
  const student10 = await prisma.user.create({
    data: {
      email: 'isabela.santos@estudante.iff.edu.br',
      password: defaultPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          name: 'Isabela Santos Gomes',
          matricula: '20241010',
        },
      },
    },
  });

  // 12. Estudante com estágio APROVADO via agente integrador
  const student11 = await prisma.user.create({
    data: {
      email: 'matheus.cardoso@estudante.iff.edu.br',
      password: defaultPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          name: 'Matheus Cardoso Pinto',
          matricula: '20241011',
        },
      },
    },
  });

  // 13. Estudante com estágio EM ANDAMENTO com rescisão antecipada solicitada
  const student12 = await prisma.user.create({
    data: {
      email: 'larissa.monteiro@estudante.iff.edu.br',
      password: defaultPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          name: 'Larissa Monteiro Dias',
          matricula: '20241012',
        },
      },
    },
  });

  console.log('🎓 Estudantes criados');

  // Empresas
  const company1 = await prisma.user.create({
    data: {
      email: 'rh@techcorp.com.br',
      password: defaultPassword,
      role: Role.COMPANY,
      companyProfile: {
        create: {
          name: 'TechCorp Soluções Ltda',
          cnpj: '12.345.678/0001-90',
          location: 'Campos dos Goytacazes, RJ',
          description: 'Empresa de tecnologia especializada em desenvolvimento de software.',
        },
      },
    },
    include: { companyProfile: true },
  });

  const company2 = await prisma.user.create({
    data: {
      email: 'contato@agrosul.com.br',
      password: defaultPassword,
      role: Role.COMPANY,
      companyProfile: {
        create: {
          name: 'AgroSul Tecnologia Agrícola',
          cnpj: '98.765.432/0001-10',
          location: 'Itaperuna, RJ',
          description: 'Soluções digitais para o agronegócio e gestão de produção.',
        },
      },
    },
    include: { companyProfile: true },
  });

  const company3 = await prisma.user.create({
    data: {
      email: 'recrutamento@medicore.com.br',
      password: defaultPassword,
      role: Role.COMPANY,
      companyProfile: {
        create: {
          name: 'MediCore Sistemas de Saude',
          cnpj: '45.123.987/0001-55',
          location: 'Niteroi, RJ',
          description: 'Plataformas para gestao hospitalar e prontuarios eletrônicos.',
        },
      },
    },
    include: { companyProfile: true },
  });

  const company4 = await prisma.user.create({
    data: {
      email: 'jobs@brisklog.com.br',
      password: defaultPassword,
      role: Role.COMPANY,
      companyProfile: {
        create: {
          name: 'BriskLog Logistica Inteligente',
          cnpj: '27.654.321/0001-88',
          location: 'Rio de Janeiro, RJ',
          description: 'Operacao logística com foco em automacao e dados.',
        },
      },
    },
    include: { companyProfile: true },
  });

  console.log('🏢 Empresas criadas:', company1.email, company2.email, company3.email, company4.email);

  if (company1.companyProfile && company2.companyProfile && company3.companyProfile && company4.companyProfile) {
    await prisma.jobVacancy.createMany({
      data: [
        // --- Vagas adicionais ---
        {
          title: 'Desenvolvedor Full Stack Júnior',
          description: 'Vaga efetiva para recém-formado atuar no desenvolvimento de sistemas internos.',
          type: VacancyType.JOB,
          status: VacancyStatus.APPROVED,
          companyId: company1.companyProfile.id,
          remuneration: 2500,
          workload: 40,
          benefits: 'Plano de saúde, VR, VT',
          contactInfo: 'rh@techcorp.com.br',
          eligibleCourses: [Course.BSI],
          modality: VacancyModality.HIBRIDO,
          responsibilities: 'Desenvolver e manter sistemas web full stack, participar de code reviews.',
          softSkills: 'Proatividade, organização, comunicação',
          technicalSkills: 'React, Node.js, PostgreSQL, Docker',
        },
        {
          title: 'Estágio em Engenharia de Automação',
          description: 'Apoio à equipe de automação industrial no desenvolvimento de CLP e IHM.',
          type: VacancyType.INTERNSHIP,
          status: VacancyStatus.APPROVED,
          companyId: company2.companyProfile.id,
          remuneration: 900,
          workload: 25,
          benefits: 'Auxílio alimentação e transporte',
          contactInfo: 'contato@agrosul.com.br',
          eligibleCourses: [Course.TEC_AUTOMACAO_SUBSEQUENTE, Course.ENG_MECANICA],
          minPeriod: 3,
          modality: VacancyModality.PRESENCIAL,
          responsibilities: 'Programar CLPs, documentar circuitos e apoiar instalações.',
          softSkills: 'Atenção a detalhes, trabalho em equipe',
          technicalSkills: 'CLP, Ladder, AutoCAD Elétrico',
        },
        {
          title: 'Analista de Sistemas Pleno',
          description: 'Posição efetiva para atuar em projetos de prontuário eletrônico.',
          type: VacancyType.JOB,
          status: VacancyStatus.PENDING_APPROVAL,
          companyId: company3.companyProfile.id,
          remuneration: 4200,
          workload: 40,
          benefits: 'Plano de saúde, odontológico, PLR',
          contactInfo: 'recrutamento@medicore.com.br',
          eligibleCourses: [Course.BSI],
          modality: VacancyModality.HIBRIDO,
          responsibilities: 'Levantar requisitos, modelar sistemas e homologar entregas.',
          softSkills: 'Análise crítica, comunicação com stakeholders',
          technicalSkills: 'UML, SQL, HL7 FHIR, Scrum',
        },
        {
          title: 'Estágio em Química Analítica',
          description: 'Apoio em análises laboratoriais de controle de qualidade agrícola.',
          type: VacancyType.INTERNSHIP,
          status: VacancyStatus.APPROVED,
          companyId: company2.companyProfile.id,
          remuneration: 820,
          workload: 20,
          benefits: 'Auxílio alimentação',
          contactInfo: 'contato@agrosul.com.br',
          eligibleCourses: [Course.LIC_QUIMICA, Course.TEC_QUIMICA_INTEGRADO, Course.TEC_QUIMICA_CONCOMITANTE],
          minPeriod: 2,
          modality: VacancyModality.PRESENCIAL,
          responsibilities: 'Realizar análises físico-químicas, laudos e controle de amostras.',
          softSkills: 'Organização, responsabilidade',
          technicalSkills: 'Cromatografia, espectrofotometria, BPL',
        },
        {
          title: 'Estágio em Administração e Logística',
          description: 'Suporte ao setor administrativo e controle de estoque.',
          type: VacancyType.INTERNSHIP,
          status: VacancyStatus.CLOSED_BY_COMPANY,
          companyId: company4.companyProfile.id,
          remuneration: 700,
          workload: 20,
          benefits: 'VT',
          contactInfo: 'jobs@brisklog.com.br',
          eligibleCourses: [Course.TEC_ADM_INTEGRADO],
          minPeriod: 1,
          modality: VacancyModality.PRESENCIAL,
          responsibilities: 'Auxiliar no controle de estoque, emissão de notas e rotinas administrativas.',
          softSkills: 'Organização, discrição',
          technicalSkills: 'Excel, ERP básico, rotinas administrativas',
          closureReason: 'Vaga preenchida antes do prazo previsto.',
        },
        {
          title: 'Técnico em Eletroeletrônica',
          description: 'Vaga efetiva para manutenção elétrica e eletrônica de equipamentos industriais.',
          type: VacancyType.JOB,
          status: VacancyStatus.APPROVED,
          companyId: company4.companyProfile.id,
          remuneration: 3100,
          workload: 44,
          benefits: 'Plano de saúde, VR, seguro de vida',
          contactInfo: 'jobs@brisklog.com.br',
          eligibleCourses: [Course.TEC_ELETRO_INTEGRADO, Course.TEC_ELETRO_CONCOMITANTE],
          modality: VacancyModality.PRESENCIAL,
          responsibilities: 'Manutenção preventiva e corretiva, laudos técnicos, suporte à produção.',
          softSkills: 'Responsabilidade, segurança no trabalho',
          technicalSkills: 'NR10, multímetro, inversores de frequência',
        },
        {
          title: 'Estagio em Front-end React',
          description: 'Atue no desenvolvimento de interfaces web modernas e acessiveis.',
          type: VacancyType.INTERNSHIP,
          status: VacancyStatus.APPROVED,
          companyId: company1.companyProfile.id,
          remuneration: 900,
          workload: 20,
          benefits: 'Auxilio transporte e refeicao',
          contactInfo: 'rh@techcorp.com.br',
          eligibleCourses: [Course.BSI],
          minPeriod: 3,
          modality: VacancyModality.REMOTO,
          responsibilities: 'Criar componentes, revisar UI e colaborar com design.',
          softSkills: 'Comunicacao, trabalho em equipe',
          technicalSkills: 'React, TypeScript, CSS',
        },
        {
          title: 'Estagio em Suporte de Sistemas',
          description: 'Apoio ao time interno na manutencao de sistemas corporativos.',
          type: VacancyType.INTERNSHIP,
          status: VacancyStatus.PENDING_APPROVAL,
          companyId: company1.companyProfile.id,
          remuneration: 700,
          workload: 20,
          benefits: 'Vale transporte',
          contactInfo: 'rh@techcorp.com.br',
          eligibleCourses: [Course.TEC_INFO_INTEGRADO],
          minPeriod: 2,
          modality: VacancyModality.PRESENCIAL,
          responsibilities: 'Atender chamados, documentar e apoiar melhorias.',
          softSkills: 'Organizacao, empatia',
          technicalSkills: 'Windows, suporte usuario, redes basicas',
        },
        {
          title: 'Estagio em Dados Agricolas',
          description: 'Apoio em analises e dashboards para producao agricola.',
          type: VacancyType.INTERNSHIP,
          status: VacancyStatus.REJECTED,
          companyId: company2.companyProfile.id,
          remuneration: 850,
          workload: 25,
          benefits: 'Auxilio alimentacao',
          contactInfo: 'contato@agrosul.com.br',
          eligibleCourses: [Course.BSI, Course.ENG_MECANICA],
          minPeriod: 4,
          modality: VacancyModality.HIBRIDO,
          responsibilities: 'Gerar relatorios, validar dados e apoiar squads.',
          softSkills: 'Pensamento analitico, colaboracao',
          technicalSkills: 'SQL, Power BI, Excel',
          rejectionReason: 'Descricao incompleta e carga horaria acima do permitido.',
        },
        {
          title: 'Estagio em QA e Testes',
          description: 'Execucao de testes manuais e apoio em automacao basica.',
          type: VacancyType.INTERNSHIP,
          status: VacancyStatus.APPROVED,
          companyId: company2.companyProfile.id,
          remuneration: 780,
          workload: 20,
          benefits: 'Auxilio transporte',
          contactInfo: 'contato@agrosul.com.br',
          eligibleCourses: [Course.TEC_INFO_INTEGRADO],
          minPeriod: 2,
          modality: VacancyModality.REMOTO,
          responsibilities: 'Registrar bugs, executar roteiros e validar releases.',
          softSkills: 'Atencao a detalhes, comunicacao',
          technicalSkills: 'Testes manuais, Jira, Git basico',
        },
        {
          title: 'Estagio em Suporte Hospitalar',
          description: 'Apoio na operacao de sistemas hospitalares.',
          type: VacancyType.INTERNSHIP,
          status: VacancyStatus.CLOSED_BY_COMPANY,
          companyId: company3.companyProfile.id,
          remuneration: 820,
          workload: 20,
          benefits: 'Auxilio alimentacao',
          contactInfo: 'recrutamento@medicore.com.br',
          eligibleCourses: [Course.TEC_INFO_INTEGRADO, Course.BSI],
          minPeriod: 2,
          modality: VacancyModality.PRESENCIAL,
          responsibilities: 'Suporte ao usuario e treinamento basico.',
          softSkills: 'Paciencia, resolucao de problemas',
          technicalSkills: 'Windows, suporte usuario, redes',
          closureReason: 'Vaga preenchida internamente.',
        },
        {
          title: 'Estagio em Desenvolvimento Backend',
          description: 'Apoio na construcao de APIs e integracoes.',
          type: VacancyType.INTERNSHIP,
          status: VacancyStatus.PENDING_APPROVAL,
          companyId: company3.companyProfile.id,
          remuneration: 1000,
          workload: 30,
          benefits: 'Auxilio transporte',
          contactInfo: 'recrutamento@medicore.com.br',
          eligibleCourses: [Course.BSI],
          minPeriod: 5,
          modality: VacancyModality.HIBRIDO,
          responsibilities: 'Implementar endpoints e testes basicos.',
          softSkills: 'Proatividade, colaboracao',
          technicalSkills: 'Node.js, TypeScript, SQL',
        },
        {
          title: 'Estagio em Operacoes de Logistica',
          description: 'Apoio na analise de rotas e indicadores.',
          type: VacancyType.INTERNSHIP,
          status: VacancyStatus.CLOSED_BY_ADMIN,
          companyId: company4.companyProfile.id,
          remuneration: 750,
          workload: 20,
          benefits: 'Auxilio transporte',
          contactInfo: 'jobs@brisklog.com.br',
          eligibleCourses: [Course.ENG_MECANICA, Course.BSI],
          minPeriod: 3,
          modality: VacancyModality.PRESENCIAL,
          responsibilities: 'Acompanhar indicadores e sugerir melhorias.',
          softSkills: 'Organizacao, comunicacao',
          technicalSkills: 'Excel, Power BI basico',
          closureReason: autoCloseNote,
        },
        {
          title: 'Estagio em Automacao e Dados',
          description: 'Apoio em scripts e automacoes internas.',
          type: VacancyType.INTERNSHIP,
          status: VacancyStatus.APPROVED,
          companyId: company4.companyProfile.id,
          remuneration: 950,
          workload: 25,
          benefits: 'Auxilio refeicao',
          contactInfo: 'jobs@brisklog.com.br',
          eligibleCourses: [Course.BSI, Course.TEC_INFO_INTEGRADO],
          minPeriod: 4,
          modality: VacancyModality.REMOTO,
          responsibilities: 'Criar automacoes e documentar processos.',
          softSkills: 'Foco em resultados, autonomia',
          technicalSkills: 'Python, Git, APIs',
        },
      ],
    });
  }

  // Buscar perfis
  const profiles = await Promise.all([
    prisma.student.findUnique({ where: { userId: student1.id } }),
    prisma.student.findUnique({ where: { userId: student2.id } }),
    prisma.student.findUnique({ where: { userId: student3.id } }),
    prisma.student.findUnique({ where: { userId: student4.id } }),
    prisma.student.findUnique({ where: { userId: student5.id } }),
    prisma.student.findUnique({ where: { userId: student6.id } }),
    prisma.student.findUnique({ where: { userId: student7.id } }),
  ]);

  const profiles2 = await Promise.all([
    prisma.student.findUnique({ where: { userId: student8.id } }),
    prisma.student.findUnique({ where: { userId: student9.id } }),
    prisma.student.findUnique({ where: { userId: student10.id } }),
    prisma.student.findUnique({ where: { userId: student11.id } }),
    prisma.student.findUnique({ where: { userId: student12.id } }),
  ]);

  const [profile1, profile2, profile3, profile4, profile5, profile6, profile7] = profiles;
  const [profile8, profile9, profile10, profile11, profile12] = profiles2;

  // Estágio 1: EM ANÁLISE (João)
  if (profile1) {
    const internship = await prisma.internship.create({
      data: {
        studentId: profile1.id,
        status: 'IN_ANALYSIS',
        type: 'DIRECT',
        studentGender: 'MALE',
        studentAddressStreet: 'Rua das Flores',
        studentAddressNumber: '123',
        studentAddressDistrict: 'Centro',
        studentAddressCityState: 'Campos dos Goytacazes/RJ',
        studentAddressCep: '28035-310',
        studentPhone: '(22) 99999-1234',
        studentCpf: '12345678901',
        studentCourse: 'BSI',
        studentCoursePeriod: '6º período',
        studentSchoolYear: '2024',
        companyName: 'DevSolutions Informática Ltda',
        companyCnpj: '11222333000144',
        companyRepresentativeName: 'Ana Paula Santos',
        companyRepresentativeRole: 'Gerente de RH',
        companyAddressStreet: 'Av. Pelinca',
        companyAddressNumber: '789',
        companyAddressDistrict: 'Pelinca',
        companyAddressCityState: 'Campos dos Goytacazes/RJ',
        companyAddressCep: '28035-200',
        companyEmail: 'rh@devsolutions.com.br',
        companyPhone: '(22) 3333-5678',
        modality: 'PRESENCIAL',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-12-01'),
        weeklyHours: 20,
        dailyHours: '14:00 às 18:00',
        monthlyGrant: 800.0,
        transportationGrant: 150.0,
        advisorProfessorName: 'Prof. Dr. Carlos Eduardo Silva',
        advisorProfessorId: 'SIAPE123456',
        supervisorName: 'Roberto Ferreira',
        supervisorRole: 'Supervisor Técnico',
        internshipSector: 'Desenvolvimento de Software',
        technicalActivities: 'Desenvolvimento de aplicações web, manutenção de sistemas.',
        insuranceRequired: false,
      },
    });
  }

  // Estágio 2: APROVADO (Maria)
  if (profile2) {
    const internship = await prisma.internship.create({
      data: {
        studentId: profile2.id,
        status: 'APPROVED',
        type: 'INTEGRATOR',
        studentGender: 'FEMALE',
        studentAddressStreet: 'Rua São José',
        studentAddressNumber: '456',
        studentAddressDistrict: 'Guarus',
        studentAddressCityState: 'Campos dos Goytacazes/RJ',
        studentAddressCep: '28060-090',
        studentPhone: '(22) 98888-5678',
        studentCpf: '98765432109',
        studentCourse: 'TEC_INFO_INTEGRADO',
        studentCoursePeriod: '3º ano',
        studentSchoolYear: '2024',
        companyName: 'TechInova Sistemas',
        companyCnpj: '22333444000155',
        companyRepresentativeName: 'João Carlos Mendes',
        companyRepresentativeRole: 'Coordenador de Projetos',
        companyAddressStreet: 'Rua Voluntários da Pátria',
        companyAddressNumber: '321',
        companyAddressDistrict: 'Centro',
        companyAddressCityState: 'Campos dos Goytacazes/RJ',
        companyAddressCep: '28035-042',
        companyEmail: 'projetos@techinova.com.br',
        companyPhone: '(22) 2727-9999',
        modality: 'REMOTO',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        weeklyHours: 25,
        dailyHours: '08:00 às 13:00',
        monthlyGrant: 950.0,
        transportationGrant: 0.0,
        advisorProfessorName: 'Prof. Msc. Fernanda Costa',
        advisorProfessorId: 'SIAPE654321',
        supervisorName: 'Marcos Antônio Lima',
        supervisorRole: 'Analista Sênior',
        internshipSector: 'Suporte Técnico',
        technicalActivities: 'Suporte técnico aos usuários, configuração de equipamentos.',
        insuranceRequired: false,
      },
    });

    // Copiar PDF de exemplo para o documento
    const tcePdfPath = await copyExamplePdf(internship.id, 'TCE');

    await prisma.document.create({
      data: { type: 'TCE', status: 'APPROVED', internshipId: internship.id, fileUrl: tcePdfPath },
    });
  }

  // Estágio 3: EM ANDAMENTO (Pedro)
  if (profile3) {
    const internship = await prisma.internship.create({
      data: {
        studentId: profile3.id,
        status: 'IN_PROGRESS',
        type: 'DIRECT',
        studentGender: 'MALE',
        studentAddressStreet: 'Av. Alberto Torres',
        studentAddressNumber: '789',
        studentAddressDistrict: 'Centro',
        studentAddressCityState: 'Campos dos Goytacazes/RJ',
        studentAddressCep: '28035-580',
        studentPhone: '(22) 97777-4321',
        studentCpf: '45678912300',
        studentCourse: 'BSI',
        studentCoursePeriod: '7º período',
        studentSchoolYear: '2024',
        companyName: 'CodeLab Tecnologia',
        companyCnpj: '33444555000166',
        companyRepresentativeName: 'Beatriz Rocha',
        companyRepresentativeRole: 'CTO',
        companyAddressStreet: 'Rua Treze de Maio',
        companyAddressNumber: '555',
        companyAddressDistrict: 'Centro',
        companyAddressCityState: 'Campos dos Goytacazes/RJ',
        companyAddressCep: '28010-410',
        companyEmail: 'rh@codelab.tech',
        companyPhone: '(22) 2525-8888',
        modality: 'PRESENCIAL',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-08-31'),
        weeklyHours: 30,
        dailyHours: '08:00 às 14:00',
        monthlyGrant: 1200.0,
        transportationGrant: 200.0,
        advisorProfessorName: 'Prof. Dr. Fernando Alves',
        advisorProfessorId: 'SIAPE789123',
        supervisorName: 'Juliana Martins',
        supervisorRole: 'Tech Lead',
        internshipSector: 'Desenvolvimento Backend',
        technicalActivities: 'Desenvolvimento de APIs REST, integração com bancos de dados.',
        insuranceRequired: false,
      },
    });

    // Copiar PDF de exemplo para o documento
    const contractPdfPath = await copyExamplePdf(internship.id, 'SIGNED_CONTRACT');

    await prisma.document.create({
      data: { type: 'SIGNED_CONTRACT', status: 'APPROVED', internshipId: internship.id, fileUrl: contractPdfPath },
    });
  }

  // Estágio 4: FINALIZADO (Ana)
  if (profile4) {
    const internship = await prisma.internship.create({
      data: {
        studentId: profile4.id,
        status: 'FINISHED',
        type: 'DIRECT',
        studentGender: 'FEMALE',
        studentAddressStreet: 'Rua Saldanha Marinho',
        studentAddressNumber: '222',
        studentAddressDistrict: 'Centro',
        studentAddressCityState: 'Campos dos Goytacazes/RJ',
        studentAddressCep: '28035-270',
        studentPhone: '(22) 96666-1111',
        studentCpf: '32165498700',
        studentCourse: 'LIC_QUIMICA',
        studentCoursePeriod: '8º período',
        studentSchoolYear: '2023',
        companyName: 'Laboratório QuímicaTech',
        companyCnpj: '44555666000177',
        companyRepresentativeName: 'Ricardo Oliveira',
        companyRepresentativeRole: 'Diretor Técnico',
        companyAddressStreet: 'Rua Dr. March',
        companyAddressNumber: '100',
        companyAddressDistrict: 'Parque Rosário',
        companyAddressCityState: 'Campos dos Goytacazes/RJ',
        companyAddressCep: '28022-260',
        companyEmail: 'rh@quimicatech.com.br',
        companyPhone: '(22) 3737-4444',
        modality: 'PRESENCIAL',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2025-02-28'),
        weeklyHours: 20,
        dailyHours: '14:00 às 18:00',
        monthlyGrant: 750.0,
        transportationGrant: 120.0,
        advisorProfessorName: 'Prof. Dra. Luciana Campos',
        advisorProfessorId: 'SIAPE456789',
        supervisorName: 'Eduardo Mendes',
        supervisorRole: 'Químico Responsável',
        internshipSector: 'Análises Laboratoriais',
        technicalActivities: 'Realização de análises químicas, controle de qualidade.',
        insuranceRequired: false,
      },
    });

    // Copiar PDFs de exemplo para os documentos
    const contractPdfPath4 = await copyExamplePdf(internship.id, 'SIGNED_CONTRACT');
    const trePdfPath = await copyExamplePdf(internship.id, 'TRE');
    const rfePdfPath = await copyExamplePdf(internship.id, 'RFE');

    await prisma.document.createMany({
      data: [
        { type: 'SIGNED_CONTRACT', status: 'APPROVED', internshipId: internship.id, fileUrl: contractPdfPath4 },
        { type: 'TRE', status: 'APPROVED', internshipId: internship.id, fileUrl: trePdfPath },
        { type: 'RFE', status: 'APPROVED', internshipId: internship.id, fileUrl: rfePdfPath },
      ],
    });
  }

  // Estágio 5: CANCELADO (Lucas)
  if (profile5) {
    await prisma.internship.create({
      data: {
        studentId: profile5.id,
        status: 'CANCELED',
        type: 'DIRECT',
        studentGender: 'MALE',
        studentAddressStreet: 'Rua Barão de Miracema',
        studentAddressNumber: '333',
        studentAddressDistrict: 'Centro',
        studentAddressCityState: 'Campos dos Goytacazes/RJ',
        studentAddressCep: '28035-020',
        studentPhone: '(22) 95555-2222',
        studentCpf: '11122233344',
        studentCourse: 'TEC_INFO_INTEGRADO',
        studentCoursePeriod: '2º ano',
        studentSchoolYear: '2024',
        companyName: 'WebDev Solutions',
        companyCnpj: '55666777000188',
        companyRepresentativeName: 'Patrícia Souza',
        companyRepresentativeRole: 'Gerente Operacional',
        companyAddressStreet: 'Av. Quinze de Novembro',
        companyAddressNumber: '777',
        companyAddressDistrict: 'Centro',
        companyAddressCityState: 'Campos dos Goytacazes/RJ',
        companyAddressCep: '28010-160',
        companyEmail: 'contato@webdev.com',
        companyPhone: '(22) 3232-7777',
        modality: 'PRESENCIAL',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-02-01'),
        weeklyHours: 20,
        dailyHours: '14:00 às 18:00',
        monthlyGrant: 600.0,
        transportationGrant: 100.0,
        advisorProfessorName: 'Prof. Msc. Rafael Torres',
        advisorProfessorId: 'SIAPE321654',
        supervisorName: 'Camila Rodrigues',
        supervisorRole: 'Coordenadora de Projetos',
        internshipSector: 'Desenvolvimento Web',
        technicalActivities: 'Criação de sites institucionais.',
        insuranceRequired: false,
        rejectionReason: `Carga horaria semanal incompatível com o curso. O estágio requer 20 horas semanais, mas o curso permite apenas 15 horas.\n\n${autoCancelNote}`,
        rejectedAt: new Date('2024-08-10'),
      },
    });
  }

  // Estágio 6: EM ANÁLISE (Carla)
  if (profile6) {
    const internship = await prisma.internship.create({
      data: {
        studentId: profile6.id,
        status: 'IN_ANALYSIS',
        type: 'DIRECT',
        studentGender: 'FEMALE',
        studentAddressStreet: 'Rua Conselheiro Otaviano',
        studentAddressNumber: '888',
        studentAddressDistrict: 'Centro',
        studentAddressCityState: 'Campos dos Goytacazes/RJ',
        studentAddressCep: '28010-140',
        studentPhone: '(22) 94444-3333',
        studentCpf: '77788899900',
        studentCourse: 'BSI',
        studentCoursePeriod: '4º período',
        studentSchoolYear: '2024',
        companyName: 'Inovação Digital Ltda',
        companyCnpj: '66777888000199',
        companyRepresentativeName: 'Gustavo Pereira',
        companyRepresentativeRole: 'CEO',
        companyAddressStreet: 'Rua Coronel Ponciano',
        companyAddressNumber: '444',
        companyAddressDistrict: 'Centro',
        companyAddressCityState: 'Campos dos Goytacazes/RJ',
        companyAddressCep: '28010-300',
        companyEmail: 'rh@inovacaodigital.com.br',
        companyPhone: '(22) 2828-5555',
        modality: 'REMOTO',
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-11-01'),
        weeklyHours: 20,
        dailyHours: '09:00 às 13:00',
        monthlyGrant: 850.0,
        transportationGrant: 0.0,
        advisorProfessorName: 'Prof. Dr. Renato Silva',
        advisorProfessorId: 'SIAPE987654',
        supervisorName: 'Vanessa Almeida',
        supervisorRole: 'Product Manager',
        internshipSector: 'UX/UI Design',
        technicalActivities: 'Design de interfaces, prototipação, testes de usabilidade.',
        insuranceRequired: false,
      },
    });
  }

  // Estágio 7: RECÉM FINALIZADO - SEM DOCUMENTOS FINAIS (Bruno)
  if (profile7) {
    const internship = await prisma.internship.create({
      data: {
        studentId: profile7.id,
        status: 'FINISHED',
        type: 'DIRECT',
        studentGender: 'MALE',
        studentAddressStreet: 'Rua Silva Jardim',
        studentAddressNumber: '567',
        studentAddressDistrict: 'Centro',
        studentAddressCityState: 'Itaperuna/RJ',
        studentAddressCep: '28300-170',
        studentPhone: '(22) 98765-4321',
        studentCpf: '12398745600',
        studentCourse: 'BSI',
        studentCoursePeriod: '6º período',
        studentSchoolYear: '2025',
        companyName: 'SysTech Informática Ltda',
        companyCnpj: '77888999000100',
        companyRepresentativeName: 'Daniela Costa',
        companyRepresentativeRole: 'Gerente de RH',
        companyAddressStreet: 'Av. Cardoso Moreira',
        companyAddressNumber: '890',
        companyAddressDistrict: 'Centro',
        companyAddressCityState: 'Itaperuna/RJ',
        companyAddressCep: '28300-000',
        companyEmail: 'rh@systech.com.br',
        companyPhone: '(22) 3824-5555',
        modality: 'PRESENCIAL',
        startDate: new Date('2025-08-01'),
        endDate: new Date('2026-02-20'), // Finalizado há poucos dias
        weeklyHours: 25,
        dailyHours: '08:00 às 13:00',
        monthlyGrant: 1000.0,
        transportationGrant: 180.0,
        advisorProfessorName: 'Prof. Dra. Márcia Silva',
        advisorProfessorId: 'SIAPE111222',
        supervisorName: 'Roberto Santos',
        supervisorRole: 'Coordenador de TI',
        internshipSector: 'Infraestrutura e Redes',
        technicalActivities: 'Manutenção de servidores, configuração de redes, suporte técnico.',
        insuranceRequired: false,
      },
    });

    // Contrato aprovado, mas SEM TRE e RFE (para testar o fluxo de upload)
    const contractPdfPath7 = await copyExamplePdf(internship.id, 'SIGNED_CONTRACT');

    await prisma.document.create({
      data: { type: 'SIGNED_CONTRACT', status: 'APPROVED', internshipId: internship.id, fileUrl: contractPdfPath7 },
    });
  }
  // Estágio 8: REJEITADO aguardando correção (Rafaela)
  if (profile8) {
    await prisma.internship.create({
      data: {
        studentId: profile8.id,
        status: 'REJECTED',
        type: 'DIRECT',
        studentGender: 'FEMALE',
        studentAddressStreet: 'Rua Pinheiro Machado',
        studentAddressNumber: '91',
        studentAddressDistrict: 'Parque Leopoldina',
        studentAddressCityState: 'Campos dos Goytacazes/RJ',
        studentAddressCep: '28021-180',
        studentPhone: '(22) 98123-4567',
        studentCpf: '44455566677',
        studentCourse: 'TEC_INFO_INTEGRADO',
        studentCoursePeriod: '2º ano',
        studentSchoolYear: '2024',
        companyName: 'Nexus Soluções Web',
        companyCnpj: '88999000000111',
        companyRepresentativeName: 'Felipe Castro',
        companyRepresentativeRole: 'Gerente de TI',
        companyAddressStreet: 'Rua Visconde de Santa Cruz',
        companyAddressNumber: '200',
        companyAddressDistrict: 'Centro',
        companyAddressCityState: 'Campos dos Goytacazes/RJ',
        companyAddressCep: '28010-335',
        companyEmail: 'ti@nexusweb.com.br',
        companyPhone: '(22) 3311-2200',
        modality: 'PRESENCIAL',
        startDate: new Date('2026-04-15'),
        endDate: new Date('2026-10-15'),
        weeklyHours: 20,
        dailyHours: '13:00 às 17:00',
        monthlyGrant: 650.0,
        transportationGrant: 100.0,
        advisorProfessorName: 'Prof. Msc. Adriana Pires',
        advisorProfessorId: 'SIAPE222333',
        supervisorName: 'Roberta Andrade',
        supervisorRole: 'Analista de Sistemas',
        internshipSector: 'Desenvolvimento de Software',
        technicalActivities: 'Manutenção de sistemas web, apoio em implantações.',
        insuranceRequired: false,
        rejectionReason: 'O CNPJ informado está irregular na Receita Federal. Por favor, corrija e reenvie o formulário.',
        rejectedAt: new Date('2026-03-20'),
      },
    });
  }

  // Estágio 9: EM ANÁLISE com documento TCE em análise (Gabriel)
  if (profile9) {
    const internship9 = await prisma.internship.create({
      data: {
        studentId: profile9.id,
        status: 'IN_ANALYSIS',
        type: 'DIRECT',
        studentGender: 'MALE',
        studentAddressStreet: 'Av. Sete de Setembro',
        studentAddressNumber: '310',
        studentAddressDistrict: 'Centro',
        studentAddressCityState: 'Itaperuna/RJ',
        studentAddressCep: '28300-005',
        studentPhone: '(22) 99321-6543',
        studentCpf: '55566677788',
        studentCourse: 'ENG_MECANICA',
        studentCoursePeriod: '5º período',
        studentSchoolYear: '2024',
        companyName: 'Mecatrônica Industrial S/A',
        companyCnpj: '99000111000122',
        companyRepresentativeName: 'Cláudio Braga',
        companyRepresentativeRole: 'Diretor de Operações',
        companyAddressStreet: 'Rod. BR-356',
        companyAddressNumber: 'Km 5',
        companyAddressDistrict: 'Distrito Industrial',
        companyAddressCityState: 'Itaperuna/RJ',
        companyAddressCep: '28305-000',
        companyEmail: 'rh@mecatronica.com.br',
        companyPhone: '(22) 3823-9900',
        modality: 'PRESENCIAL',
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-12-31'),
        weeklyHours: 25,
        dailyHours: '07:00 às 12:00',
        monthlyGrant: 920.0,
        transportationGrant: 160.0,
        advisorProfessorName: 'Prof. Dr. Hélio Mota',
        advisorProfessorId: 'SIAPE444555',
        supervisorName: 'Edinaldo Prado',
        supervisorRole: 'Engenheiro Mecânico',
        internshipSector: 'Manutenção Industrial',
        technicalActivities: 'Apoio na manutenção preventiva de máquinas, análise de falhas.',
        insuranceRequired: false,
      },
    });

    const tcePdfPath9 = await copyExamplePdf(internship9.id, 'TCE');
    await prisma.document.create({
      data: { type: 'TCE', status: 'PENDING_ANALYSIS', internshipId: internship9.id, fileUrl: tcePdfPath9 },
    });
  }

  // Estágio 10: EM ANDAMENTO com extensão solicitada (Isabela)
  if (profile10) {
    const internship10 = await prisma.internship.create({
      data: {
        studentId: profile10.id,
        status: 'IN_PROGRESS',
        type: 'DIRECT',
        studentGender: 'FEMALE',
        studentAddressStreet: 'Rua Maestro Darke de Matos',
        studentAddressNumber: '55',
        studentAddressDistrict: 'Penha',
        studentAddressCityState: 'Campos dos Goytacazes/RJ',
        studentAddressCep: '28024-475',
        studentPhone: '(22) 97654-3210',
        studentCpf: '66677788899',
        studentCourse: 'LIC_QUIMICA',
        studentCoursePeriod: '6º período',
        studentSchoolYear: '2024',
        companyName: 'Petrochem Lubrificantes Ltda',
        companyCnpj: '11000222000133',
        companyRepresentativeName: 'Sandra Ramos',
        companyRepresentativeRole: 'Gerente de Qualidade',
        companyAddressStreet: 'Av. Governador Roberto Silveira',
        companyAddressNumber: '1500',
        companyAddressDistrict: 'Novo Horizonte',
        companyAddressCityState: 'Campos dos Goytacazes/RJ',
        companyAddressCep: '28040-060',
        companyEmail: 'qualidade@petrochem.com.br',
        companyPhone: '(22) 3364-7700',
        modality: 'PRESENCIAL',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2026-05-31'),
        weeklyHours: 20,
        dailyHours: '08:00 às 12:00',
        monthlyGrant: 880.0,
        transportationGrant: 140.0,
        advisorProfessorName: 'Prof. Dr. Mauro Abreu',
        advisorProfessorId: 'SIAPE555666',
        supervisorName: 'Henrique Leal',
        supervisorRole: 'Químico Analista',
        internshipSector: 'Controle de Qualidade',
        technicalActivities: 'Análises laboratoriais, emissão de certificados de qualidade.',
        insuranceRequired: false,
        internshipExtensionRequested: true,
        internshipExtensionRequestedAt: new Date('2026-03-10'),
        internshipExtensionReason: 'A estudante tem desempenho excelente e o projeto ainda não foi concluído. Solicitamos prorrogação por mais 6 meses.',
        internshipExtensionStartDate: new Date('2026-06-01'),
        internshipExtensionEndDate: new Date('2026-11-30'),
      },
    });

    const contractPdfPath10 = await copyExamplePdf(internship10.id, 'SIGNED_CONTRACT');
    const reportPdfPath10 = await copyExamplePdf(internship10.id, 'PERIODIC_REPORT');
    await prisma.document.createMany({
      data: [
        { type: 'SIGNED_CONTRACT', status: 'APPROVED', internshipId: internship10.id, fileUrl: contractPdfPath10 },
        { type: 'PERIODIC_REPORT', status: 'APPROVED', internshipId: internship10.id, fileUrl: reportPdfPath10 },
      ],
    });
  }

  // Estágio 11: APROVADO via agente integrador (Matheus)
  if (profile11) {
    const internship11 = await prisma.internship.create({
      data: {
        studentId: profile11.id,
        status: 'APPROVED',
        type: 'INTEGRATOR',
        studentGender: 'MALE',
        studentAddressStreet: 'Rua Engenheiro Souza Filho',
        studentAddressNumber: '742',
        studentAddressDistrict: 'Parque Ambaí',
        studentAddressCityState: 'Campos dos Goytacazes/RJ',
        studentAddressCep: '28048-080',
        studentPhone: '(22) 96543-2109',
        studentCpf: '77788899910',
        studentCourse: 'TEC_ADM_INTEGRADO',
        studentCoursePeriod: '3º ano',
        studentSchoolYear: '2024',
        companyName: 'Grupo Varejo Norte Fluminense',
        companyCnpj: '22000333000144',
        companyRepresentativeName: 'Letícia Moura',
        companyRepresentativeRole: 'Supervisora de RH',
        companyAddressStreet: 'Av. Nilo Peçanha',
        companyAddressNumber: '350',
        companyAddressDistrict: 'Centro',
        companyAddressCityState: 'Campos dos Goytacazes/RJ',
        companyAddressCep: '28010-411',
        companyEmail: 'rh@grupovarejo.com.br',
        companyPhone: '(22) 3010-5500',
        modality: 'PRESENCIAL',
        startDate: new Date('2026-04-07'),
        endDate: new Date('2026-10-07'),
        weeklyHours: 20,
        dailyHours: '13:00 às 17:00',
        monthlyGrant: 700.0,
        transportationGrant: 110.0,
        advisorProfessorName: 'Prof. Msc. Simone Araujo',
        advisorProfessorId: 'SIAPE666777',
        supervisorName: 'Rodrigo Fonseca',
        supervisorRole: 'Coordenador Administrativo',
        internshipSector: 'Administrativo/Comercial',
        technicalActivities: 'Auxílio em rotinas administrativas, controle de documentos e atendimento.',
        insuranceRequired: false,
        approvedAt: new Date('2026-03-21'),
      },
    });

    const tcePdfPath11 = await copyExamplePdf(internship11.id, 'TCE');
    await prisma.document.create({
      data: { type: 'TCE', status: 'APPROVED', internshipId: internship11.id, fileUrl: tcePdfPath11 },
    });
  }

  // Estágio 12: EM ANDAMENTO com rescisão antecipada solicitada (Larissa)
  if (profile12) {
    const internship12 = await prisma.internship.create({
      data: {
        studentId: profile12.id,
        status: 'IN_PROGRESS',
        type: 'DIRECT',
        studentGender: 'FEMALE',
        studentAddressStreet: 'Rua Coronel Leite',
        studentAddressNumber: '88',
        studentAddressDistrict: 'Horto',
        studentAddressCityState: 'Campos dos Goytacazes/RJ',
        studentAddressCep: '28020-420',
        studentPhone: '(22) 95432-1098',
        studentCpf: '88899900011',
        studentCourse: 'BSI',
        studentCoursePeriod: '8º período',
        studentSchoolYear: '2025',
        companyName: 'DataPrime Analytics',
        companyCnpj: '33000444000155',
        companyRepresentativeName: 'André Vasconcelos',
        companyRepresentativeRole: 'Head de Dados',
        companyAddressStreet: 'Rua Tenente Coronel Cardoso',
        companyAddressNumber: '660',
        companyAddressDistrict: 'Centro',
        companyAddressCityState: 'Campos dos Goytacazes/RJ',
        companyAddressCep: '28010-100',
        companyEmail: 'rh@dataprime.com.br',
        companyPhone: '(22) 3355-8800',
        modality: 'REMOTO',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2026-06-30'),
        weeklyHours: 30,
        dailyHours: '09:00 às 15:00',
        monthlyGrant: 1100.0,
        transportationGrant: 0.0,
        advisorProfessorName: 'Prof. Dr. Leandro Vieira',
        advisorProfessorId: 'SIAPE777888',
        supervisorName: 'Camilla Torres',
        supervisorRole: 'Cientista de Dados Sênior',
        internshipSector: 'Ciência de Dados',
        technicalActivities: 'Análise exploratória de dados, criação de modelos preditivos.',
        insuranceRequired: false,
        earlyTerminationRequested: true,
        earlyTerminationRequestedAt: new Date('2026-03-18'),
        earlyTerminationReason: 'A estudante foi aprovada em programa de intercâmbio internacional e precisa encerrar o estágio.',
      },
    });

    const contractPdfPath12 = await copyExamplePdf(internship12.id, 'SIGNED_CONTRACT');
    const reportPdfPath12 = await copyExamplePdf(internship12.id, 'PERIODIC_REPORT');
    await prisma.document.createMany({
      data: [
        { type: 'SIGNED_CONTRACT', status: 'APPROVED', internshipId: internship12.id, fileUrl: contractPdfPath12 },
        { type: 'PERIODIC_REPORT', status: 'APPROVED', internshipId: internship12.id, fileUrl: reportPdfPath12 },
      ],
    });
  }

  console.log('🎯 Estágios criados');
  console.log('\n✅ Seed concluído!');
  console.log('\n📋 USUÁRIOS CRIADOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 ADMIN:');
  console.log(`   📧 ${adminSeedEmail}`);
  console.log('\n🎓 ESTUDANTES:');
  console.log('   1️⃣  joao.silva@estudante.iff.edu.br - EM ANÁLISE');
  console.log('   2️⃣  maria.oliveira@estudante.iff.edu.br - APROVADO');
  console.log('   3️⃣  pedro.santos@estudante.iff.edu.br - EM ANDAMENTO');
  console.log('   4️⃣  ana.costa@estudante.iff.edu.br - FINALIZADO (com TRE/RFE aprovados)');
  console.log('   5️⃣  lucas.lima@estudante.iff.edu.br - CANCELADO');
  console.log('   6️⃣  carla.mendes@estudante.iff.edu.br - EM ANÁLISE');
  console.log('   7️⃣  bruno.oliveira@estudante.iff.edu.br - FINALIZADO RECENTE (sem documentos finais) ⭐');
  console.log('   8️⃣  rafaela.lima@estudante.iff.edu.br - REJEITADO (aguardando correção)');
  console.log('   9️⃣  gabriel.ferreira@estudante.iff.edu.br - EM ANÁLISE (doc TCE em análise)');
  console.log('   🔟  isabela.santos@estudante.iff.edu.br - EM ANDAMENTO (extensão solicitada)');
  console.log('   1️⃣1️⃣  matheus.cardoso@estudante.iff.edu.br - APROVADO (integrador)');
  console.log('   1️⃣2️⃣  larissa.monteiro@estudante.iff.edu.br - EM ANDAMENTO (rescisão solicitada)');
  console.log('\n🏢 EMPRESAS:');
  console.log('   📧 rh@techcorp.com.br');
  console.log('   📧 contato@agrosul.com.br');
  console.log('   📧 recrutamento@medicore.com.br');
  console.log('   📧 jobs@brisklog.com.br');
  console.log('\n📌 VAGAS CRIADAS:');
  console.log('   ✅ 14 vagas no total com status, modalidades e tipos variados');
  console.log('\n⭐ TESTE DE DOCUMENTOS FINAIS:');
  console.log('   Use bruno.oliveira@estudante.iff.edu.br para testar:');
  console.log('   - Download de templates TRE e RFE');
  console.log('   - Upload de documentos finais');
  console.log('   - Aprovação pelo admin');
  console.log('\n🔐 SENHA PADRÃO (ESTUDANTES/EMPRESAS): 123456');
  console.log('🔐 SENHA ADMIN: definida por ADMIN_SEED_PASSWORD');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erro durante o seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
