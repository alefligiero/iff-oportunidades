'use client';

import { InternshipStatus } from '@prisma/client';

const statusConfig = {
  IN_ANALYSIS: { label: 'Pendentes', color: 'border-b-yellow-400 text-yellow-700' },
  APPROVED: { label: 'Aprovados', color: 'border-b-blue-400 text-blue-700' },
  IN_PROGRESS: { label: 'Em Andamento', color: 'border-b-green-400 text-green-700' },
  FINISHED: { label: 'Concluídos', color: 'border-b-gray-400 text-gray-700' },
  REJECTED: { label: 'Recusados', color: 'border-b-red-400 text-red-700' },
  CANCELED: { label: 'Cancelados', color: 'border-b-gray-400 text-gray-700' },
};

const statusOrder: InternshipStatus[] = ['IN_ANALYSIS', 'APPROVED', 'IN_PROGRESS', 'FINISHED', 'REJECTED', 'CANCELED'];

interface InternshipTabsProps {
  activeStatus: InternshipStatus;
  onStatusChange: (status: InternshipStatus) => void;
  counts: { [key in InternshipStatus]: number };
}

export default function InternshipTabs({ activeStatus, onStatusChange, counts }: InternshipTabsProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <div className="flex space-x-8">
        {statusOrder.map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={`py-3 px-1 text-sm font-medium transition-colors ${
              activeStatus === status
                ? `border-b-2 ${statusConfig[status].color}`
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {statusConfig[status].label}
            <span className="ml-2 text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full">
              {counts[status] || 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
