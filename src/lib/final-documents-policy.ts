import { differenceInMonths } from 'date-fns';
import { DocumentType } from '@prisma/client';

export const MIN_MONTHS_FOR_FULL_FINAL_DOCUMENTS = 6;

export interface FinalDocumentsPolicyInput {
  earlyTerminationApproved?: boolean | null;
  startDate?: string | Date;
  endDate?: string | Date;
  earlyTerminationRequestedAt?: string | Date | null;
}

export interface FinalDocumentsPolicy {
  isEarlyTerminationApproved: boolean;
  durationInMonths: number | null;
  comparisonDate: Date | null;
  isShortEarlyTermination: boolean;
  requiresCoreFinalDocuments: boolean;
  requiresTerminationTerm: boolean;
  requiresFinalDeclaration: boolean;
  requiredFinalDocumentTypes: DocumentType[];
}

const toValidDate = (value?: string | Date): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getDurationInMonths = (startDate?: string | Date, endDate?: string | Date): number | null => {
  const start = toValidDate(startDate);
  const end = toValidDate(endDate);

  if (!start || !end) {
    return null;
  }

  return differenceInMonths(end, start);
};

export function getFinalDocumentsPolicy({
  earlyTerminationApproved = false,
  startDate,
  endDate,
  earlyTerminationRequestedAt,
}: FinalDocumentsPolicyInput): FinalDocumentsPolicy {
  const isEarlyTerminationApproved = earlyTerminationApproved === true;
  const comparisonDate = isEarlyTerminationApproved
    ? toValidDate(earlyTerminationRequestedAt ?? undefined) ?? toValidDate(endDate)
    : toValidDate(endDate);
  const durationInMonths = getDurationInMonths(startDate, comparisonDate ?? undefined);
  const isShortEarlyTermination =
    isEarlyTerminationApproved &&
    durationInMonths !== null &&
    durationInMonths < MIN_MONTHS_FOR_FULL_FINAL_DOCUMENTS;

  const requiresCoreFinalDocuments = !isShortEarlyTermination;
  const requiresTerminationTerm = isEarlyTerminationApproved;
  const requiresFinalDeclaration = !isShortEarlyTermination;

  const requiredFinalDocumentTypes: DocumentType[] = [];

  if (requiresCoreFinalDocuments) {
    requiredFinalDocumentTypes.push(DocumentType.TRE, DocumentType.RFE, DocumentType.PARECER_AVALIATIVO);
  }

  if (requiresTerminationTerm) {
    requiredFinalDocumentTypes.push(DocumentType.TERMINATION_TERM);
  }

  return {
    isEarlyTerminationApproved,
    durationInMonths,
    comparisonDate,
    isShortEarlyTermination,
    requiresCoreFinalDocuments,
    requiresTerminationTerm,
    requiresFinalDeclaration,
    requiredFinalDocumentTypes,
  };
}
