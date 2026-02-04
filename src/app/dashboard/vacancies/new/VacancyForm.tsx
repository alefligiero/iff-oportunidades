'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/contexts/NotificationContext';
import { VacancyType, Course } from '@prisma/client';
import CurrencyInput from 'react-currency-input-field';
import { createVacancySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

type FormErrors = { [key: string]: string };
type FormData = z.infer<typeof createVacancySchema>;

const courseLabels: Record<Course, string> = {
  BSI: 'Bacharelado em Sistemas de Informação',
  LIC_QUIMICA: 'Licenciatura em Química',
  ENG_MECANICA: 'Engenharia Mecânica',
  TEC_ADM_INTEGRADO: 'Técnico em Administração (Integrado)',
  TEC_ELETRO_INTEGRADO: 'Técnico em Eletrotécnica (Integrado)',
  TEC_INFO_INTEGRADO: 'Técnico em Informática (Integrado)',
  TEC_QUIMICA_INTEGRADO: 'Técnico em Química (Integrado)',
  TEC_AUTOMACAO_SUBSEQUENTE: 'Técnico em Automação (Subsequente)',
  TEC_ELETRO_CONCOMITANTE: 'Técnico em Eletrotécnica (Concomitante)',
  TEC_MECANICA_CONCOMITANTE: 'Técnico em Mecânica (Concomitante)',
  TEC_QUIMICA_CONCOMITANTE: 'Técnico em Química (Concomitante)',
};

export default function VacancyForm() {
  const router = useRouter();
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState<Partial<FormData>>({
    title: '',
    description: '',
    type: undefined,
    remuneration: undefined,
    workload: undefined,
    modality: undefined,
    eligibleCourses: [],
    minPeriod: undefined,
    responsibilities: '',
    technicalSkills: '',
    softSkills: '',
    benefits: '',
    contactInfo: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // Converter para número se for workload ou minPeriod
    const processedValue = (name === 'workload' || name === 'minPeriod') && value 
      ? Number(value) 
      : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    // Limpar erro do campo quando usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (fieldName: string) => {
    // Validar campo individual ao perder o foco
    const result = createVacancySchema.safeParse(formData);
    if (!result.success) {
      const fieldError = result.error.issues.find(
        issue => issue.path[0] === fieldName
      );
      if (fieldError) {
        setErrors(prev => ({ ...prev, [fieldName]: fieldError.message }));
      }
    }
  };  const handleCourseChange = (course: Course) => {
    setFormData(prev => {
      const currentCourses = prev.eligibleCourses || [];
      const isSelected = currentCourses.includes(course);
      const newCourses = isSelected
        ? currentCourses.filter(c => c !== course)
        : [...currentCourses, course];
      return {
        ...prev,
        eligibleCourses: newCourses,
      };
    });
    // Limpar erro de eligibleCourses quando seleciona pelo menos um curso
    if (errors.eligibleCourses) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.eligibleCourses;
        return newErrors;
      });
    }
  };

  const handleCurrencyChange = (
    value: string | undefined,
    name: string | undefined,
  ) => {
    if (name) {
      const numberValue = value
        ? parseFloat(value.replace('.', '').replace(',', '.'))
        : undefined;
      setFormData(prev => ({ ...prev, [name]: numberValue }));
      // Limpar erro do campo
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const result = createVacancySchema.safeParse(formData);

    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path[0]] = issue.message;
      });
      setErrors(newErrors);
      
      // Scroll para o primeiro erro
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/company/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      const data = await response.json();

      if (!response.ok) {
        // Se houver detalhes de validação, mostrar cada erro
        if (data.details) {
          setErrors(data.details);
        } else {
          setErrors({ form: data.error || data.message || 'Ocorreu um erro ao enviar a vaga.' });
        }
        return;
      }

      // Sucesso
      addNotification('success', data.message || 'Vaga enviada para aprovação com sucesso!');
      router.push('/dashboard/vacancies');
      router.refresh();
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setErrors({
        form: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClassName = (fieldName: string) => {
    return `input-form ${
      errors[fieldName]
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : ''
    }`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6 bg-white p-8 rounded-lg shadow-md"
    >
      <fieldset className="space-y-4">
        {/* Título */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Título da Vaga *
          </label>
          <input
            type="text"
            name="title"
            id="title"
            value={formData.title || ''}
            onChange={handleInputChange}
            onBlur={() => handleBlur('title')}
            maxLength={100}
            className={getInputClassName('title')}
            placeholder="Ex: Desenvolvedor Web Jr."
            required
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {(formData.title?.length || 0)}/100 caracteres
          </p>
        </div>

        {/* Tipo e Modalidade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700"
            >
              Tipo de Vaga *
            </label>
            <select
              name="type"
              id="type"
              value={formData.type || ''}
              onChange={handleInputChange}
              onBlur={() => handleBlur('type')}
              className={getInputClassName('type')}
              required
            >
              <option value="">Selecione...</option>
              <option value={VacancyType.INTERNSHIP}>Estágio</option>
              <option value={VacancyType.JOB}>Emprego</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-xs text-red-600">{errors.type}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="modality"
              className="block text-sm font-medium text-gray-700"
            >
              Modalidade *
            </label>
            <select
              name="modality"
              id="modality"
              value={formData.modality || ''}
              onChange={handleInputChange}
              onBlur={() => handleBlur('modality')}
              className={getInputClassName('modality')}
              required
            >
              <option value="">Selecione...</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="HIBRIDO">Híbrido</option>
              <option value="REMOTO">Remoto</option>
            </select>
            {errors.modality && (
              <p className="mt-1 text-xs text-red-600">{errors.modality}</p>
            )}
          </div>
        </div>

        {/* Remuneração, Carga Horária e Período Mínimo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="remuneration"
              className="block text-sm font-medium text-gray-700"
            >
              Remuneração *
            </label>
            <CurrencyInput
              id="remuneration"
              name="remuneration"
              placeholder="R$ 0,00"
              defaultValue={formData.remuneration}
              decimalsLimit={2}
              decimalSeparator=","
              groupSeparator="."
              prefix="R$ "
              onValueChange={handleCurrencyChange}
              className={getInputClassName('remuneration')}
            />
            {errors.remuneration && (
              <p className="mt-1 text-xs text-red-600">
                {errors.remuneration}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="workload"
              className="block text-sm font-medium text-gray-700"
            >
              Carga Horária (h/semana) *
            </label>
            <input
              type="number"
              name="workload"
              id="workload"
              value={formData.workload || ''}
              onChange={handleInputChange}
              onBlur={() => handleBlur('workload')}
              min="4"
              max="44"
              className={getInputClassName('workload')}
              placeholder="Ex: 30"
              required
            />
            {errors.workload && (
              <p className="mt-1 text-xs text-red-600">{errors.workload}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Entre 4 e 44 horas</p>
          </div>

          {formData.type === VacancyType.INTERNSHIP && (
            <div>
              <label
                htmlFor="minPeriod"
                className="block text-sm font-medium text-gray-700"
              >
                Período Mínimo
              </label>
              <input
                type="number"
                name="minPeriod"
                id="minPeriod"
                value={formData.minPeriod || ''}
                onChange={handleInputChange}
                onBlur={() => handleBlur('minPeriod')}
                className={getInputClassName('minPeriod')}
                placeholder="Ex: 3"
                min="1"
                max="10"
              />
              {errors.minPeriod && (
                <p className="mt-1 text-xs text-red-600">{errors.minPeriod}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Ex: 3 = a partir do 3º período</p>
            </div>
          )}
        </div>

        {/* Cursos Elegíveis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cursos Elegíveis *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-gray-300 rounded-md p-4">
            {Object.entries(courseLabels).map(([value, label]) => (
              <div key={value} className="flex items-center">
                <input
                  type="checkbox"
                  id={`course-${value}`}
                  checked={formData.eligibleCourses?.includes(value as Course) || false}
                  onChange={() => handleCourseChange(value as Course)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`course-${value}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  {label}
                </label>
              </div>
            ))}
          </div>
          {errors.eligibleCourses && (
            <p className="mt-1 text-xs text-red-600">{errors.eligibleCourses}</p>
          )}
        </div>

        {/* Descrição */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Descrição Geral da Vaga *
          </label>
          <textarea
            name="description"
            id="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            onBlur={() => handleBlur('description')}
            rows={4}
            maxLength={1000}
            className={getInputClassName('description')}
            placeholder="Breve descrição sobre a vaga e a oportunidade..."
            required
          ></textarea>
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {(formData.description?.length || 0)}/1000 caracteres
          </p>
        </div>

        {/* Responsabilidades */}
        <div>
          <label
            htmlFor="responsibilities"
            className="block text-sm font-medium text-gray-700"
          >
            Responsabilidades e Atividades *
          </label>
          <textarea
            name="responsibilities"
            id="responsibilities"
            value={formData.responsibilities || ''}
            onChange={handleInputChange}
            onBlur={() => handleBlur('responsibilities')}
            rows={6}
            maxLength={2000}
            className={getInputClassName('responsibilities')}
            placeholder="Liste as principais responsabilidades (uma por linha com hífen)&#10;Exemplo:&#10;- Desenvolver funcionalidades web&#10;- Participar de reuniões de equipe&#10;- Realizar testes de qualidade"
            required
          ></textarea>
          {errors.responsibilities && (
            <p className="mt-1 text-xs text-red-600">{errors.responsibilities}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {(formData.responsibilities?.length || 0)}/2000 caracteres
          </p>
        </div>

        {/* Habilidades Técnicas */}
        <div>
          <label
            htmlFor="technicalSkills"
            className="block text-sm font-medium text-gray-700"
          >
            Conhecimentos Técnicos / Hard Skills *
          </label>
          <textarea
            name="technicalSkills"
            id="technicalSkills"
            value={formData.technicalSkills || ''}
            onChange={handleInputChange}
            onBlur={() => handleBlur('technicalSkills')}
            rows={5}
            maxLength={2000}
            className={getInputClassName('technicalSkills')}
            placeholder="Liste os conhecimentos técnicos necessários&#10;Exemplo:&#10;- JavaScript/TypeScript&#10;- React&#10;- Git e GitHub"
            required
          ></textarea>
          {errors.technicalSkills && (
            <p className="mt-1 text-xs text-red-600">{errors.technicalSkills}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {(formData.technicalSkills?.length || 0)}/2000 caracteres
          </p>
        </div>

        {/* Habilidades Comportamentais */}
        <div>
          <label
            htmlFor="softSkills"
            className="block text-sm font-medium text-gray-700"
          >
            Habilidades Comportamentais / Soft Skills *
          </label>
          <textarea
            name="softSkills"
            id="softSkills"
            value={formData.softSkills || ''}
            onChange={handleInputChange}
            onBlur={() => handleBlur('softSkills')}
            rows={5}
            maxLength={2000}
            className={getInputClassName('softSkills')}
            placeholder="Liste as habilidades comportamentais desejadas&#10;Exemplo:&#10;- Comunicação clara&#10;- Trabalho em equipe&#10;- Proatividade"
            required
          ></textarea>
          {errors.softSkills && (
            <p className="mt-1 text-xs text-red-600">{errors.softSkills}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {(formData.softSkills?.length || 0)}/2000 caracteres
          </p>
        </div>

        {/* Benefícios */}
        <div>
          <label
            htmlFor="benefits"
            className="block text-sm font-medium text-gray-700"
          >
            Benefícios Adicionais
          </label>
          <textarea
            name="benefits"
            id="benefits"
            value={formData.benefits || ''}
            onChange={handleInputChange}
            onBlur={() => handleBlur('benefits')}
            rows={3}
            maxLength={1000}
            className={getInputClassName('benefits')}
            placeholder="Ex: Vale-transporte, Vale-refeição, Plano de saúde, Horário flexível..."
          ></textarea>
          {errors.benefits && (
            <p className="mt-1 text-xs text-red-600">{errors.benefits}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {(formData.benefits?.length || 0)}/1000 caracteres (opcional)
          </p>
        </div>

        {/* Informações de Contato */}
        <div>
          <label
            htmlFor="contactInfo"
            className="block text-sm font-medium text-gray-700"
          >
            Informações de Contato *
          </label>
          <textarea
            name="contactInfo"
            id="contactInfo"
            value={formData.contactInfo || ''}
            onChange={handleInputChange}
            onBlur={() => handleBlur('contactInfo')}
            rows={3}
            maxLength={500}
            className={getInputClassName('contactInfo')}
            placeholder="Como os candidatos devem entrar em contato?&#10;Ex: Enviar currículo para rh@empresa.com.br ou WhatsApp (22) 98765-4321"
            required
          ></textarea>
          {errors.contactInfo && (
            <p className="mt-1 text-xs text-red-600">{errors.contactInfo}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {(formData.contactInfo?.length || 0)}/500 caracteres
          </p>
        </div>
      </fieldset>

      {errors.form && (
        <div className="p-4 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md">
          <p className="font-medium mb-1">❌ Erro ao enviar o formulário:</p>
          <p>{errors.form}</p>
        </div>
      )}

      {Object.keys(errors).length > 0 && !errors.form && (
        <div className="p-4 text-sm text-yellow-800 bg-yellow-100 border border-yellow-200 rounded-md">
          <p className="font-medium mb-1">⚠️ Existem {Object.keys(errors).length} erro(s) no formulário:</p>
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="button-primary px-6 py-2"
        >
          {isLoading ? 'Enviando...' : 'Enviar para Aprovação'}
        </button>
      </div>
    </form>
  );
}
