import VacancyForm from './VacancyForm';

export default function NewVacancyPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Publicar Nova Vaga
      </h1>
      <VacancyForm />
    </div>
  );
}

