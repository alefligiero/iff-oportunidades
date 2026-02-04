'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import InternshipsPageContent from './InternshipsPageContent';

interface Internship {
  id: string;
  status: string;
  type: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  student: {
    name: string;
    matricula: string;
  };
}

function InternshipsPageLoader() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/internships/all');
        
        if (!response.ok) {
          throw new Error('Falha ao buscar estágios');
        }

        const data = await response.json();
        setInternships(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar estágios');
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-green-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return <InternshipsPageContent allInternships={internships} />;
}

export default function InternshipsPage() {
  return (
    <AuthGuard requiredRole="ADMIN" redirectTo="/">
      <InternshipsPageLoader />
    </AuthGuard>
  );
}
