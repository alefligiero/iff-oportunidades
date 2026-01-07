import { redirect } from 'next/navigation';

export default function ApprovedVacanciesRedirect() {
  redirect('/dashboard/admin/vacancies');
}
