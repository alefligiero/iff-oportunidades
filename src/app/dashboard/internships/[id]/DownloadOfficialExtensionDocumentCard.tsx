import Link from 'next/link';
import { InternshipType } from '@prisma/client';

interface DownloadOfficialExtensionDocumentCardProps {
  internshipId: string;
  internshipType: InternshipType;
  internshipExtensionApproved: boolean | null;
}

export default function DownloadOfficialExtensionDocumentCard({
  internshipId,
  internshipType,
  internshipExtensionApproved,
}: DownloadOfficialExtensionDocumentCardProps) {
  const canDownloadOfficialDocument =
    internshipType === InternshipType.DIRECT && internshipExtensionApproved === true;

  if (!canDownloadOfficialDocument) {
    return null;
  }

  return (
    <div className="bg-indigo-50 p-6 rounded-lg shadow-md border border-indigo-200">
      <h3 className="text-base font-semibold text-indigo-900 mb-3">Documento Oficial TCE Aditivo</h3>
      <Link
        href={`/dashboard/internships/${internshipId}/extension-document`}
        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
      >
        <span>📄</span>
        <span>Baixar TCE Aditivo oficial</span>
      </Link>
    </div>
  );
}
