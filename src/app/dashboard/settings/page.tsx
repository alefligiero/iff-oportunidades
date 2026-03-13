'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface UserData {
  email: string;
  name: string;
  matricula?: string;
  cnpj?: string;
}

type FieldErrors = {
  name?: string;
  email?: string;
  matricula?: string;
  cnpj?: string;
};

interface AdminSettingsData {
  requireLifeInsuranceForNewInternships: boolean;
  updatedAt?: string;
}

interface CourseItem {
  code: string;
  name: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loadingAdminSettings, setLoadingAdminSettings] = useState(false);
  const [savingAdminSettings, setSavingAdminSettings] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [editingCourseCode, setEditingCourseCode] = useState<string | null>(null);
  const [editingCourseName, setEditingCourseName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [adminSettings, setAdminSettings] = useState<AdminSettingsData>({
    requireLifeInsuranceForNewInternships: false,
  });

  // Dados pessoais
  const [userData, setUserData] = useState<UserData>({
    email: '',
    name: '',
    matricula: '',
    cnpj: '',
  });

  // Senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchAdminSettings();
      fetchAdminCourses();
    }
  }, [user?.role]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setUserData({
          email: data.email || '',
          name: data.name || '',
          matricula: data.matricula || '',
          cnpj: data.cnpj ? formatCNPJ(data.cnpj) : '',
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminSettings = async () => {
    setLoadingAdminSettings(true);
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar configuracoes administrativas.');
      }

      setAdminSettings({
        requireLifeInsuranceForNewInternships: Boolean(data.requireLifeInsuranceForNewInternships),
        updatedAt: data.updatedAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configuracoes administrativas.');
    } finally {
      setLoadingAdminSettings(false);
    }
  };

  const fetchAdminCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await fetch('/api/admin/courses?includeInactive=true');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar cursos.');
      }

      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cursos.');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) {
      return;
    }

    setSavingCourse(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCourseName.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar curso.');
      }

      setNewCourseName('');
      setMessage('Curso criado com sucesso!');
      await fetchAdminCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar curso.');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleSaveCourseName = async (code: string) => {
    if (!editingCourseName.trim()) {
      return;
    }

    setSavingCourse(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/admin/courses/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCourseName.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar curso.');
      }

      setEditingCourseCode(null);
      setEditingCourseName('');
      setMessage('Curso atualizado com sucesso!');
      await fetchAdminCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar curso.');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleToggleCourse = async (code: string, nextState: boolean) => {
    setSavingCourse(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/admin/courses/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextState }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar status do curso.');
      }

      setMessage(nextState ? 'Curso reativado com sucesso!' : 'Curso desativado com sucesso!');
      await fetchAdminCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status do curso.');
    } finally {
      setSavingCourse(false);
    }
  };

  const formatCNPJ = (value: string) => {
    if (!value) return value;
    const cnpj = value.replace(/[^\d]/g, '');
  
    if (cnpj.length <= 2) return cnpj;
    if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
    if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
    if (cnpj.length <= 12) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
  };

  const validateField = (fieldName: keyof FieldErrors): string | undefined => {
    switch (fieldName) {
      case 'name':
        return !userData.name ? 'O campo de nome é obrigatório.' : undefined;
      case 'email':
        if (!userData.email) return 'O campo de email é obrigatório.';
        if (!/\S+@\S+\.\S+/.test(userData.email)) return 'Por favor, insira um formato de email válido.';
        return undefined;
      case 'matricula':
        if (user?.role === 'STUDENT') {
          const unmasked = userData.matricula?.replace(/[^\d]/g, '') || '';
          if (!unmasked) return 'O campo de matrícula é obrigatório.';
          if (unmasked.length !== 12) return 'A matrícula deve conter exatamente 12 números.';
        }
        return undefined;
      case 'cnpj':
        if (user?.role === 'COMPANY') {
          const unmasked = userData.cnpj?.replace(/[^\d]/g, '') || '';
          if (!unmasked) return 'O campo de CNPJ é obrigatório.';
          if (unmasked.length !== 14) return 'O CNPJ deve conter 14 números.';
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (fieldName: keyof FieldErrors) => {
    const errorMsg = validateField(fieldName);
    setFieldErrors(prev => ({ ...prev, [fieldName]: errorMsg }));
  };

  const handleCnpjChange = (value: string) => {
    setUserData({ ...userData, cnpj: formatCNPJ(value) });
    if (fieldErrors.cnpj) {
      setFieldErrors(prev => ({ ...prev, cnpj: undefined }));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validar todos os campos
    const nameError = validateField('name');
    const emailError = validateField('email');
    const matriculaError = validateField('matricula');
    const cnpjError = validateField('cnpj');

    const newErrors: FieldErrors = {};
    if (nameError) newErrors.name = nameError;
    if (emailError) newErrors.email = emailError;
    if (matriculaError) newErrors.matricula = matriculaError;
    if (cnpjError) newErrors.cnpj = cnpjError;

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setSaving(true);

    try {
      // Remover formatação do CNPJ antes de enviar
      const payload = {
        ...userData,
        cnpj: userData.cnpj?.replace(/[^\d]/g, ''),
      };

      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Dados atualizados com sucesso!');
        setFieldErrors({});
        // Recarregar dados atualizados
        await fetchUserData();
      } else {
        setError(data.error || 'Erro ao atualizar dados.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Nova senha e confirmação não coincidem.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch('/api/users/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Senha alterada com sucesso!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.error || 'Erro ao alterar senha.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveAdminSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSavingAdminSettings(true);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requireLifeInsuranceForNewInternships: adminSettings.requireLifeInsuranceForNewInternships,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar configuracoes administrativas.');
      }

      setAdminSettings((prev) => ({
        ...prev,
        updatedAt: data.updatedAt,
      }));
      setMessage('Configuracoes administrativas atualizadas com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuracoes administrativas.');
    } finally {
      setSavingAdminSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Configurações da Conta</h1>

      {/* Mensagens de feedback */}
      {message && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {user?.role === 'ADMIN' && (
        <div className="space-y-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">Configuracoes Administrativas</h2>
            <p className="text-sm text-gray-600 mb-4">
              Controle se novas solicitacoes de estagio exigem dados de seguro e comprovante.
            </p>

            {loadingAdminSettings ? (
              <p className="text-sm text-gray-600">Carregando configuracoes...</p>
            ) : (
              <form onSubmit={handleSaveAdminSettings}>
                <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={adminSettings.requireLifeInsuranceForNewInternships}
                    onChange={(e) =>
                      setAdminSettings((prev) => ({
                        ...prev,
                        requireLifeInsuranceForNewInternships: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-800">
                    Exigir dados do seguro de vida e comprovante para novas solicitacoes de estagio
                  </span>
                </label>

                {adminSettings.updatedAt && (
                  <p className="mt-2 text-xs text-gray-500">
                    Ultima atualizacao: {new Date(adminSettings.updatedAt).toLocaleString('pt-BR')}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={savingAdminSettings}
                  className="mt-4 bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition-colors font-medium disabled:opacity-50"
                >
                  {savingAdminSettings ? 'Salvando...' : 'Salvar Configuracoes'}
                </button>
              </form>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">Gerenciar Cursos</h2>
            <p className="text-sm text-gray-600 mb-4">
              Adicione, edite e desative cursos disponiveis para estagios e vagas.
            </p>

            <form onSubmit={handleCreateCourse} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Nome do novo curso"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              />
              <button
                type="submit"
                disabled={savingCourse || !newCourseName.trim()}
                className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition-colors disabled:opacity-50"
              >
                Adicionar
              </button>
            </form>

            {loadingCourses ? (
              <p className="text-sm text-gray-600">Carregando cursos...</p>
            ) : (
              <div className="space-y-2">
                {courses.map((course) => (
                  <div key={course.code} className="border border-gray-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="min-w-0">
                      {editingCourseCode === course.code ? (
                        <input
                          type="text"
                          value={editingCourseName}
                          onChange={(e) => setEditingCourseName(e.target.value)}
                          className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                        />
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-900">{course.name}</p>
                          <p className="text-xs text-gray-500">Codigo: {course.code}</p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {editingCourseCode === course.code ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveCourseName(course.code)}
                            disabled={savingCourse || !editingCourseName.trim()}
                            className="px-3 py-1.5 text-sm bg-green-700 text-white rounded-md hover:bg-green-800 disabled:opacity-50"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourseCode(null);
                              setEditingCourseName('');
                            }}
                            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourseCode(course.code);
                              setEditingCourseName(course.name);
                            }}
                            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleCourse(course.code, !course.isActive)}
                            disabled={savingCourse}
                            className={`px-3 py-1.5 text-sm rounded-md disabled:opacity-50 ${course.isActive ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                          >
                            {course.isActive ? 'Desativar' : 'Reativar'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dados Pessoais */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Dados Pessoais</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome {user?.role === 'COMPANY' ? 'da Empresa' : 'Completo'}
              </label>
              <input
                type="text"
                id="name"
                value={userData.name}
                onChange={(e) => {
                  setUserData({ ...userData, name: e.target.value });
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
                }}
                onBlur={() => handleBlur('name')}
                className={`w-full px-3 py-2 border ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 ${fieldErrors.name ? 'focus:ring-red-500' : 'focus:ring-green-500'} text-gray-900`}
                required
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                value={userData.email}
                onChange={(e) => {
                  setUserData({ ...userData, email: e.target.value });
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                }}
                onBlur={() => handleBlur('email')}
                className={`w-full px-3 py-2 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 ${fieldErrors.email ? 'focus:ring-red-500' : 'focus:ring-green-500'} text-gray-900`}
                required
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>

            {user?.role === 'STUDENT' && (
              <div>
                <label htmlFor="matricula" className="block text-sm font-medium text-gray-700 mb-1">
                  Matrícula
                </label>
                <input
                  type="text"
                  id="matricula"
                  value={userData.matricula || ''}
                  onChange={(e) => {
                    setUserData({ ...userData, matricula: e.target.value });
                    if (fieldErrors.matricula) setFieldErrors(prev => ({ ...prev, matricula: undefined }));
                  }}
                  onBlur={() => handleBlur('matricula')}
                  placeholder="Ex: 202019700392"
                  maxLength={12}
                  className={`w-full px-3 py-2 border ${fieldErrors.matricula ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 ${fieldErrors.matricula ? 'focus:ring-red-500' : 'focus:ring-green-500'} text-gray-900`}
                  required
                />
                {fieldErrors.matricula && <p className="mt-1 text-xs text-red-600">{fieldErrors.matricula}</p>}
              </div>
            )}

            {user?.role === 'COMPANY' && (
              <div>
                <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  id="cnpj"
                  value={userData.cnpj || ''}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  onBlur={() => handleBlur('cnpj')}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className={`w-full px-3 py-2 border ${fieldErrors.cnpj ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 ${fieldErrors.cnpj ? 'focus:ring-red-500' : 'focus:ring-green-500'} text-gray-900`}
                  required
                />
                {fieldErrors.cnpj && <p className="mt-1 text-xs text-red-600">{fieldErrors.cnpj}</p>}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>

      {/* Alterar Senha */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Alterar Senha</h2>
        <form onSubmit={handleChangePassword}>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Senha Atual
              </label>
              <input
                type="password"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition-colors font-medium disabled:opacity-50"
          >
            {changingPassword ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
