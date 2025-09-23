'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VacancyType } from '@prisma/client';
import CurrencyInput from 'react-currency-input-field';
import { createVacancySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

type FormErrors = { [key: string]: string };
type FormData = z.infer<typeof createVacancySchema>;

export default function VacancyForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<FormData>>({
    title: '',
    description: '',
    type: undefined,
    remuneration: undefined,
    workload: undefined,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'workload' ? (value === '' ? undefined : Number(value)) : value,
    }));
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
        setErrors(data.details || { form: data.error || 'Ocorreu um erro.' });
        throw new Error('Falha na submissão do formulário');
      }

      alert('Vaga enviada para aprovação com sucesso!');
      router.push('/dashboard/vacancies');
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrors(prev => ({
        ...prev,
        form: 'Não foi possível conectar ao servidor.',
      }));
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
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Título da Vaga
          </label>
          <input
            type="text"
            name="title"
            id="title"
            value={formData.title || ''}
            onChange={handleInputChange}
            className={getInputClassName('title')}
            placeholder="Ex: Desenvolvedor Web Jr."
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700"
          >
            Tipo de Vaga
          </label>
          <select
            name="type"
            id="type"
            value={formData.type || ''}
            onChange={handleInputChange}
            className={getInputClassName('type')}
          >
            <option value="">Selecione...</option>
            <option value={VacancyType.INTERNSHIP}>Estágio</option>
            <option value={VacancyType.JOB}>Emprego</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-xs text-red-600">{errors.type}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="remuneration"
              className="block text-sm font-medium text-gray-700"
            >
              Remuneração
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
              Carga Horária (h/semana)
            </label>
            <input
              type="number"
              name="workload"
              id="workload"
              value={formData.workload || ''}
              onChange={handleInputChange}
              className={getInputClassName('workload')}
              placeholder="Ex: 30"
            />
            {errors.workload && (
              <p className="mt-1 text-xs text-red-600">{errors.workload}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Descrição Completa da Vaga
          </label>
          <textarea
            name="description"
            id="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            rows={8}
            className={getInputClassName('description')}
            placeholder="Descreva as responsabilidades, requisitos, benefícios, etc."
          ></textarea>
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description}</p>
          )}
        </div>
      </fieldset>

      {errors.form && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {errors.form}
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
