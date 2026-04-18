-- CreateEnum
CREATE TYPE "MedicationScheduleSlot" AS ENUM ('MORNING', 'NOON', 'EVENING', 'NIGHT', 'BEDTIME');

-- AlterTable
ALTER TABLE "MedicationAdministration" ADD COLUMN "slot" "MedicationScheduleSlot";
