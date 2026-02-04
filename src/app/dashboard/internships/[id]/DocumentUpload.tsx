'use client';

import { useState, useRef } from 'react';
import { DocumentType } from '@prisma/client';

interface DocumentUploadProps {
  internshipId: string;
  allowedTypes?: DocumentType[];
  onUploadSuccess?: () => void;
  disabled?: boolean;
}

const documentTypeLabels: Record<DocumentType, string> = {
  TCE: 'Termo de Compromisso de Estágio (TCE)',
  PAE: 'Plano de Atividades de Estágio (PAE)',
  PERIODIC_REPORT: 'Relatório Periódico',
  TRE: 'Termo de Realização de Estágio (TRE)',
  RFE: 'Relatório Final de Estágio (RFE)',
  SIGNED_CONTRACT: 'TCE + PAE assinados (PDF único)',
  LIFE_INSURANCE: 'Comprovante de Seguro de Vida',
};

export default function DocumentUpload({
  internshipId,
  allowedTypes,
  onUploadSuccess,
  disabled = false,
}: DocumentUploadProps) {
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tipos permitidos (todos por padrão ou apenas os especificados)
  const availableTypes = allowedTypes || Object.keys(documentTypeLabels) as DocumentType[];

  // Validar arquivo selecionado
  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return 'Apenas arquivos PDF, JPEG e PNG são permitidos';
    }

    if (file.size > maxSize) {
      return 'Arquivo muito grande. Tamanho máximo: 10MB';
    }

    return null;
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
        setError('');
        setSuccess('');
      }
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
        setError('');
        setSuccess('');
      }
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedType) {
      setError('Selecione o tipo de documento');
      return;
    }

    if (!selectedFile) {
      setError('Selecione um arquivo para enviar');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', selectedType);

      const response = await fetch(`/api/internships/${internshipId}/documents`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar documento');
      }

      setSuccess(data.message || 'Documento enviado com sucesso!');
      setSelectedFile(null);
      setSelectedType('');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Callback de sucesso
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setSelectedFile(null);
    setSelectedType('');
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Enviar Documento</h3>

      {/* Mensagens de erro e sucesso */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md text-sm">
          {success}
        </div>
      )}

      {/* Seleção de tipo de documento */}
      <div className="mb-4">
        <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Documento *
        </label>
        <select
          id="documentType"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as DocumentType)}
          disabled={disabled || uploading}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="" className="text-gray-500">Selecione o tipo de documento</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {documentTypeLabels[type]}
            </option>
          ))}
        </select>
      </div>

      {/* Área de upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Arquivo *
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50'
          } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-green-400'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={disabled || uploading}
            className="hidden"
          />

          {selectedFile ? (
            <div className="text-sm">
              <p className="font-medium text-gray-700">📄 {selectedFile.name}</p>
              <p className="text-gray-500 mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
                disabled={uploading}
              >
                Remover arquivo
              </button>
            </div>
          ) : (
            <div>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-green-600">Clique para selecionar</span> ou arraste o arquivo aqui
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PDF, JPEG ou PNG (máx. 10MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!selectedType || !selectedFile || uploading || disabled}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {uploading ? 'Enviando...' : 'Enviar Documento'}
        </button>
        
        {(selectedFile || selectedType) && !uploading && (
          <button
            onClick={handleReset}
            disabled={uploading || disabled}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
