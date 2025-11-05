-- CreateEnum
CREATE TYPE "VacancyModality" AS ENUM ('PRESENCIAL', 'HIBRIDO', 'REMOTO');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "description" TEXT,
ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "JobVacancy" ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "contactInfo" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "eligibleCourses" "Course"[],
ADD COLUMN     "minPeriod" INTEGER,
ADD COLUMN     "modality" "VacancyModality" NOT NULL DEFAULT 'PRESENCIAL',
ADD COLUMN     "responsibilities" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "softSkills" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "technicalSkills" TEXT NOT NULL DEFAULT '';
