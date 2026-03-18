/**
 * Utilitários de data baseados em dia civil (date-only).
 *
 * IMPORTANTE:
 * startDate/endDate no domínio são datas civis (sem hora), então para evitar
 * deslocamentos de timezone (ex.: 19 virar 18), todas as comparações e
 * formatações abaixo usam UTC como referência de dia.
 */

const DATE_ONLY_UTC_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'UTC',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function toDateOnlyKeyUTC(value: Date | string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return DATE_ONLY_UTC_FORMATTER.format(date);
}

/**
 * Formata um Date ou string ISO para string em pt-BR preservando o dia civil.
 * Exemplo: new Date("2026-03-19T00:00:00.000Z") → "19/03/2026"
 */
export function formatDateBR(value: Date | string | null | undefined): string {
  if (!value) return '';
  try {
    const date = new Date(value);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return '';
  }
}

/**
 * Converte uma data civil no formato YYYY-MM-DD para Date em UTC.
 * Retorna Date inválida caso o valor não siga o formato esperado.
 */
export function parseDateOnlyToUtc(value: string): Date {
  if (!DATE_ONLY_REGEX.test(value)) {
    return new Date(NaN);
  }

  return new Date(`${value}T00:00:00.000Z`);
}

/**
 * Converte para início do dia em UTC (date-only estável).
 */
export function toDateOnlyBRT(value: Date | string): Date {
  const key = toDateOnlyKeyUTC(value);
  return key ? new Date(`${key}T00:00:00.000Z`) : new Date(NaN);
}

/**
 * Obtém hoje no formato início de dia UTC.
 */
export function getTodayBRT(): Date {
  const key = toDateOnlyKeyUTC(new Date());
  return new Date(`${key}T00:00:00.000Z`);
}

/**
 * Compara dois dates considerando apenas o dia (ignorando horas), em UTC.
 * 
 * Retorna:
 *  -1 se d1 < d2
 *   0 se d1 === d2
 *   1 se d1 > d2
 */
export function compareDatesBRT(d1: Date | string, d2: Date | string): -1 | 0 | 1 {
  const key1 = toDateOnlyKeyUTC(d1);
  const key2 = toDateOnlyKeyUTC(d2);

  if (!key1 || !key2) return 0;
  if (key1 < key2) return -1;
  if (key1 > key2) return 1;
  return 0;
}

/**
 * Verifica se um dia já chegou ou passou.
 * Retorna true se data <= hoje.
 */
export function isDateInPastOrTodayBRT(value: Date | string): boolean {
  return compareDatesBRT(value, getTodayBRT()) <= 0;
}

/**
 * Verifica se um dia ainda não chegou.
 * Retorna true se data > hoje.
 */
export function isDateInFutureBRT(value: Date | string): boolean {
  return compareDatesBRT(value, getTodayBRT()) > 0;
}

/**
 * Verifica se um dia é estritamente anterior ao dia de hoje.
 */
export function isDateBeforeTodayBRT(value: Date | string): boolean {
  return compareDatesBRT(value, getTodayBRT()) < 0;
}

/**
 * Formata um intervalo de datas para exibição em pt-BR no timezone America/Sao_Paulo
 * Exemplo: "19/03/2026 - 19/03/2027"
 */
export function formatDateRangeBR(startDate: Date | string | null, endDate: Date | string | null): string {
  if (!startDate || !endDate) return '';
  return `${formatDateBR(startDate)} - ${formatDateBR(endDate)}`;
}
