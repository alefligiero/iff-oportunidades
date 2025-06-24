/*
  Warnings:

  - You are about to drop the column `companyId` on the `Internship` table. All the data in the column will be lost.
  - Added the required column `advisorProfessorId` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `advisorProfessorName` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyAddressCep` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyAddressCityState` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyAddressDistrict` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyAddressNumber` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyAddressStreet` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyCnpj` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyEmail` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyName` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyPhone` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyRepresentativeName` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyRepresentativeRole` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dailyHours` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insuranceCompany` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insuranceCompanyCnpj` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insurancePolicyNumber` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insuranceValidity` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `internshipSector` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modality` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monthlyGrant` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentAddressCep` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentAddressCityState` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentAddressDistrict` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentAddressNumber` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentAddressStreet` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentCourse` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentCoursePeriod` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentCpf` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentGender` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentPhone` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentSchoolYear` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supervisorName` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supervisorRole` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `technicalActivities` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transportationGrant` to the `Internship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weeklyHours` to the `Internship` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "Course" AS ENUM ('BSI', 'LIC_QUIMICA', 'ENG_MECANICA', 'TEC_ADM_INTEGRADO', 'TEC_ELETRO_INTEGRADO', 'TEC_INFO_INTEGRADO', 'TEC_QUIMICA_INTEGRADO', 'TEC_AUTOMACAO_SUBSEQUENTE', 'TEC_ELETRO_CONCOMITANTE', 'TEC_MECANICA_CONCOMITANTE', 'TEC_QUIMICA_CONCOMITANTE');

-- CreateEnum
CREATE TYPE "InternshipModality" AS ENUM ('PRESENCIAL', 'REMOTO');

-- DropForeignKey
ALTER TABLE "Internship" DROP CONSTRAINT "Internship_companyId_fkey";

-- AlterTable
ALTER TABLE "Internship" DROP COLUMN "companyId",
ADD COLUMN     "advisorProfessorId" TEXT NOT NULL,
ADD COLUMN     "advisorProfessorName" TEXT NOT NULL,
ADD COLUMN     "companyAddressCep" TEXT NOT NULL,
ADD COLUMN     "companyAddressCityState" TEXT NOT NULL,
ADD COLUMN     "companyAddressDistrict" TEXT NOT NULL,
ADD COLUMN     "companyAddressNumber" TEXT NOT NULL,
ADD COLUMN     "companyAddressStreet" TEXT NOT NULL,
ADD COLUMN     "companyCnpj" TEXT NOT NULL,
ADD COLUMN     "companyEmail" TEXT NOT NULL,
ADD COLUMN     "companyName" TEXT NOT NULL,
ADD COLUMN     "companyPhone" TEXT NOT NULL,
ADD COLUMN     "companyRepresentativeName" TEXT NOT NULL,
ADD COLUMN     "companyRepresentativeRole" TEXT NOT NULL,
ADD COLUMN     "dailyHours" TEXT NOT NULL,
ADD COLUMN     "insuranceCompany" TEXT NOT NULL,
ADD COLUMN     "insuranceCompanyCnpj" TEXT NOT NULL,
ADD COLUMN     "insurancePolicyNumber" TEXT NOT NULL,
ADD COLUMN     "insuranceProofUrl" TEXT,
ADD COLUMN     "insuranceValidity" TEXT NOT NULL,
ADD COLUMN     "internshipSector" TEXT NOT NULL,
ADD COLUMN     "modality" "InternshipModality" NOT NULL,
ADD COLUMN     "monthlyGrant" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "studentAddressCep" TEXT NOT NULL,
ADD COLUMN     "studentAddressCityState" TEXT NOT NULL,
ADD COLUMN     "studentAddressDistrict" TEXT NOT NULL,
ADD COLUMN     "studentAddressNumber" TEXT NOT NULL,
ADD COLUMN     "studentAddressStreet" TEXT NOT NULL,
ADD COLUMN     "studentCourse" "Course" NOT NULL,
ADD COLUMN     "studentCoursePeriod" TEXT NOT NULL,
ADD COLUMN     "studentCpf" TEXT NOT NULL,
ADD COLUMN     "studentGender" "Gender" NOT NULL,
ADD COLUMN     "studentPhone" TEXT NOT NULL,
ADD COLUMN     "studentSchoolYear" TEXT NOT NULL,
ADD COLUMN     "supervisorName" TEXT NOT NULL,
ADD COLUMN     "supervisorRole" TEXT NOT NULL,
ADD COLUMN     "technicalActivities" TEXT NOT NULL,
ADD COLUMN     "transportationGrant" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "weeklyHours" INTEGER NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'DIRECT';
