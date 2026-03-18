import Link from 'next/link';
import { InternshipStatus, InternshipType } from '@prisma/client';

interface DownloadOfficialDocumentCardProps {
  internshipId: string;
  status: InternshipStatus;
  internshipType: InternshipType;
}

export default function DownloadOfficialDocumentCard({
  internshipId,
  status,
  internshipType,
}: DownloadOfficialDocumentCardProps) {
  const canDownloadOfficialDocument =
    status === InternshipStatus.APPROVED && internshipType !== InternshipType.INTEGRATOR;

  if (!canDownloadOfficialDocument) {
    return null;
  }

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
      <h3 className="text-base font-semibold text-blue-900 mb-3">Documento Oficial TCE/PAE</h3>
      <Link
        href={`/dashboard/internships/${internshipId}/document`}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
      >
        <span>📄</span>
        <span>Baixar TCE/PAE oficial</span>
      </Link>
    </div>
  );
}