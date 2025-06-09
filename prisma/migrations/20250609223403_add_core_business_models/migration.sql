-- CreateEnum
CREATE TYPE "InternshipStatus" AS ENUM ('IN_ANALYSIS', 'APPROVED', 'IN_PROGRESS', 'FINISHED', 'CANCELED');

-- CreateEnum
CREATE TYPE "InternshipType" AS ENUM ('DIRECT', 'INTEGRATOR');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('TCE', 'PAE', 'PERIODIC_REPORT', 'TRE', 'RFE', 'SIGNED_CONTRACT', 'LIFE_INSURANCE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING_ANALYSIS', 'APPROVED', 'REJECTED', 'SIGNED_VALIDATED');

-- CreateEnum
CREATE TYPE "VacancyType" AS ENUM ('INTERNSHIP', 'JOB');

-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CLOSED_BY_COMPANY');

-- CreateTable
CREATE TABLE "Internship" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "InternshipStatus" NOT NULL DEFAULT 'IN_ANALYSIS',
    "type" "InternshipType" NOT NULL,
    "studentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Internship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING_ANALYSIS',
    "fileUrl" TEXT,
    "rejectionComments" TEXT,
    "internshipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobVacancy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "VacancyType" NOT NULL,
    "status" "VacancyStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobVacancy_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "Internship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobVacancy" ADD CONSTRAINT "JobVacancy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
