'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/contexts/NotificationContext';

interface InsuranceDataFormProps {
  internshipId: string;
  currentData: {
    insuranceCompany: string | null;
    insurancePolicyNumber: string | null;
    insuranceCompanyCnpj: string | null;
    insuranceStartDate: Date | null;
    insuranceEndDate: Date | null;
  };
}

export default function InsuranceDataForm({ internshipId, currentData }: InsuranceDataFormProps) {
  const router = useRouter();
  const { addNotification } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    insuranceCompany: currentData.insuranceCompany || '',
    insurancePolicyNumber: currentData.insurancePolicyNumber || '',
    insuranceCompanyCnpj: currentData.insuranceCompanyCnpj || '',
    insuranceStartDate: currentData.insuranceStartDate 
      ? new Date(currentData.insuranceStartDate).toISOString().split('T')[0] 
      : '',
    insuranceEndDate: currentData.insuranceEndDate 
      ? new Date(currentData.insuranceEndDate).toISOString().split('T')[0] 
      : '',
  });

  const maskCNPJ = (value: string) => 
    value.replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'insuranceCompanyCnpj' ? maskCNPJ(value) : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/internships/${internshipId}/insurance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          insuranceCompany: formData.insuranceCompany,
          insurancePolicyNumber: formData.insurancePolicyNumber,
          insuranceCompanyCnpj: formData.insuranceCompanyCnpj.replace(/\D/g, ''),
          insuranceStartDate: formData.insuranceStartDate || null,
          insuranceEndDate: formData.insuranceEndDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar dados do seguro');
      }

      addNotification('success', 'Dados do seguro atualizados com sucesso!');
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      addNotification('error', error instanceof Error ? error.message : 'Erro ao atualizar');
    } finally {
      setIsLoading(false);
    }
  };

  const hasData = currentData.insuranceCompany || currentData.insurancePolicyNumber;

  if (!isEditing && hasData) {
    return null;
  }

  if (!isEditing) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800 font-medium mb-2">
          ⚠️ Dados do seguro não preenchidos
        </p>
        <p className="text-sm text-amber-700 mb-3">
          Preencha os dados do seguro de vida quando obtiver o comprovante.
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
        >
          Preencher dados do seguro
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Seguro de Vida</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="insuranceCompany" className="block text-sm font-medium text-gray-700 mb-1">
              Seguradora *
            </label>
            <input
              type="text"
              id="insuranceCompany"
              name="insuranceCompany"
              value={formData.insuranceCompany}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="insurancePolicyNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Número da Apólice *
            </label>
            <input
              type="text"
              id="insurancePolicyNumber"
              name="insurancePolicyNumber"
              value={formData.insurancePolicyNumber}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="insuranceCompanyCnpj" className="block text-sm font-medium text-gray-700 mb-1">
              CNPJ da Seguradora *
            </label>
            <input
              type="text"
              id="insuranceCompanyCnpj"
              name="insuranceCompanyCnpj"
              value={formData.insuranceCompanyCnpj}
              onChange={handleChange}
              placeholder="00.000.000/0000-00"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="insuranceStartDate" className="block text-sm font-medium text-gray-700 mb-1">
              Início da Vigência *
            </label>
            <input
              type="date"
              id="insuranceStartDate"
              name="insuranceStartDate"
              value={formData.insuranceStartDate}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="insuranceEndDate" className="block text-sm font-medium text-gray-700 mb-1">
              Fim da Vigência *
            </label>
            <input
              type="date"
              id="insuranceEndDate"
              name="insuranceEndDate"
              value={formData.insuranceEndDate}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:bg-green-300"
          >
            {isLoading ? 'Salvando...' : 'Salvar dados'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
