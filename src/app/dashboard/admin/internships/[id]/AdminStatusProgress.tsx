'use client';

interface AdminStatusProgressProps {
  status: string; // InternshipStatus
}

export default function AdminStatusProgress({ status }: AdminStatusProgressProps) {
  const steps = [
    { key: 'received', label: 'Recebido', icon: '📥' },
    { key: 'review', label: 'Revisão', icon: '🔍' },
    { key: 'documents', label: 'Documentos', icon: '📋' },
    { key: 'approval', label: 'Aprovação', icon: '✅' },
    { key: 'finished', label: 'Finalizado', icon: '🎉' },
  ];

  const getCurrentStepIndex = () => {
    switch (status) {
      case 'IN_ANALYSIS':
        return 1;
      case 'APPROVED':
        return 3;
      case 'IN_PROGRESS':
        return 3;
      case 'FINISHED':
        return 4;
      case 'REJECTED':
        return -1;
      case 'CANCELED':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex();

  if (status === 'REJECTED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">❌ Este estágio foi recusado na análise</p>
      </div>
    );
  }

  if (status === 'CANCELED') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-800 font-medium">🚫 Este estágio foi cancelado por expiração do prazo</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-6">Status da Análise (Admin)</h3>
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => (
          <div key={step.key} className="flex-1 flex flex-col items-center">
            {/* Step Circle and Label */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
                  index <= currentStepIndex
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.icon}
              </div>
              <p
                className={`text-xs font-medium mt-2 text-center ${
                  index <= currentStepIndex ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {step.label}
              </p>
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-1 mt-3 transition-colors bg-gradient-to-r" style={{
                backgroundImage: index < currentStepIndex 
                  ? 'linear-gradient(to right, rgb(34, 197, 94), rgb(34, 197, 94))'
                  : 'linear-gradient(to right, rgb(209, 213, 219), rgb(209, 213, 219))'
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
