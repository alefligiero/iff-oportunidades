'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Course, Gender, InternshipModality, InternshipType, Internship } from '@prisma/client';

type PrefilledData = { name: string; email: string; matricula: string; } | null;
type FormErrors = { [key: string]: string; };
type FormData = { [key: string]: string | number };

const courseLabels: { [key in Course]: string } = {
  [Course.BSI]: 'Bacharelado em Sistemas de Informação',
  [Course.LIC_QUIMICA]: 'Licenciatura em Química',
  [Course.ENG_MECANICA]: 'Bacharelado em Engenharia Mecânica',
  [Course.TEC_ADM_INTEGRADO]: 'Técnico em Administração Integrado',
  [Course.TEC_ELETRO_INTEGRADO]: 'Técnico em Eletrotécnica Integrado',
  [Course.TEC_INFO_INTEGRADO]: 'Técnico em Informática Integrado',
  [Course.TEC_QUIMICA_INTEGRADO]: 'Técnico em Química Integrado',
  [Course.TEC_AUTOMACAO_SUBSEQUENTE]: 'Técnico em Automação Industrial Subsequente',
  [Course.TEC_ELETRO_CONCOMITANTE]: 'Técnico em Eletrotécnica Concomitante',
  [Course.TEC_MECANICA_CONCOMITANTE]: 'Técnico em Mecânica Concomitante',
  [Course.TEC_QUIMICA_CONCOMITANTE]: 'Técnico em Química Concomitante',
};

