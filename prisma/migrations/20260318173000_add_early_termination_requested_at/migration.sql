-- Add timestamp for early termination request creation to support business rules
ALTER TABLE "Internship"
ADD COLUMN "earlyTerminationRequestedAt" TIMESTAMP(3);
