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
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    const hasInsuranceData = Boolean(
      formData.insuranceCompany.trim() ||
      formData.insurancePolicyNumber.trim() ||
      formData.insuranceCompanyCnpj.trim() ||
      formData.insuranceStartDate ||
      formData.insuranceEndDate
    );

    const newErrors: Record<string, string> = {};
    if (!formData.insuranceCompany.trim()) newErrors.insuranceCompany = 'Informe a seguradora.';
    if (!formData.insurancePolicyNumber.trim()) newErrors.insurancePolicyNumber = 'Informe o numero da apolice.';
    if (!formData.insuranceCompanyCnpj.trim()) newErrors.insuranceCompanyCnpj = 'Informe o CNPJ da seguradora.';
    if (!formData.insuranceStartDate) newErrors.insuranceStartDate = 'Informe o inicio da vigencia.';
    if (!formData.insuranceEndDate) newErrors.insuranceEndDate = 'Informe o fim da vigencia.';
    if (!insuranceFile) newErrors.insuranceFile = 'Envie o comprovante do seguro.';

    if (Object.keys(newErrors).length > 0 || !hasInsuranceData || !insuranceFile) {
      setErrors(newErrors);
      addNotification('warning', 'Preencha todos os dados e envie o comprovante.');
      return;
    }

    setErrors({});

    setIsLoading(true);

    try {
      const payload = new FormData();
      payload.append('insuranceCompany', formData.insuranceCompany.trim());
      payload.append('insurancePolicyNumber', formData.insurancePolicyNumber.trim());
      payload.append('insuranceCompanyCnpj', formData.insuranceCompanyCnpj.replace(/\D/g, ''));
      payload.append('insuranceStartDate', formData.insuranceStartDate);
      payload.append('insuranceEndDate', formData.insuranceEndDate);
      payload.append('insurance', insuranceFile);

      const response = await fetch(`/api/internships/${internshipId}/insurance`, {
        method: 'PATCH',
        credentials: 'include',
        body: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar dados do seguro');
      }

      addNotification('success', 'Dados do seguro atualizados com sucesso!');
      setIsEditing(false);
      setInsuranceFile(null);
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
          Envie os dados do seguro junto com o comprovante nesta secao.
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            {errors.insuranceCompany && (
              <p className="mt-1 text-xs text-red-600">{errors.insuranceCompany}</p>
            )}
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            {errors.insurancePolicyNumber && (
              <p className="mt-1 text-xs text-red-600">{errors.insurancePolicyNumber}</p>
            )}
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            {errors.insuranceCompanyCnpj && (
              <p className="mt-1 text-xs text-red-600">{errors.insuranceCompanyCnpj}</p>
            )}
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
            />
            {errors.insuranceStartDate && (
              <p className="mt-1 text-xs text-red-600">{errors.insuranceStartDate}</p>
            )}
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
            />
            {errors.insuranceEndDate && (
              <p className="mt-1 text-xs text-red-600">{errors.insuranceEndDate}</p>
            )}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comprovante do Seguro *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setInsuranceFile(e.target.files?.[0] || null)}
            className="hidden"
            id="insurance-proof"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => document.getElementById('insurance-proof')?.click()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
            >
              {insuranceFile ? 'Alterar arquivo' : 'Selecionar arquivo'}
            </button>
            {insuranceFile && (
              <span className="text-sm text-gray-700">✓ {insuranceFile.name}</span>
            )}
          </div>
          {errors.insuranceFile && (
            <p className="mt-1 text-xs text-red-600">{errors.insuranceFile}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Envie o comprovante junto com os dados do seguro. Formatos aceitos: PDF, JPEG, PNG.
          </p>
        </div>
      </form>
    </div>
  );
}
