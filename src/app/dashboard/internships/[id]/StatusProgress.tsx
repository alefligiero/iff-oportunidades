'use client';

interface StatusProgressProps {
  status: string; // InternshipStatus
}

export default function StatusProgress({ status }: StatusProgressProps) {
  const steps = [
    { key: 'created', label: 'Criado', icon: '📝' },
    { key: 'analysis', label: 'Em Análise', icon: '🔍' },
    { key: 'approved', label: 'Aprovado', icon: '✅' },
    { key: 'signatures', label: 'Assinaturas', icon: '✍️' },
    { key: 'progress', label: 'Em Andamento', icon: '⚙️' },
    { key: 'finished', label: 'Finalizado', icon: '🎉' },
  ];

  const getCurrentStepIndex = () => {
    switch (status) {
      case 'IN_ANALYSIS':
        return 1;
      case 'APPROVED':
        return 2;
      case 'IN_PROGRESS':
        return 4;
      case 'FINISHED':
        return 5;
      case 'CANCELED':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex();

  if (status === 'CANCELED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">❌ Este estágio foi recusado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Status do Fluxo</h3>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.key} className="flex flex-col items-center flex-1">
            {/* Círculo do passo */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
                index <= currentStepIndex
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.icon}
            </div>
            {/* Label do passo */}
            <p
              className={`text-xs mt-2 text-center font-medium ${
                index <= currentStepIndex ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {step.label}
            </p>
            {/* Linha conectora */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-1/2 w-full h-0.5 top-5 transition-colors ${
                  index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                }`}
                style={{
                  width: `calc(100% / ${steps.length})`,
                  marginLeft: `-${100 / (2 * steps.length)}%`,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
