-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'EXTENSION_TERM';

-- AlterTable
ALTER TABLE "Internship"
ADD COLUMN     "internshipExtensionRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "internshipExtensionRequestedAt" TIMESTAMP(3),
ADD COLUMN     "internshipExtensionHandledAt" TIMESTAMP(3),
ADD COLUMN     "internshipExtensionApproved" BOOLEAN,
ADD COLUMN     "internshipExtensionReason" TEXT,
ADD COLUMN     "internshipExtensionRejectionReason" TEXT,
ADD COLUMN     "internshipExtensionStartDate" TIMESTAMP(3),
ADD COLUMN     "internshipExtensionEndDate" TIMESTAMP(3);
