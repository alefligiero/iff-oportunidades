ALTER TABLE "Internship"
ADD COLUMN "approvedAt" TIMESTAMP(3);

UPDATE "Internship"
SET "approvedAt" = "updatedAt"
WHERE "status" = 'APPROVED'
  AND "approvedAt" IS NULL;
