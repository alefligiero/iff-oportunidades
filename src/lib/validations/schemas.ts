import { z } from 'zod';
import { Gender, Course, InternshipModality, VacancyType, InternshipStatus, DocumentType, DocumentStatus } from '@prisma/client';

// ===== SCHEMAS DE AUTENTICAÇÃO =====

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(1, { message: 'A senha é obrigatória' }),
});

export const registerSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres' }),
  role: z.enum(['STUDENT', 'COMPANY'], { message: 'Role inválido' }),
  name: z.string().min(3, { message: 'O nome é obrigatório' }),
  document: z.string().min(5, { message: 'Documento inválido' }),
});

// ===== SCHEMAS DE USUÁRIO =====

export const updateUserSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }).optional(),
  name: z.string().min(3, { message: 'O nome é obrigatório' }).optional(),
});

export const updateUserProfileSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um formato de email válido.' }).optional(),
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }).optional(),
  matricula: z.string().optional().refine((val) => {
    if (!val) return true;
    const unmasked = val.replace(/[^\d]/g, '');
    return unmasked.length === 12;
  }, { message: 'A matrícula deve conter exatamente 12 números.' }),
  cnpj: z.string().optional().refine((val) => {
    if (!val) return true;
    const unmasked = val.replace(/[^\d]/g, '');
    return unmasked.length === 14;
  }, { message: 'O CNPJ deve conter 14 números.' }),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'A senha atual é obrigatória.' }),
  newPassword: z.string().min(6, { message: 'A nova senha deve ter no mínimo 6 caracteres.' }),
});

// ===== SCHEMAS DE ESTÁGIO =====

export const createInternshipSchema = z.object({
  studentGender: z.nativeEnum(Gender, { message: 'Gênero inválido' }),
  studentAddressStreet: z.string().min(1, 'O endereço é obrigatório.'),
  studentAddressNumber: z.string().min(1, 'O número é obrigatório.'),
  studentAddressDistrict: z.string().min(1, 'O bairro é obrigatório.'),
  studentAddressCityState: z.string().min(1, 'A cidade/estado é obrigatória.'),
  studentAddressCep: z.string().min(1, 'O CEP é obrigatório.'),
  studentPhone: z.string().min(1, 'O telefone é obrigatório.'),
  studentCpf: z.string().min(1, 'O CPF é obrigatório.'),
  studentCourse: z.nativeEnum(Course, { message: 'Curso inválido' }),
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
  modality: z.nativeEnum(InternshipModality, { message: 'Modalidade inválida' }),
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

export const updateInternshipStatusSchema = z.object({
  status: z.nativeEnum(InternshipStatus, { message: 'Status inválido' }),
  rejectionReason: z.string().optional(),
});

export const updateInternshipSchema = createInternshipSchema.partial();

// ===== SCHEMAS DE VAGA =====

export const createVacancySchema = z.object({
  title: z.string()
    .min(1, 'O título é obrigatório.')
    .min(5, 'O título deve ter pelo menos 5 caracteres.')
    .max(100, 'O título não pode ter mais de 100 caracteres.'),
  description: z.string()
    .min(1, 'A descrição é obrigatória.')
    .min(10, 'A descrição deve ter pelo menos 10 caracteres.')
    .max(1000, 'A descrição não pode ter mais de 1000 caracteres.'),
  type: z.nativeEnum(VacancyType, { required_error: 'O tipo de vaga é obrigatório' }),
  remuneration: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(String(val).replace(/[^0-9,.]/g, '').replace('.', '').replace(',', '.'))),
    z.number({ required_error: 'A remuneração é obrigatória.', invalid_type_error: 'A remuneração deve ser um número.' })
      .min(0, 'O valor não pode ser negativo.')
      .max(100000, 'Valor muito alto. Verifique se está correto.')
  ),
  workload: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number({ required_error: 'A carga horária é obrigatória.', invalid_type_error: 'A carga horária deve ser um número.' })
      .int('A carga horária deve ser um número inteiro.')
      .positive('A carga horária deve ser positiva.')
      .min(4, 'A carga horária mínima é 4 horas por semana.')
      .max(44, 'A carga horária não pode ultrapassar 44 horas por semana.')
  ),
  // Novos campos
  modality: z.enum(['PRESENCIAL', 'HIBRIDO', 'REMOTO'], { 
    required_error: 'A modalidade é obrigatória',
    invalid_type_error: 'Selecione uma modalidade válida'
  }),
  eligibleCourses: z.array(z.nativeEnum(Course))
    .min(1, 'Selecione pelo menos um curso elegível')
    .max(11, 'Você selecionou todos os cursos. Isso pode não ser necessário.'),
  minPeriod: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number()
      .int('O período deve ser um número inteiro.')
      .positive('O período deve ser positivo.')
      .min(1, 'O período mínimo é 1.')
      .max(10, 'O período não pode ser maior que 10.')
      .optional()
  ),
  responsibilities: z.string()
    .min(1, 'As responsabilidades são obrigatórias.')
    .min(10, 'As responsabilidades devem ter pelo menos 10 caracteres.')
    .max(2000, 'As responsabilidades não podem ter mais de 2000 caracteres.'),
  technicalSkills: z.string()
    .min(1, 'As habilidades técnicas são obrigatórias.')
    .min(10, 'As habilidades técnicas devem ter pelo menos 10 caracteres.')
    .max(2000, 'As habilidades técnicas não podem ter mais de 2000 caracteres.'),
  softSkills: z.string()
    .min(1, 'As habilidades comportamentais são obrigatórias.')
    .min(10, 'As habilidades comportamentais devem ter pelo menos 10 caracteres.')
    .max(2000, 'As habilidades comportamentais não podem ter mais de 2000 caracteres.'),
  benefits: z.string()
    .max(1000, 'Os benefícios não podem ter mais de 1000 caracteres.')
    .optional(),
  contactInfo: z.string()
    .min(1, 'As informações de contato são obrigatórias.')
    .min(5, 'As informações de contato devem ter pelo menos 5 caracteres.')
    .max(500, 'As informações de contato não podem ter mais de 500 caracteres.'),
});

