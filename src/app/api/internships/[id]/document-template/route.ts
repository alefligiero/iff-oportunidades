import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Course } from '@prisma/client';

const courseMap: Record<Course, string> = {
  BSI: 'Bacharelado em Sistemas de Informação',
  LIC_QUIMICA: 'Licenciatura em Química',
  ENG_MECANICA: 'Engenharia Mecânica',
  TEC_ADM_INTEGRADO: 'Técnico em Administração Integrado ao Ensino Médio',
  TEC_ELETRO_INTEGRADO: 'Técnico em Eletrotécnica Integrado ao Ensino Médio',
  TEC_INFO_INTEGRADO: 'Técnico em Informática Integrado ao Ensino Médio',
  TEC_QUIMICA_INTEGRADO: 'Técnico em Química Integrado ao Ensino Médio',
  TEC_AUTOMACAO_SUBSEQUENTE: 'Técnico em Automação Subsequente',
  TEC_ELETRO_CONCOMITANTE: 'Técnico em Eletrotécnica Concomitante',
  TEC_MECANICA_CONCOMITANTE: 'Técnico em Mecânica Concomitante',
  TEC_QUIMICA_CONCOMITANTE: 'Técnico em Química Concomitante',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const internship = await prisma.internship.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        company: true,
      },
    });

    if (!internship) {
      return NextResponse.json({ error: 'Estágio não encontrado' }, { status: 404 });
    }

    // Carregar o template tre.html
    const templatePath = path.join(process.cwd(), 'tre.html');
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 500 });
    }

    let html = fs.readFileSync(templatePath, 'utf-8');

    // Preparar dados para substituição
    const startDate = format(new Date(internship.startDate), 'dd/MM/yyyy');
    const endDate = format(new Date(internship.endDate), 'dd/MM/yyyy');
    const studentName = internship.student?.name || 'Não informado';
    const studentCourse = courseMap[internship.studentCourse] || internship.studentCourse;
    const studentMatricula = internship.student?.matricula || 'Não informado';
    const companyName = internship.company?.fantasyName || internship.companyName || 'Não informado';

    // Realizar substituições (usando regex para lidar com fragmentação do pdf2htmlEX se necessário)
    // Mas primeiro tentamos substituição simples
    
    // Nome do Estagiário
    html = html.replace(/Alef Ligie<span class="_ _1"><\/span>ro Alvim Garcia Bastos/g, studentName);
    html = html.replace(/Alef Ligiero Alvi<span class="_ _0"><\/span>m Garcia Basto<span class="_ _0"><\/span>s <span class="_ _1"><\/span>\(ou respo<span class="_ _0"><\/span>nsável legal\)/g, `${studentName} (ou responsável legal)`);
    
    // Curso e Matrícula
    html = html.replace(/Bacharelado em Sistemas de Informação/g, studentCourse);
    html = html.replace(/202019700392/g, studentMatricula);
    
    // Série e Ano/Semestre
    html = html.replace(/7º/g, internship.studentCoursePeriod);
    html = html.replace(/2023\/1/g, internship.studentSchoolYear);
    
    // Dados da Concedente
    html = html.replace(/T Maior Services LTDA/g, companyName);
    
    // Datas
    html = html.replace(/14\/08\/2023/g, startDate);
    html = html.replace(/14\/02\/2024/g, endDate);
    
    // Carga Horária
    html = html.replace(/30h semanais/g, `${internship.weeklyHours}h semanais`);
    html = html.replace(/09:00 às 16:00h com 1 hora de almoço/g, internship.dailyHours);
    
    // Orientador e Supervisor
    html = html.replace(/Jonnathan dos Santos Carvalho/g, internship.advisorProfessorName);
    html = html.replace(/Jonnathan do<span class="_ _0"><\/span>s Santos Carvalho/g, internship.advisorProfessorName);
    html = html.replace(/\(<span class="ls7">2582804<\/span>\)/g, `(${internship.advisorProfessorId || ''})`);
    html = html.replace(/2582804/g, internship.advisorProfessorId || '');
    
    html = html.replace(/Aline Pratti/g, internship.supervisorName);
    html = html.replace(/Aline Pratti \(Instru<span class="_ _0"><\/span>tora Técnica\)/g, `${internship.supervisorName} (${internship.supervisorRole})`);
    html = html.replace(/Instrutora Técnica/g, internship.supervisorRole);
    html = html.replace(/Setor Técnico/g, internship.internshipSector);

    // Atividades Técnicas (Isso é mais difícil por causa das múltiplas linhas)
    // Vamos tentar substituir a primeira atividade e remover as outras, ou algo assim.
    // Melhor: substituir o bloco de atividades.
    const activities = internship.technicalActivities.split('\n').filter(a => a.trim() !== '');
    // Regex para encontrar as atividades originais
    // <div class="t m0 x16 h7 yb4 ff3 fs4 fc0 sc0 ls0 ws0">Desenvolverá habilidades para mapear e executar cenários de testes; </div>
    // ... até yba
    
    // Substituição simplificada: vamos apenas trocar os textos conhecidos
    const originalActivities = [
      "Desenvolverá habilidades para mapear e executar cenários de testes;",
      "Analisará possíveis falhas e melhorias nos entregáveis;",
      "Desenvolverá atividades em parceria com o time de DevOps;",
      "Apoio a gestão dos serviços em nuvem AWS;",
      "Apoio a gestão de projetos de infraestrutura;",
      "Registro de atividades no sistema de suporte de TI."
    ];

    originalActivities.forEach((act, index) => {
      if (activities[index]) {
        html = html.replace(act, activities[index]);
      } else {
        html = html.replace(act, '');
      }
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error: unknown) {
    console.error('Erro ao gerar documento:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
