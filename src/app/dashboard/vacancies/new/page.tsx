'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VacancyType } from '@prisma/client';

type FormErrors = { [key: string]: string };
type FormData = {
  title: string;
  description: string;
  type: VacancyType | '';
};

export default function NewVacancyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (name: string, value: string) => {
    if (!value.trim()) {
      return 'Este campo é obrigatório.';
    }
    if (name === 'title' && value.length < 5) {
      return 'O título deve ter no mínimo 5 caracteres.';
    }
    if (name === 'description' && value.length < 20) {
      return 'A descrição deve ter no mínimo 20 caracteres.';
    }
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let formIsValid = true;
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof FormData]);
      if (error) {
        newErrors[key] = error;
        formIsValid = false;
      }
    });

    setErrors(newErrors);
    if (!formIsValid) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/company/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
      setErrors(prev => ({ ...prev, form: 'Não foi possível conectar ao servidor.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClassName = (fieldName: string) => {
    return `input-form ${errors[fieldName] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`;
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Publicar Nova Vaga</h1>
      <form onSubmit={handleSubmit} noValidate className="space-y-6 bg-white p-8 rounded-lg shadow-md">
        <fieldset className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título da Vaga</label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={getInputClassName('title')}
              placeholder="Ex: Desenvolvedor Web Jr."
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo de Vaga</label>
            <select
              name="type"
              id="type"
              value={formData.type}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={getInputClassName('type')}
            >
              <option value="">Selecione...</option>
              <option value={VacancyType.INTERNSHIP}>Estágio</option>
              <option value={VacancyType.JOB}>Emprego</option>
            </select>
            {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição Completa da Vaga</label>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleInputChange}
              onBlur={handleBlur}
              rows={8}
              className={getInputClassName('description')}
              placeholder="Descreva as responsabilidades, requisitos, benefícios, etc."
            ></textarea>
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
          </div>
        </fieldset>

        {errors.form && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">{errors.form}</div>}

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={isLoading} className="button-primary px-6 py-2">
            {isLoading ? 'Enviando...' : 'Enviar para Aprovação'}
          </button>
        </div>
      </form>
    </div>
  );
}

