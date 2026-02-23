import { PrismaClient, Role, VacancyType, VacancyStatus, VacancyModality, Course } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o seed...');

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

  // 1. Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@iff.edu.br',
      password: defaultPassword,
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

  // 7. Estudante SEM DADOS DE SEGURO
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
  ]);

  const [profile1, profile2, profile3, profile4, profile5, profile6] = profiles;

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
        startDate: new Date('2024-02-15'),
        endDate: new Date('2024-12-15'),
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
        startDate: new Date('2024-03-01'),
        endDate: new Date('2025-02-28'),
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
        insuranceCompany: 'Seguradora Vida & Trabalho',
        insurancePolicyNumber: 'VT-2024-005678',
        insuranceCompanyCnpj: '77888999000111',
        insuranceStartDate: new Date('2024-03-01'),
        insuranceEndDate: new Date('2025-02-28'),
      },
    });

    await prisma.document.createMany({
      data: [
        { type: 'TCE', status: 'APPROVED', internshipId: internship.id },
        { type: 'PAE', status: 'APPROVED', internshipId: internship.id },
        { type: 'LIFE_INSURANCE', status: 'APPROVED', internshipId: internship.id },
      ],
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
        startDate: new Date('2023-08-01'),
        endDate: new Date('2024-07-31'),
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
        insuranceCompany: 'Seguros Globo',
        insurancePolicyNumber: 'GLB-2023-789456',
        insuranceCompanyCnpj: '88999000111222',
        insuranceStartDate: new Date('2023-08-01'),
        insuranceEndDate: new Date('2024-07-31'),
      },
    });

    await prisma.document.createMany({
      data: [
        { type: 'LIFE_INSURANCE', status: 'SIGNED_VALIDATED', internshipId: internship.id },
        { type: 'SIGNED_CONTRACT', status: 'SIGNED_VALIDATED', internshipId: internship.id },
      ],
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
        startDate: new Date('2023-02-01'),
        endDate: new Date('2023-11-30'),
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
        insuranceCompany: 'Proteção Seguradora',
        insurancePolicyNumber: 'PRT-2023-123123',
        insuranceCompanyCnpj: '11223344556677',
        insuranceStartDate: new Date('2023-02-01'),
        insuranceEndDate: new Date('2023-11-30'),
      },
    });

    await prisma.document.createMany({
      data: [
        { type: 'LIFE_INSURANCE', status: 'SIGNED_VALIDATED', internshipId: internship.id },
        { type: 'SIGNED_CONTRACT', status: 'SIGNED_VALIDATED', internshipId: internship.id },
        { type: 'TRE', status: 'APPROVED', internshipId: internship.id },
        { type: 'RFE', status: 'APPROVED', internshipId: internship.id },
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
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-07-15'),
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
        insuranceCompany: 'Vida Segura',
        insurancePolicyNumber: 'VS-2024-999',
        insuranceCompanyCnpj: '99988877766655',
        insuranceStartDate: new Date('2024-01-15'),
        insuranceEndDate: new Date('2024-07-15'),
        rejectionReason: `Carga horaria semanal incompatível com o curso. O estágio requer 20 horas semanais, mas o curso permite apenas 15 horas.\n\n${autoCancelNote}`,
        rejectedAt: new Date('2024-01-20'),
      },
    });
  }

  // Estágio 6: SEM DADOS DE SEGURO (Carla)
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
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-10-01'),
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
        // SEM DADOS DE SEGURO (todos null)
        insuranceCompany: null,
        insurancePolicyNumber: null,
        insuranceCompanyCnpj: null,
        insuranceStartDate: null,
        insuranceEndDate: null,
      },
    });

    await prisma.document.create({
      data: {
        type: 'LIFE_INSURANCE',
        status: 'PENDING_ANALYSIS',
        internshipId: internship.id,
      },
    });
  }

  console.log('🎯 Estágios criados');
  console.log('\n✅ Seed concluído!');
  console.log('\n📋 USUÁRIOS CRIADOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 ADMIN:');
  console.log('   📧 admin@iff.edu.br');
  console.log('\n🎓 ESTUDANTES:');
  console.log('   1️⃣  joao.silva@estudante.iff.edu.br - EM ANÁLISE');
  console.log('   2️⃣  maria.oliveira@estudante.iff.edu.br - APROVADO');
  console.log('   3️⃣  pedro.santos@estudante.iff.edu.br - EM ANDAMENTO');
  console.log('   4️⃣  ana.costa@estudante.iff.edu.br - FINALIZADO');
  console.log('   5️⃣  lucas.lima@estudante.iff.edu.br - CANCELADO');
  console.log('   6️⃣  carla.mendes@estudante.iff.edu.br - SEM DADOS DE SEGURO');
  console.log('\n🏢 EMPRESAS:');
  console.log('   📧 rh@techcorp.com.br');
  console.log('   📧 contato@agrosul.com.br');
  console.log('   📧 recrutamento@medicore.com.br');
  console.log('   📧 jobs@brisklog.com.br');
  console.log('\n📌 VAGAS CRIADAS:');
  console.log('   ✅ 8 vagas (2 por empresa) com status variados');
  console.log('\n🔐 SENHA PADRÃO: 123456');
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
