-- Add snapshot flag to keep insurance requirement per internship
ALTER TABLE "Internship"
ADD COLUMN "insuranceRequired" BOOLEAN NOT NULL DEFAULT false;

-- Global system configuration (singleton)
CREATE TABLE "SystemConfig" (
  "id" TEXT NOT NULL DEFAULT 'global',
  "requireLifeInsuranceForNewInternships" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- Ensure singleton row exists
INSERT INTO "SystemConfig" ("id", "requireLifeInsuranceForNewInternships", "createdAt", "updatedAt")
VALUES ('global', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
