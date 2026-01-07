-- AlterTable
ALTER TABLE "Internship" ADD COLUMN     "earlyTerminationApproved" BOOLEAN,
ADD COLUMN     "earlyTerminationHandledAt" TIMESTAMP(3),
ADD COLUMN     "earlyTerminationReason" TEXT,
ADD COLUMN     "earlyTerminationRequested" BOOLEAN NOT NULL DEFAULT false;