export default function InternshipForm({ 
  prefilledData,
  internshipData,
  isEditing = false 
}: { 
  prefilledData: PrefilledData,
  internshipData?: Internship | null,
  isEditing?: boolean
}) {
  const router = useRouter();
  const [internshipType, setInternshipType] = useState<InternshipType>(InternshipType.DIRECT);
  const [tceFile, setTceFile] = useState<File | null>(null);
  const [paeFile, setPaeFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const tceInputRef = useRef<HTMLInputElement>(null);
  const paeInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    studentGender: '',
    studentAddressStreet: '',
    studentAddressNumber: '',
    studentAddressDistrict: '',
    studentAddressCityState: '',
    studentAddressCep: '',
    studentPhone: '',
    studentCpf: '',
    studentCourse: '',
    studentCoursePeriod: '',
    studentSchoolYear: '',
    companyName: '',
    companyCnpj: '',
    companyRepresentativeName: '',
    companyRepresentativeRole: '',
    companyAddressStreet: '',
    companyAddressNumber: '',
    companyAddressDistrict: '',
    companyAddressCityState: '',
    companyAddressCep: '',
    companyEmail: '',
    companyPhone: '',
    modality: '',
    startDate: '',
    endDate: '',
    weeklyHours: '',
    dailyHours: '',
    monthlyGrant: '',
    transportationGrant: '',
    advisorProfessorName: '',
    advisorProfessorId: '',
    supervisorName: '',
    supervisorRole: '',
    internshipSector: '',
    technicalActivities: '',
    insuranceCompany: '',
    insurancePolicyNumber: '',
    insuranceCompanyCnpj: '',
    insuranceStartDate: '',
    insuranceEndDate: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // --- Funções de Máscara ---
  const maskCPF = (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
  const maskCEP = (value: string) => value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
  const maskPhone = (value: string) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4,5})(\d{4})/, '$1-$2').slice(0, 15);
  const maskCNPJ = (value: string) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
  const maskCurrency = (value: string) => {
    let v = value.replace(/\D/g, '');
    if (!v) return '';
    v = (parseInt(v, 10) / 100).toFixed(2) + '';
    v = v.replace(".", ",");
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return "R$ " + v;
  };
  const formatDateForInput = (date: Date | null | undefined) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  useEffect(() => {
    if (isEditing && internshipData) {
      setFormData({
        studentGender: internshipData.studentGender,
        studentAddressStreet: internshipData.studentAddressStreet,
        studentAddressNumber: internshipData.studentAddressNumber,
        studentAddressDistrict: internshipData.studentAddressDistrict,
        studentAddressCityState: internshipData.studentAddressCityState,
        studentAddressCep: maskCEP(internshipData.studentAddressCep),
        studentPhone: maskPhone(internshipData.studentPhone),
        studentCpf: maskCPF(internshipData.studentCpf),
        studentCourse: internshipData.studentCourse,
        studentCoursePeriod: internshipData.studentCoursePeriod,
        studentSchoolYear: internshipData.studentSchoolYear,
        companyName: internshipData.companyName,
        companyCnpj: maskCNPJ(internshipData.companyCnpj),
        companyRepresentativeName: internshipData.companyRepresentativeName,
        companyRepresentativeRole: internshipData.companyRepresentativeRole,
        companyAddressStreet: internshipData.companyAddressStreet,
        companyAddressNumber: internshipData.companyAddressNumber,
        companyAddressDistrict: internshipData.companyAddressDistrict,
        companyAddressCityState: internshipData.companyAddressCityState,
        companyAddressCep: maskCEP(internshipData.companyAddressCep),
        companyEmail: internshipData.companyEmail,
        companyPhone: maskPhone(internshipData.companyPhone),
        modality: internshipData.modality,
        startDate: formatDateForInput(internshipData.startDate),
        endDate: formatDateForInput(internshipData.endDate),
        weeklyHours: internshipData.weeklyHours,
        dailyHours: internshipData.dailyHours,
        monthlyGrant: maskCurrency(String(internshipData.monthlyGrant * 100)),
        transportationGrant: maskCurrency(String(internshipData.transportationGrant * 100)),
        advisorProfessorName: internshipData.advisorProfessorName,
        advisorProfessorId: internshipData.advisorProfessorId,
        supervisorName: internshipData.supervisorName,
        supervisorRole: internshipData.supervisorRole,
        internshipSector: internshipData.internshipSector,
        technicalActivities: internshipData.technicalActivities,
        insuranceCompany: internshipData.insuranceCompany,
        insurancePolicyNumber: internshipData.insurancePolicyNumber,
        insuranceCompanyCnpj: maskCNPJ(internshipData.insuranceCompanyCnpj),
        insuranceStartDate: formatDateForInput(internshipData.insuranceStartDate),
        insuranceEndDate: formatDateForInput(internshipData.insuranceEndDate),
      });
    }
  }, [isEditing, internshipData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue: string | number = value;
    
    if (name === 'studentCpf') finalValue = maskCPF(value);
    else if (name === 'studentAddressCep' || name === 'companyAddressCep') finalValue = maskCEP(value);
    else if (name === 'studentPhone' || name === 'companyPhone') finalValue = maskPhone(value);
    else if (name === 'companyCnpj' || name === 'insuranceCompanyCnpj') finalValue = maskCNPJ(value);
    else if (name === 'monthlyGrant' || name === 'transportationGrant') finalValue = maskCurrency(value);
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const validateField = (name: string, value: string | number) => {
    if (typeof value === 'string' && !value.trim()) {
        return 'Este campo é obrigatório.';
    }
    // Adicionar outras validações específicas aqui se necessário
    return '';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validação específica por tipo
    if (internshipType === InternshipType.INTEGRATOR) {
      // Via Agente Integrador - apenas TCE e PAE obrigatórios
      if (!tceFile) {
        setErrors({ tce: 'TCE é obrigatório para estágios via Agente Integrador' });
        return;
      }
      if (!paeFile) {
        setErrors({ pae: 'PAE é obrigatório para estágios via Agente Integrador' });
        return;
      }
    } else {
      // Estágio Direto - validar formulário completo
      let formIsValid = true;
      const newErrors: FormErrors = {};
      Object.keys(formData).forEach(key => {
        const error = validateField(key, formData[key]);
        if (error) {
          newErrors[key] = error;
          formIsValid = false;
        }
      });

      setErrors(newErrors);
      if (!formIsValid) return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Tipo de estágio
      formDataToSend.append('type', internshipType);
      
      if (internshipType === InternshipType.INTEGRATOR) {
        // Via Agente Integrador - apenas uploads
        formDataToSend.append('tce', tceFile!);
        formDataToSend.append('pae', paeFile!);
      } else {
        // Estágio Direto - dados completos + seguro opcional
        const unmaskCurrency = (value: string) => parseFloat(value.replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
        const unmaskNumbers = (value: string) => value.replace(/\D/g, '');

        const apiData = {
          ...formData,
          type: InternshipType.DIRECT,
          studentCpf: unmaskNumbers(formData.studentCpf as string),
          studentAddressCep: unmaskNumbers(formData.studentAddressCep as string),
          studentPhone: unmaskNumbers(formData.studentPhone as string),
          companyCnpj: unmaskNumbers(formData.companyCnpj as string),
          companyAddressCep: unmaskNumbers(formData.companyAddressCep as string),
          companyPhone: unmaskNumbers(formData.companyPhone as string),
          insuranceCompanyCnpj: unmaskNumbers(formData.insuranceCompanyCnpj as string),
          monthlyGrant: unmaskCurrency(formData.monthlyGrant as string),
          transportationGrant: unmaskCurrency(formData.transportationGrant as string),
          weeklyHours: parseInt(formData.weeklyHours as string, 10),
        };

        // Adicionar dados do formulário
        formDataToSend.append('data', JSON.stringify(apiData));
        
        // Upload opcional de seguro
        if (insuranceFile) {
          formDataToSend.append('insurance', insuranceFile);
        }
      }

      const url = isEditing ? `/api/internships/${internshipData?.id}` : '/api/internships';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: formDataToSend,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.details || { form: data.error || 'Ocorreu um erro.' });
        throw new Error('Falha na submissão do formulário');
      }

      alert(`Estágio ${isEditing ? 'atualizado' : 'formalizado'} com sucesso!`);
      router.push('/dashboard/internships');
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
    <form onSubmit={handleSubmit} noValidate className="space-y-8 bg-white p-8 rounded-lg shadow-md">
      {/* --- SELEÇÃO DO TIPO DE ESTÁGIO --- */}
      {!isEditing && (
        <fieldset className="space-y-4 border-2 border-green-200 rounded-lg p-6 bg-green-50">
          <legend className="text-lg font-semibold text-gray-900 px-2">Tipo de Estágio</legend>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
              internshipType === InternshipType.DIRECT 
                ? 'border-green-600 bg-green-100' 
                : 'border-gray-300 bg-white hover:border-green-400'
            }`}>
              <input
                type="radio"
                name="internshipType"
                value={InternshipType.DIRECT}
                checked={internshipType === InternshipType.DIRECT}
                onChange={() => setInternshipType(InternshipType.DIRECT)}
                className="mr-3 h-4 w-4 text-green-600"
              />
              <div>
                <span className="font-medium text-gray-900">Estágio Direto</span>
                <p className="text-sm text-gray-600">Preencher formulário completo</p>
              </div>
            </label>

            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
              internshipType === InternshipType.INTEGRATOR 
                ? 'border-green-600 bg-green-100' 
                : 'border-gray-300 bg-white hover:border-green-400'
            }`}>
              <input
                type="radio"
                name="internshipType"
                value={InternshipType.INTEGRATOR}
                checked={internshipType === InternshipType.INTEGRATOR}
                onChange={() => setInternshipType(InternshipType.INTEGRATOR)}
                className="mr-3 h-4 w-4 text-green-600"
              />
              <div>
                <span className="font-medium text-gray-900">Via Agente Integrador</span>
                <p className="text-sm text-gray-600">Apenas enviar TCE e PAE</p>
              </div>
            </label>
          </div>
        </fieldset>
      )}

      {/* --- MODO AGENTE INTEGRADOR --- */}
      {internshipType === InternshipType.INTEGRATOR && !isEditing && (
        <>
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Dados do Aluno</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input type="text" value={prefilledData?.name || ''} disabled className="input-form-disabled mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Matrícula</label>
                <input type="text" value={prefilledData?.matricula || ''} disabled className="input-form-disabled mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={prefilledData?.email || ''} disabled className="input-form-disabled mt-1" />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Documentos Obrigatórios</legend>
            
            {errors.form && <p className="text-red-600 text-sm">{errors.form}</p>}
            
            {/* TCE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Termo de Compromisso de Estágio (TCE) *
              </label>
              <input
                ref={tceInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => setTceFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => tceInputRef.current?.click()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Selecionar TCE
                </button>
                {tceFile && (
                  <span className="text-sm text-gray-700">
                    ✓ {tceFile.name}
                  </span>
                )}
              </div>
              {errors.tce && <p className="text-red-600 text-sm mt-1">{errors.tce}</p>}
            </div>

            {/* PAE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plano de Atividades de Estágio (PAE) *
              </label>
              <input
                ref={paeInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => setPaeFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => paeInputRef.current?.click()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Selecionar PAE
                </button>
                {paeFile && (
                  <span className="text-sm text-gray-700">
                    ✓ {paeFile.name}
                  </span>
                )}
              </div>
              {errors.pae && <p className="text-red-600 text-sm mt-1">{errors.pae}</p>}
            </div>
          </fieldset>

          {/* Seção de Informações Adicionais (Opcional para INTEGRATOR) */}
          <fieldset className="space-y-4 border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
            <legend className="text-lg font-semibold text-gray-900 px-2">
              📋 Informações Adicionais (Opcional)
            </legend>
            <p className="text-sm text-gray-700 mb-4">
              Os detalhes do seu estágio (datas, supervisor, remuneração, etc.) estão contidos nos arquivos TCE e PAE que você está enviando. 
              Você pode preencher os campos abaixo se desejar adicionar informações complementares, mas não é obrigatório.
            </p>

            {/* Setor e Supervisor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="internshipSector" className="block text-sm font-medium text-gray-700">
                  Setor da Empresa <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input 
                  type="text" 
                  name="internshipSector" 
                  id="internshipSector" 
                  value={formData.internshipSector as string} 
                  onChange={handleInputChange} 
                  className="input-form mt-1" 
                />
              </div>
              <div>
                <label htmlFor="supervisorName" className="block text-sm font-medium text-gray-700">
                  Nome do Supervisor <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input 
                  type="text" 
                  name="supervisorName" 
                  id="supervisorName" 
                  value={formData.supervisorName as string} 
                  onChange={handleInputChange} 
                  className="input-form mt-1" 
                />
              </div>
              <div>
                <label htmlFor="supervisorRole" className="block text-sm font-medium text-gray-700">
                  Cargo do Supervisor <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input 
                  type="text" 
                  name="supervisorRole" 
                  id="supervisorRole" 
                  value={formData.supervisorRole as string} 
                  onChange={handleInputChange} 
                  className="input-form mt-1" 
                />
              </div>
              <div>
                <label htmlFor="advisorProfessorName" className="block text-sm font-medium text-gray-700">
                  Professor Orientador <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input 
                  type="text" 
                  name="advisorProfessorName" 
                  id="advisorProfessorName" 
                  value={formData.advisorProfessorName as string} 
                  onChange={handleInputChange} 
                  className="input-form mt-1" 
                />
              </div>
            </div>

            {/* Datas e Carga Horária */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Data de Início <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input 
                  type="date" 
                  name="startDate" 
                  id="startDate" 
                  value={formData.startDate as string} 
                  onChange={handleInputChange} 
                  className="input-form mt-1" 
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  Data de Término <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input 
                  type="date" 
                  name="endDate" 
                  id="endDate" 
                  value={formData.endDate as string} 
                  onChange={handleInputChange} 
                  className="input-form mt-1" 
                />
              </div>
              <div>
                <label htmlFor="weeklyHours" className="block text-sm font-medium text-gray-700">
                  Carga Horária Semanal <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input 
                  type="number" 
                  name="weeklyHours" 
                  id="weeklyHours" 
                  value={formData.weeklyHours as string} 
                  onChange={handleInputChange} 
                  className="input-form mt-1" 
                />
              </div>
            </div>

            {/* Remuneração */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="monthlyGrant" className="block text-sm font-medium text-gray-700">
                  Bolsa Mensal <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input 
                  type="text" 
                  name="monthlyGrant" 
                  id="monthlyGrant" 
                  value={formData.monthlyGrant as string} 
                  onChange={handleInputChange} 
                  className="input-form mt-1" 
                />
              </div>
              <div>
                <label htmlFor="transportationGrant" className="block text-sm font-medium text-gray-700">
                  Auxílio Transporte <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input 
                  type="text" 
                  name="transportationGrant" 
                  id="transportationGrant" 
                  value={formData.transportationGrant as string} 
                  onChange={handleInputChange} 
                  className="input-form mt-1" 
                />
              </div>
            </div>
          </fieldset>
        </>
      )}

      {/* --- MODO ESTÁGIO DIRETO (formulário completo) --- */}
      {internshipType === InternshipType.DIRECT && (
        <>
      {/* --- DADOS DO ALUNO --- */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Dados do Aluno</legend>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <input type="text" value={prefilledData?.name || ''} disabled className="input-form-disabled mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={prefilledData?.email || ''} disabled className="input-form-disabled mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Matrícula</label>
            <input type="text" value={prefilledData?.matricula || ''} disabled className="input-form-disabled mt-1" />
          </div>
          <div>
            <label htmlFor="studentGender" className="block text-sm font-medium text-gray-700">Gênero</label>
            <select name="studentGender" id="studentGender" value={formData.studentGender as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('studentGender')}>
              <option value="">Selecione...</option>
              <option value={Gender.MALE}>Masculino</option>
              <option value={Gender.FEMALE}>Feminino</option>
            </select>
            {errors.studentGender && <p className="mt-1 text-xs text-red-600">{errors.studentGender}</p>}
          </div>
          <div>
            <label htmlFor="studentCpf" className="block text-sm font-medium text-gray-700">CPF</label>
            <input type="text" name="studentCpf" id="studentCpf" value={formData.studentCpf as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('studentCpf')} placeholder="000.000.000-00" />
            {errors.studentCpf && <p className="mt-1 text-xs text-red-600">{errors.studentCpf}</p>}
          </div>
           <div>
              <label htmlFor="studentPhone" className="block text-sm font-medium text-gray-700">Telefone</label>
              <input type="text" name="studentPhone" id="studentPhone" value={formData.studentPhone as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('studentPhone')} placeholder="(00) 00000-0000" />
              {errors.studentPhone && <p className="mt-1 text-xs text-red-600">{errors.studentPhone}</p>}
          </div>
        </div>
        
        <div className="pt-4">
            <h3 className="text-md font-medium text-gray-800">Endereço</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label htmlFor="studentAddressStreet" className="block text-sm font-medium text-gray-700">Rua/Avenida</label>
                <input type="text" name="studentAddressStreet" id="studentAddressStreet" value={formData.studentAddressStreet as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('studentAddressStreet')} />
                {errors.studentAddressStreet && <p className="mt-1 text-xs text-red-600">{errors.studentAddressStreet}</p>}
            </div>
            <div>
                <label htmlFor="studentAddressNumber" className="block text-sm font-medium text-gray-700">Número</label>
                <input type="text" name="studentAddressNumber" id="studentAddressNumber" value={formData.studentAddressNumber as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('studentAddressNumber')} />
                {errors.studentAddressNumber && <p className="mt-1 text-xs text-red-600">{errors.studentAddressNumber}</p>}
            </div>
             <div>
                <label htmlFor="studentAddressDistrict" className="block text-sm font-medium text-gray-700">Bairro</label>
                <input type="text" name="studentAddressDistrict" id="studentAddressDistrict" value={formData.studentAddressDistrict as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('studentAddressDistrict')} />
                {errors.studentAddressDistrict && <p className="mt-1 text-xs text-red-600">{errors.studentAddressDistrict}</p>}
            </div>
        </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
              <label htmlFor="studentAddressCityState" className="block text-sm font-medium text-gray-700">Cidade/Estado</label>
              <input type="text" name="studentAddressCityState" id="studentAddressCityState" value={formData.studentAddressCityState as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('studentAddressCityState')} placeholder="Ex: Itaperuna/RJ" />
              {errors.studentAddressCityState && <p className="mt-1 text-xs text-red-600">{errors.studentAddressCityState}</p>}
          </div>
          <div>
              <label htmlFor="studentAddressCep" className="block text-sm font-medium text-gray-700">CEP</label>
              <input type="text" name="studentAddressCep" id="studentAddressCep" value={formData.studentAddressCep as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('studentAddressCep')} placeholder="00000-000" />
              {errors.studentAddressCep && <p className="mt-1 text-xs text-red-600">{errors.studentAddressCep}</p>}
          </div>
        </div>

        <div className="pt-4">
            <h3 className="text-md font-medium text-gray-800">Dados Acadêmicos</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div>
            <label htmlFor="studentCourse" className="block text-sm font-medium text-gray-700">Curso</label>
            <select name="studentCourse" id="studentCourse" value={formData.studentCourse as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('studentCourse')}>
              <option value="">Selecione o seu curso</option>
              {Object.entries(courseLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            {errors.studentCourse && <p className="mt-1 text-xs text-red-600">{errors.studentCourse}</p>}
          </div>
          <div>
            <label htmlFor="studentCoursePeriod" className="block text-sm font-medium text-gray-700">Série/Período</label>
            <input type="text" name="studentCoursePeriod" id="studentCoursePeriod" value={formData.studentCoursePeriod as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('studentCoursePeriod')} placeholder="Ex: 1º" />
            {errors.studentCoursePeriod && <p className="mt-1 text-xs text-red-600">{errors.studentCoursePeriod}</p>}
          </div>
          <div>
            <label htmlFor="studentSchoolYear" className="block text-sm font-medium text-gray-700">Ano/Semestre Letivo</label>
            <input type="text" name="studentSchoolYear" id="studentSchoolYear" value={formData.studentSchoolYear as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('studentSchoolYear')} placeholder="Ex: 2025/1" />
            {errors.studentSchoolYear && <p className="mt-1 text-xs text-red-600">{errors.studentSchoolYear}</p>}
          </div>
        </div>
      </fieldset>

      {/* --- DADOS DA EMPRESA --- */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Dados da Instituição/Empresa</legend>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Nome da Instituição/Empresa</label>
            <input type="text" name="companyName" id="companyName" value={formData.companyName as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('companyName')} />
            {errors.companyName && <p className="mt-1 text-xs text-red-600">{errors.companyName}</p>}
          </div>
          <div>
            <label htmlFor="companyCnpj" className="block text-sm font-medium text-gray-700">CNPJ/MF</label>
            <input type="text" name="companyCnpj" id="companyCnpj" value={formData.companyCnpj as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('companyCnpj')} placeholder="00.000.000/0000-00" />
            {errors.companyCnpj && <p className="mt-1 text-xs text-red-600">{errors.companyCnpj}</p>}
          </div>
          <div>
            <label htmlFor="companyRepresentativeName" className="block text-sm font-medium text-gray-700">Nome do Representante</label>
            <input type="text" name="companyRepresentativeName" id="companyRepresentativeName" value={formData.companyRepresentativeName as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('companyRepresentativeName')} />
            {errors.companyRepresentativeName && <p className="mt-1 text-xs text-red-600">{errors.companyRepresentativeName}</p>}
          </div>
          <div>
            <label htmlFor="companyRepresentativeRole" className="block text-sm font-medium text-gray-700">Cargo/Função do Representante</label>
            <input type="text" name="companyRepresentativeRole" id="companyRepresentativeRole" value={formData.companyRepresentativeRole as string} onChange={handleInputChange} onBlur={handleBlur} className="input-form mt-1" />
            {errors.companyRepresentativeRole && <p className="mt-1 text-xs text-red-600">{errors.companyRepresentativeRole}</p>}
          </div>
           <div>
              <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">Email de Contato</label>
              <input type="email" name="companyEmail" id="companyEmail" value={formData.companyEmail as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('companyEmail')} />
              {errors.companyEmail && <p className="mt-1 text-xs text-red-600">{errors.companyEmail}</p>}
          </div>
          <div>
              <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700">Telefone de Contato</label>
              <input type="text" name="companyPhone" id="companyPhone" value={formData.companyPhone as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('companyPhone')} placeholder="(00) 0000-0000" />
              {errors.companyPhone && <p className="mt-1 text-xs text-red-600">{errors.companyPhone}</p>}
          </div>
        </div>

        <div className="pt-4">
            <h3 className="text-md font-medium text-gray-800">Endereço da Empresa</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label htmlFor="companyAddressStreet" className="block text-sm font-medium text-gray-700">Rua/Avenida</label>
                <input type="text" name="companyAddressStreet" id="companyAddressStreet" value={formData.companyAddressStreet as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('companyAddressStreet')} />
                {errors.companyAddressStreet && <p className="mt-1 text-xs text-red-600">{errors.companyAddressStreet}</p>}
            </div>
            <div>
                <label htmlFor="companyAddressNumber" className="block text-sm font-medium text-gray-700">Número</label>
                <input type="text" name="companyAddressNumber" id="companyAddressNumber" value={formData.companyAddressNumber as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('companyAddressNumber')} />
                {errors.companyAddressNumber && <p className="mt-1 text-xs text-red-600">{errors.companyAddressNumber}</p>}
            </div>
             <div>
                <label htmlFor="companyAddressDistrict" className="block text-sm font-medium text-gray-700">Bairro</label>
                <input type="text" name="companyAddressDistrict" id="companyAddressDistrict" value={formData.companyAddressDistrict as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('companyAddressDistrict')} />
                {errors.companyAddressDistrict && <p className="mt-1 text-xs text-red-600">{errors.companyAddressDistrict}</p>}
            </div>
        </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
              <label htmlFor="companyAddressCityState" className="block text-sm font-medium text-gray-700">Cidade/Estado</label>
              <input type="text" name="companyAddressCityState" id="companyAddressCityState" value={formData.companyAddressCityState as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('companyAddressCityState')} placeholder="Ex: Itaperuna/RJ" />
              {errors.companyAddressCityState && <p className="mt-1 text-xs text-red-600">{errors.companyAddressCityState}</p>}
          </div>
          <div>
              <label htmlFor="companyAddressCep" className="block text-sm font-medium text-gray-700">CEP</label>
              <input type="text" name="companyAddressCep" id="companyAddressCep" value={formData.companyAddressCep as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('companyAddressCep')} placeholder="00000-000" />
              {errors.companyAddressCep && <p className="mt-1 text-xs text-red-600">{errors.companyAddressCep}</p>}
          </div>
        </div>
      </fieldset>

      {/* --- DETALHES DO ESTÁGIO --- */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Detalhes do Estágio</legend>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="modality" className="block text-sm font-medium text-gray-700">Tipo de Estágio</label>
            <select name="modality" id="modality" value={formData.modality as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('modality')}>
              <option value="">Selecione...</option>
              <option value={InternshipModality.PRESENCIAL}>Presencial</option>
              <option value={InternshipModality.REMOTO}>Remoto</option>
            </select>
            {errors.modality && <p className="mt-1 text-xs text-red-600">{errors.modality}</p>}
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Data de Início</label>
            <input type="date" name="startDate" id="startDate" value={formData.startDate as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('startDate')} />
            {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Data Final</label>
            <input type="date" name="endDate" id="endDate" value={formData.endDate as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('endDate')} />
            {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="weeklyHours" className="block text-sm font-medium text-gray-700">Carga Horária Semanal</label>
            <select name="weeklyHours" id="weeklyHours" value={formData.weeklyHours as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('weeklyHours')}>
              <option value="">Selecione...</option>
              {[10, 15, 20, 25, 30].map(h => <option key={h} value={h}>{h} horas</option>)}
            </select>
            {errors.weeklyHours && <p className="mt-1 text-xs text-red-600">{errors.weeklyHours}</p>}
          </div>
          <div>
            <label htmlFor="dailyHours" className="block text-sm font-medium text-gray-700">Jornada Diária</label>
            <input type="text" name="dailyHours" id="dailyHours" value={formData.dailyHours as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('dailyHours')} placeholder="Ex: 08:00 às 12:00" />
            {errors.dailyHours && <p className="mt-1 text-xs text-red-600">{errors.dailyHours}</p>}
          </div>
          <div>
            <label htmlFor="monthlyGrant" className="block text-sm font-medium text-gray-700">Valor da Bolsa Mensal</label>
            <input type="text" name="monthlyGrant" id="monthlyGrant" value={formData.monthlyGrant as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('monthlyGrant')} placeholder="R$ 0,00" />
            {errors.monthlyGrant && <p className="mt-1 text-xs text-red-600">{errors.monthlyGrant}</p>}
          </div>
          <div>
            <label htmlFor="transportationGrant" className="block text-sm font-medium text-gray-700">Auxílio Transporte Mensal</label>
            <input type="text" name="transportationGrant" id="transportationGrant" value={formData.transportationGrant as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('transportationGrant')} placeholder="R$ 0,00" />
            {errors.transportationGrant && <p className="mt-1 text-xs text-red-600">{errors.transportationGrant}</p>}
          </div>
        </div>

        <div className="pt-4">
            <h3 className="text-md font-medium text-gray-800">Responsáveis pelo Estágio</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="advisorProfessorName" className="block text-sm font-medium text-gray-700">Professor-Orientador</label>
                <input type="text" name="advisorProfessorName" id="advisorProfessorName" value={formData.advisorProfessorName as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('advisorProfessorName')} />
                {errors.advisorProfessorName && <p className="mt-1 text-xs text-red-600">{errors.advisorProfessorName}</p>}
            </div>
            <div>
                <label htmlFor="advisorProfessorId" className="block text-sm font-medium text-gray-700">Matrícula do Professor</label>
                <input type="text" name="advisorProfessorId" id="advisorProfessorId" value={formData.advisorProfessorId as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('advisorProfessorId')} />
                {errors.advisorProfessorId && <p className="mt-1 text-xs text-red-600">{errors.advisorProfessorId}</p>}
            </div>
            <div>
                <label htmlFor="supervisorName" className="block text-sm font-medium text-gray-700">Supervisor de Estágio</label>
                <input type="text" name="supervisorName" id="supervisorName" value={formData.supervisorName as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('supervisorName')} />
                {errors.supervisorName && <p className="mt-1 text-xs text-red-600">{errors.supervisorName}</p>}
            </div>
            <div>
                <label htmlFor="supervisorRole" className="block text-sm font-medium text-gray-700">Cargo/Função do Supervisor</label>
                <input type="text" name="supervisorRole" id="supervisorRole" value={formData.supervisorRole as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('supervisorRole')} />
                {errors.supervisorRole && <p className="mt-1 text-xs text-red-600">{errors.supervisorRole}</p>}
            </div>
        </div>

        <div>
            <label htmlFor="internshipSector" className="block text-sm font-medium text-gray-700">Setor do Estágio</label>
            <input type="text" name="internshipSector" id="internshipSector" value={formData.internshipSector as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('internshipSector')} />
            {errors.internshipSector && <p className="mt-1 text-xs text-red-600">{errors.internshipSector}</p>}
        </div>

        <div>
            <label htmlFor="technicalActivities" className="block text-sm font-medium text-gray-700">Atividades Técnicas Previstas</label>
            <textarea name="technicalActivities" id="technicalActivities" value={formData.technicalActivities as string} onChange={handleInputChange} onBlur={handleBlur} rows={4} className={getInputClassName('technicalActivities')}></textarea>
            {errors.technicalActivities && <p className="mt-1 text-xs text-red-600">{errors.technicalActivities}</p>}
        </div>
      </fieldset>
      
      {/* --- DADOS DO SEGURO --- */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Dados do Seguro de Vida</legend>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="insuranceCompany" className="block text-sm font-medium text-gray-700">Seguradora</label>
            <input type="text" name="insuranceCompany" id="insuranceCompany" value={formData.insuranceCompany as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('insuranceCompany')} />
            {errors.insuranceCompany && <p className="mt-1 text-xs text-red-600">{errors.insuranceCompany}</p>}
          </div>
          <div>
            <label htmlFor="insurancePolicyNumber" className="block text-sm font-medium text-gray-700">Número da Apólice</label>
            <input type="text" name="insurancePolicyNumber" id="insurancePolicyNumber" value={formData.insurancePolicyNumber as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('insurancePolicyNumber')} />
            {errors.insurancePolicyNumber && <p className="mt-1 text-xs text-red-600">{errors.insurancePolicyNumber}</p>}
          </div>
          <div>
            <label htmlFor="insuranceCompanyCnpj" className="block text-sm font-medium text-gray-700">CNPJ da Seguradora</label>
            <input type="text" name="insuranceCompanyCnpj" id="insuranceCompanyCnpj" value={formData.insuranceCompanyCnpj as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('insuranceCompanyCnpj')} placeholder="00.000.000/0000-00" />
            {errors.insuranceCompanyCnpj && <p className="mt-1 text-xs text-red-600">{errors.insuranceCompanyCnpj}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="insuranceStartDate" className="block text-sm font-medium text-gray-700">Início da Vigência</label>
              <input type="date" name="insuranceStartDate" id="insuranceStartDate" value={formData.insuranceStartDate as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('insuranceStartDate')} />
              {errors.insuranceStartDate && <p className="mt-1 text-xs text-red-600">{errors.insuranceStartDate}</p>}
            </div>
            <div>
              <label htmlFor="insuranceEndDate" className="block text-sm font-medium text-gray-700">Fim da Vigência</label>
              <input type="date" name="insuranceEndDate" id="insuranceEndDate" value={formData.insuranceEndDate as string} onChange={handleInputChange} onBlur={handleBlur} className={getInputClassName('insuranceEndDate')} />
              {errors.insuranceEndDate && <p className="mt-1 text-xs text-red-600">{errors.insuranceEndDate}</p>}
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comprovante do Seguro (Opcional)
          </label>
          <input
            ref={insuranceInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setInsuranceFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => insuranceInputRef.current?.click()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
            >
              {insuranceFile ? 'Alterar arquivo' : 'Selecionar arquivo'}
            </button>
            {insuranceFile && (
              <span className="text-sm text-gray-700">
                ✓ {insuranceFile.name}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Você pode enviar agora ou depois na seção de documentos. Formatos aceitos: PDF, JPEG, PNG
          </p>
        </div>
      </fieldset>
        </>
      )}
      
      <div className="pt-4 flex justify-end">
        <button type="submit" disabled={isLoading} className="button-primary px-6 py-2">
            {isLoading ? 'A enviar...' : (isEditing ? 'Atualizar Estágio' : 'Enviar Formalização')}
        </button>
      </div>
    </form>
  );
}
