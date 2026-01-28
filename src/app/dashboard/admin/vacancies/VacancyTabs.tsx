'use client';

import { VacancyStatus } from '@prisma/client';

type TabStatus = VacancyStatus | 'CLOSED';

const statusConfig: Record<TabStatus, { label: string; color: string }> = {
  PENDING_APPROVAL: { label: 'Pendentes', color: 'border-b-yellow-400 text-yellow-700' },
  APPROVED: { label: 'Aprovadas', color: 'border-b-green-400 text-green-700' },
  REJECTED: { label: 'Rejeitadas', color: 'border-b-red-400 text-red-700' },
  CLOSED: { label: 'Fechadas', color: 'border-b-gray-400 text-gray-700' },
};

const statusOrder: TabStatus[] = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CLOSED'];

interface VacancyTabsProps {
  activeStatus: TabStatus;
  onStatusChange: (status: TabStatus) => void;
  counts: { [key in VacancyStatus]: number };
}

export default function VacancyTabs({ activeStatus, onStatusChange, counts }: VacancyTabsProps) {
  const getTabCount = (tab: TabStatus) => {
    if (tab === 'CLOSED') {
      return (counts['CLOSED_BY_COMPANY'] || 0) + (counts['CLOSED_BY_ADMIN'] || 0);
    }
    return counts[tab as VacancyStatus] || 0;
  };

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
              {getTabCount(status)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
