/*
  Warnings:

  - Made the column `remuneration` on table `JobVacancy` required. This step will fail if there are existing NULL values in that column.
  - Made the column `workload` on table `JobVacancy` required. This step will fail if there are existing NULL values in that column.

*/
-- Update existing NULL values to a default value (e.g., 0)
UPDATE "JobVacancy" SET "remuneration" = 0 WHERE "remuneration" IS NULL;
UPDATE "JobVacancy" SET "workload" = 0 WHERE "workload" IS NULL;

-- Alter the columns to be NOT NULL
ALTER TABLE "JobVacancy" ALTER COLUMN "remuneration" SET NOT NULL;
ALTER TABLE "JobVacancy" ALTER COLUMN "workload" SET NOT NULL;