export const updateVacancyStatusSchema = z.object({
  status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CLOSED_BY_COMPANY'], { 
    message: 'Status inválido' 
  }),
});

export const updateVacancySchema = createVacancySchema.partial();

// ===== SCHEMAS DE DOCUMENTO =====

export const createDocumentSchema = z.object({
  type: z.nativeEnum(DocumentType, { message: 'Tipo de documento inválido' }),
  fileUrl: z.string().url({ message: 'URL do arquivo inválida' }).optional(),
});

export const updateDocumentStatusSchema = z.object({
  status: z.nativeEnum(DocumentStatus, { message: 'Status inválido' }),
  rejectionComments: z.string().optional(),
});

// ===== SCHEMAS DE PARÂMETROS =====

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
});

// ===== SCHEMAS DE QUERY =====

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const internshipFiltersSchema = z.object({
  status: z.nativeEnum(InternshipStatus).optional(),
  course: z.nativeEnum(Course).optional(),
  modality: z.nativeEnum(InternshipModality).optional(),
});

export const vacancyFiltersSchema = z.object({
  type: z.nativeEnum(VacancyType).optional(),
  status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CLOSED_BY_COMPANY']).optional(),
});

// ===== SCHEMAS DE VALIDAÇÃO DE DADOS ESPECÍFICOS =====

export const cpfSchema = z.string().regex(
  /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  'CPF deve estar no formato 000.000.000-00'
);

export const cnpjSchema = z.string().regex(
  /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  'CNPJ deve estar no formato 00.000.000/0000-00'
);

export const cepSchema = z.string().regex(
  /^\d{5}-?\d{3}$/,
  'CEP deve estar no formato 00000-000'
);

export const phoneSchema = z.string().regex(
  /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  'Telefone deve estar no formato (00) 00000-0000'
);

// ===== SCHEMAS COMPOSTOS =====

export const studentProfileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  matricula: z.string().min(1, 'Matrícula é obrigatória'),
});

export const companyProfileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cnpj: cnpjSchema,
});

// ===== TIPOS DERIVADOS =====

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateInternshipInput = z.infer<typeof createInternshipSchema>;
export type UpdateInternshipInput = z.infer<typeof updateInternshipSchema>;
export type UpdateInternshipStatusInput = z.infer<typeof updateInternshipStatusSchema>;
export type CreateVacancyInput = z.infer<typeof createVacancySchema>;
export type UpdateVacancyInput = z.infer<typeof updateVacancySchema>;
export type UpdateVacancyStatusInput = z.infer<typeof updateVacancyStatusSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentStatusInput = z.infer<typeof updateDocumentStatusSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type InternshipFilters = z.infer<typeof internshipFiltersSchema>;
export type VacancyFilters = z.infer<typeof vacancyFiltersSchema>;

