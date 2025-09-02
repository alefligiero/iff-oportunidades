/*
  Warnings:

  - You are about to drop the column `insuranceValidity` on the `Internship` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Internship" DROP COLUMN "insuranceValidity",
ADD COLUMN     "insuranceEndDate" TIMESTAMP(3),
ADD COLUMN     "insuranceStartDate" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT;
