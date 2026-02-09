-- AlterEnum
ALTER TYPE "InternshipStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Internship" ADD COLUMN     "rejectedAt" TIMESTAMP(3);
