import { PrismaClient, Role, VacancyType, VacancyStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o seed...');

  // Limpar dados existentes (opcional - remova se não quiser)
  // Ordem: primeiro filhos, depois pais
  await prisma.document.deleteMany({});
  await prisma.internship.deleteMany({});
  await prisma.jobVacancy.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🗑️  Dados anteriores removidos');

  // Hash da senha padrão
  const defaultPassword = await bcrypt.hash('123456', 10);

  // 1. Criar usuário ADMIN
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@iff.edu.br',
      password: defaultPassword,
      role: Role.ADMIN,
    },
  });

  console.log('👨‍💼 Admin criado:', adminUser.email);

  // 2. Criar usuário STUDENT
  const studentUser = await prisma.user.create({
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

  console.log('🎓 Estudante criado:', studentUser.email);

  // 3. Criar outro estudante
  const studentUser2 = await prisma.user.create({
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

  console.log('🎓 Estudante 2 criado:', studentUser2.email);

  // 4. Criar usuário COMPANY
  const companyUser = await prisma.user.create({
    data: {
      email: 'rh@techcorp.com.br',
      password: defaultPassword,
      role: Role.COMPANY,
      companyProfile: {
        create: {
          name: 'TechCorp Soluções Ltda',
          cnpj: '12.345.678/0001-90',
          location: 'Campos dos Goytacazes, RJ',
          description: 'Empresa de tecnologia especializada em desenvolvimento de software e soluções digitais para empresas de diversos segmentos.',
        },
      },
    },
  });

  console.log('🏢 Empresa criada:', companyUser.email);

  // 5. Criar segunda empresa
  const companyUser2 = await prisma.user.create({
    data: {
      email: 'contato@inovadata.com.br',
      password: defaultPassword,
      role: Role.COMPANY,
      companyProfile: {
        create: {
          name: 'InovaData Tecnologia',
          cnpj: '98.765.432/0001-10',
          location: 'Macaé, RJ',
          description: 'Startup focada em ciência de dados, analytics e inteligência artificial para otimização de processos empresariais.',
        },
      },
    },
  });

  console.log('🏢 Empresa 2 criada:', companyUser2.email);

  // 6. Buscar perfis das empresas para criar vagas
  const techCorpProfile = await prisma.company.findUnique({
    where: { userId: companyUser.id },
  });

  const inovaDataProfile = await prisma.company.findUnique({
    where: { userId: companyUser2.id },
  });

  if (techCorpProfile) {
    // 7. Criar vagas de exemplo
    await prisma.jobVacancy.create({
      data: {
        title: 'Estágio em Desenvolvimento Web',
        description: 'Oportunidade de estágio para estudantes de TI interessados em desenvolvimento web com React e Node.js. Ambiente colaborativo e mentoria técnica.',
        type: VacancyType.INTERNSHIP,
        status: VacancyStatus.APPROVED,
        remuneration: 800.0,
        workload: 20,
        modality: 'HIBRIDO',
        eligibleCourses: ['BSI', 'TEC_INFO_INTEGRADO'],
        minPeriod: 3,
        responsibilities: '- Desenvolver interfaces web responsivas usando React\n- Participar de reuniões de planejamento e code reviews\n- Criar e manter documentação técnica\n- Auxiliar na manutenção de APIs REST\n- Realizar testes unitários e de integração',
        technicalSkills: '- JavaScript/TypeScript básico\n- HTML5 e CSS3\n- Git básico\n- Conhecimento em React (diferencial)',
        softSkills: '- Comunicação clara e objetiva\n- Trabalho em equipe\n- Proatividade\n- Vontade de aprender\n- Organização',
        benefits: 'Vale-transporte, Vale-refeição, Horário flexível, Ambiente descontraído',
        contactInfo: 'Enviar currículo para rh@techcorp.com.br ou WhatsApp (22) 98765-4321',
        companyId: techCorpProfile.id,
      },
    });

    await prisma.jobVacancy.create({
      data: {
        title: 'Desenvolvedor Frontend Júnior',
        description: 'Vaga para desenvolvedor frontend júnior com conhecimento em React, TypeScript e Tailwind CSS. Experiência com Next.js será um diferencial.',
        type: VacancyType.JOB,
        status: VacancyStatus.APPROVED,
        remuneration: 3500.0,
        workload: 40,
        modality: 'PRESENCIAL',
        eligibleCourses: ['BSI', 'TEC_INFO_INTEGRADO', 'ENG_MECANICA'],
        responsibilities: '- Desenvolver e manter aplicações web frontend\n- Implementar designs responsivos e acessíveis\n- Integrar APIs REST e GraphQL\n- Otimizar performance de aplicações\n- Colaborar com equipe de UX/UI',
        technicalSkills: '- React e TypeScript (intermediário)\n- Next.js (básico a intermediário)\n- Tailwind CSS ou similar\n- Git e GitHub\n- Testes com Jest ou similar',
        softSkills: '- Bom relacionamento interpessoal\n- Capacidade analítica\n- Autonomia\n- Comprometimento\n- Adaptabilidade',
        benefits: 'Plano de saúde, Vale-alimentação, Auxílio home office, Plano de carreira',
        contactInfo: 'Candidaturas através do site: techcorp.com.br/carreiras',
        companyId: techCorpProfile.id,
      },
    });
  }

  if (inovaDataProfile) {
    await prisma.jobVacancy.create({
      data: {
        title: 'Estágio em Análise de Dados',
        description: 'Estágio voltado para estudantes interessados em ciência de dados e analytics. Trabalho com Python, SQL e ferramentas de BI.',
        type: VacancyType.INTERNSHIP,
        status: VacancyStatus.APPROVED,
        remuneration: 900.0,
        workload: 25,
        modality: 'REMOTO',
        eligibleCourses: ['BSI', 'LIC_QUIMICA', 'TEC_INFO_INTEGRADO'],
        minPeriod: 2,
        responsibilities: '- Coletar e processar dados de diversas fontes\n- Criar dashboards e relatórios em Power BI\n- Realizar análises exploratórias de dados\n- Auxiliar na criação de modelos estatísticos\n- Documentar processos e metodologias',
        technicalSkills: '- Python básico\n- SQL básico\n- Excel intermediário\n- Noções de estatística\n- Power BI ou similar (diferencial)',
        softSkills: '- Atenção aos detalhes\n- Pensamento analítico\n- Curiosidade intelectual\n- Capacidade de aprendizado rápido\n- Comunicação de insights',
        benefits: 'Auxílio internet, Cursos e certificações, Ambiente de aprendizado, Flexibilidade de horários',
        contactInfo: 'Candidaturas pelo email: vagas@inovadata.com.br',
        companyId: inovaDataProfile.id,
      },
    });

    await prisma.jobVacancy.create({
      data: {
        title: 'Analista de Sistemas Pleno',
        description: 'Vaga para analista de sistemas com experiência em desenvolvimento backend, APIs REST e bancos de dados relacionais.',
        type: VacancyType.JOB,
        status: VacancyStatus.PENDING_APPROVAL,
        remuneration: 5500.0,
        workload: 40,
        modality: 'HIBRIDO',
        eligibleCourses: ['BSI', 'ENG_MECANICA', 'TEC_INFO_INTEGRADO'],
        responsibilities: '- Desenvolver e manter APIs REST\n- Modelar e otimizar bancos de dados\n- Implementar lógica de negócio complexa\n- Realizar code reviews e mentorias\n- Participar de definições de arquitetura',
        technicalSkills: '- Node.js ou Python (avançado)\n- SQL e bancos relacionais\n- Design de APIs REST\n- Docker e containerização\n- Metodologias ágeis',
        softSkills: '- Liderança técnica\n- Mentalidade de crescimento\n- Resolução de problemas\n- Comunicação efetiva\n- Gestão de tempo',
        benefits: 'Plano de saúde e odontológico, Vale-refeição, Home office, PLR, Day off no aniversário',
        contactInfo: 'Candidaturas pelo LinkedIn ou email: carreiras@inovadata.com.br',
        companyId: inovaDataProfile.id,
      },
    });
  }

  console.log('💼 Vagas criadas');

  // 8. Buscar perfis dos estudantes para criar estágios
  const joaoProfile = await prisma.student.findUnique({
    where: { userId: studentUser.id },
  });

  const mariaProfile = await prisma.student.findUnique({
    where: { userId: studentUser2.id },
  });

  // 9. Criar estágios de exemplo
  if (joaoProfile) {
    await prisma.internship.create({
      data: {
        studentId: joaoProfile.id,
        status: 'IN_ANALYSIS',
        type: 'DIRECT',
        
        // Dados do estudante
        studentGender: 'MALE',
        studentAddressStreet: 'Rua das Flores, 123',
        studentAddressNumber: '123',
        studentAddressDistrict: 'Centro',
        studentAddressCityState: 'Campos dos Goytacazes/RJ',
        studentAddressCep: '28035-310',
        studentPhone: '(22) 99999-1234',
        studentCpf: '123.456.789-01',
        studentCourse: 'BSI',
        studentCoursePeriod: '6º período',
        studentSchoolYear: '2024',

        // Dados da empresa
        companyName: 'DevSolutions Informática Ltda',
        companyCnpj: '11.222.333/0001-44',
        companyRepresentativeName: 'Ana Paula Santos',
        companyRepresentativeRole: 'Gerente de RH',
        companyAddressStreet: 'Av. Pelinca, 789',
        companyAddressNumber: '789',
        companyAddressDistrict: 'Pelinca',
        companyAddressCityState: 'Campos dos Goytacazes/RJ',
        companyAddressCep: '28035-200',
        companyEmail: 'rh@devsolutions.com.br',
        companyPhone: '(22) 3333-5678',

        // Detalhes do estágio
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
        technicalActivities: 'Desenvolvimento de aplicações web, manutenção de sistemas, testes de software e documentação técnica.',

        // Seguro
        insuranceCompany: 'Seguradora Proteção Total',
        insurancePolicyNumber: 'APL-2024-001234',
        insuranceCompanyCnpj: '55.666.777/0001-88',
        insuranceStartDate: new Date('2024-02-15'),
        insuranceEndDate: new Date('2024-12-15'),
      },
    });
  }

  if (mariaProfile) {
    await prisma.internship.create({
      data: {
        studentId: mariaProfile.id,
        status: 'APPROVED',
        type: 'INTEGRATOR',
        
        // Dados da estudante
        studentGender: 'FEMALE',
        studentAddressStreet: 'Rua São José, 456',
        studentAddressNumber: '456',
        studentAddressDistrict: 'Guarus',
        studentAddressCityState: 'Campos dos Goytacazes/RJ',
        studentAddressCep: '28060-090',
        studentPhone: '(22) 98888-5678',
        studentCpf: '987.654.321-09',
        studentCourse: 'TEC_INFO_INTEGRADO',
        studentCoursePeriod: '3º ano',
        studentSchoolYear: '2024',

        // Dados da empresa
        companyName: 'TechInova Sistemas',
        companyCnpj: '22.333.444/0001-55',
        companyRepresentativeName: 'João Carlos Mendes',
        companyRepresentativeRole: 'Coordenador de Projetos',
        companyAddressStreet: 'Rua Voluntários da Pátria, 321',
        companyAddressNumber: '321',
        companyAddressDistrict: 'Centro',
        companyAddressCityState: 'Campos dos Goytacazes/RJ',
        companyAddressCep: '28035-042',
        companyEmail: 'projetos@techinova.com.br',
        companyPhone: '(22) 2727-9999',

        // Detalhes do estágio
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
        internshipSector: 'Suporte Técnico e Infraestrutura',
        technicalActivities: 'Suporte técnico aos usuários, configuração de equipamentos, manutenção de redes e backup de dados.',

        // Seguro
        insuranceCompany: 'Seguradora Vida & Trabalho',
        insurancePolicyNumber: 'VT-2024-005678',
        insuranceCompanyCnpj: '77.888.999/0001-11',
        insuranceStartDate: new Date('2024-03-01'),
        insuranceEndDate: new Date('2025-02-28'),
      },
    });
  }

  console.log('🎯 Estágios criados');

  console.log('\n✅ Seed concluído! Usuários criados:');
  console.log('📧 Admin: admin@iff.edu.br');
  console.log('📧 Estudante 1: joao.silva@estudante.iff.edu.br (com estágio em análise)');
  console.log('📧 Estudante 2: maria.oliveira@estudante.iff.edu.br (com estágio aprovado)');
  console.log('📧 Empresa 1: rh@techcorp.com.br');
  console.log('📧 Empresa 2: contato@inovadata.com.br');
  console.log('🔐 Senha padrão para todos: 123456');
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