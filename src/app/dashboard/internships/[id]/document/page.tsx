'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InternshipDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const [internship, setInternship] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInternship() {
      try {
        const response = await fetch(`/api/internships/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setInternship(data);
        }
      } catch (error) {
        console.error('Erro ao buscar estágio:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchInternship();
  }, [params.id]);

  if (loading) return <div className="p-8 text-center">Carregando documento...</div>;
  if (!internship) return <div className="p-8 text-center">Estágio não encontrado.</div>;

  const formatDate = (date: string) => format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="min-h-screen bg-gray-100 py-10 print:bg-white print:py-0">
      {/* Botões de Ação - Escondidos na Impressão */}
      <div className="max-w-[21cm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => router.push(`/dashboard/internships/${params.id}`)}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Voltar
        </button>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* Documento A4 */}
      <div className="max-w-[21cm] min-h-[29.7cm] mx-auto bg-white shadow-2xl p-[2cm] text-black font-serif leading-relaxed print:shadow-none print:p-0">

        {/* Cabeçalho */}
        <div className="text-center mb-10">
          <h1 className="text-xl font-bold uppercase mb-1">Instituto Federal de Educação, Ciência e Tecnologia Fluminense</h1>
          <h2 className="text-lg font-semibold uppercase border-b-2 border-black pb-2">Termo de Compromisso de Estágio</h2>
        </div>

        {/* 1. Unidade Concedente */}
        <section className="mb-6">
          <h3 className="font-bold uppercase bg-gray-100 px-2 py-1 mb-2 text-sm border-l-4 border-black">1. Unidade Concedente (Empresa)</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p><strong>Razão Social:</strong> {internship.companyName}</p>
            <p><strong>CNPJ:</strong> {internship.companyCnpj}</p>
            <p className="col-span-2"><strong>Endereço:</strong> {internship.companyAddressStreet}, {internship.companyAddressNumber} - {internship.companyAddressDistrict}</p>
            <p><strong>Cidade/UF:</strong> {internship.companyAddressCityState}</p>
            <p><strong>CEP:</strong> {internship.companyAddressCep}</p>
            <p><strong>Representante:</strong> {internship.companyRepresentativeName}</p>
            <p><strong>Cargo:</strong> {internship.companyRepresentativeRole}</p>
          </div>
        </section>

        {/* 2. Estagiário */}
        <section className="mb-6">
          <h3 className="font-bold uppercase bg-gray-100 px-2 py-1 mb-2 text-sm border-l-4 border-black">2. Estagiário (Aluno)</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p><strong>Nome:</strong> {internship.student?.name || 'Não informado'}</p>
            <p><strong>CPF:</strong> {internship.studentCpf}</p>
            <p><strong>Matrícula:</strong> {internship.student?.matricula || 'Não informado'}</p>
            <p><strong>Curso:</strong> {internship.studentCourse}</p>
            <p className="col-span-2"><strong>Endereço:</strong> {internship.studentAddressStreet}, {internship.studentAddressNumber} - {internship.studentAddressDistrict}</p>
            <p><strong>Cidade/UF:</strong> {internship.studentAddressCityState}</p>
            <p><strong>Telefone:</strong> {internship.studentPhone}</p>
          </div>
        </section>

        {/* 3. Plano de Estágio */}
        <section className="mb-6">
          <h3 className="font-bold uppercase bg-gray-100 px-2 py-1 mb-2 text-sm border-l-4 border-black">3. Condições do Estágio</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-justify">
            <p><strong>Vigência:</strong> {formatDate(internship.startDate)} a {formatDate(internship.endDate)}</p>
            <p><strong>Carga Horária:</strong> {internship.weeklyHours}h semanais ({internship.dailyHours}h diárias)</p>
            <p><strong>Bolsa Auxílio:</strong> R$ {internship.monthlyGrant.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p><strong>Auxílio Transporte:</strong> R$ {internship.transportationGrant.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="col-span-2"><strong>Setor de Realização:</strong> {internship.internshipSector}</p>
            <p className="col-span-2 mt-2"><strong>Atividades Previstas:</strong></p>
            <p className="col-span-2 border p-2 bg-gray-50 min-h-[100px]">{internship.technicalActivities}</p>
          </div>
        </section>

        {/* 4. Seguro */}
        <section className="mb-10">
          <h3 className="font-bold uppercase bg-gray-100 px-2 py-1 mb-2 text-sm border-l-4 border-black">4. Seguro contra Acidentes Pessoais</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p><strong>Seguradora:</strong> {internship.insuranceCompany || 'A definir'}</p>
            <p><strong>Apólice nº:</strong> {internship.insurancePolicyNumber || 'A definir'}</p>
          </div>
        </section>

        {/* Assinaturas */}
        <div className="mt-20 grid grid-cols-2 gap-10 text-center text-xs">
          <div className="border-t border-black pt-2">
            <p className="font-bold uppercase">{internship.companyName}</p>
            <p>Unidade Concedente</p>
          </div>
          <div className="border-t border-black pt-2">
            <p className="font-bold uppercase">{internship.student?.name}</p>
            <p>Estagiário</p>
          </div>
          <div className="border-t border-black pt-2 col-span-2 w-1/2 mx-auto mt-10">
            <p className="font-bold uppercase italic">Instituto Federal Fluminense</p>
            <p>Instituição de Ensino</p>
          </div>
        </div>

        {/* Rodapé informativo */}
        <div className="mt-auto pt-10 text-[10px] text-gray-500 text-center">
          Documento gerado eletronicamente pelo Sistema IFF Oportunidades em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}.
        </div>
      </div>

      <style jsx global>{`
        @media print {
          header, footer, nav, button {
            display: none !important;
          }
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\:shadow-none {
            box-shadow: none !important;
          }
          .print\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
