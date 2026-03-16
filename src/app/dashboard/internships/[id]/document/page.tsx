'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function InternshipDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    try {
      setDownloading(true);
      setError(null);

      const response = await fetch(`/api/internships/${params.id}/document-file?format=pdf`);

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Não foi possível gerar o documento.');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      const fileName = contentDisposition?.match(/filename="?([^\"]+)"?/)?.[1] || 'tce-pae.pdf';
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      setError(error instanceof Error ? error.message : 'Erro ao baixar documento.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Voltar
        </button>
      </div>

      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8 text-black">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Baixar TCE/PAE oficial</h1>
        <p className="text-sm text-gray-700 leading-6 mb-6">
          O documento é gerado diretamente a partir do modelo oficial, preservando cabeçalho,
          formatação, assinaturas e quebras de página do arquivo original.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloading ? 'Gerando PDF...' : 'Baixar PDF oficial'}
        </button>
      </div>
    </div>
  );
}
