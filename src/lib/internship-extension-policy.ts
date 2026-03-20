import { addDays, addMonths } from 'date-fns';
import { compareDatesBRT, toDateOnlyBRT } from '@/lib/date-utils';

export const MAX_INTERNSHIP_MONTHS_SAME_COMPANY = 24;

export function getExpectedExtensionStartDate(currentEndDate: Date | string): Date {
  const endDate = toDateOnlyBRT(currentEndDate);
  return addDays(endDate, 1);
}

export function getMaximumAllowedInternshipEndDate(startDate: Date | string): Date {
  const internshipStart = toDateOnlyBRT(startDate);
  return addMonths(internshipStart, MAX_INTERNSHIP_MONTHS_SAME_COMPANY);
}

export function isInternshipExtensionWithinLimit(
  internshipStartDate: Date | string,
  requestedExtensionEndDate: Date | string
): boolean {
  const maxAllowedEndDate = getMaximumAllowedInternshipEndDate(internshipStartDate);
  return compareDatesBRT(requestedExtensionEndDate, maxAllowedEndDate) <= 0;
}
