-- CreateEnum
CREATE TYPE "CarePlanGoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'PAUSED');

-- CreateEnum
CREATE TYPE "CarePlanRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "MedicationStatus" AS ENUM ('ACTIVE', 'PRN', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "MedicationAdministrationResult" AS ENUM ('GIVEN', 'MISSED', 'REFUSED', 'NA');

-- CreateTable
CREATE TABLE "PatientProfile" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "medicalSummary" TEXT,
    "careRequirements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientEmergencyContact" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientEmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientAllergy" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientAllergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlanCondition" (
    "id" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diagnosedYear" INTEGER,
    "description" TEXT,
    "patientImpact" TEXT,
    "carerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarePlanCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlanRisk" (
    "id" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "level" "CarePlanRiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarePlanRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlanTask" (
    "id" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "visitType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarePlanTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlanGoal" (
    "id" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3),
    "status" "CarePlanGoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarePlanGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "doseAmount" TEXT NOT NULL,
    "doseUnit" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "morning" BOOLEAN NOT NULL DEFAULT false,
    "noon" BOOLEAN NOT NULL DEFAULT false,
    "evening" BOOLEAN NOT NULL DEFAULT false,
    "night" BOOLEAN NOT NULL DEFAULT false,
    "bedtime" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "prescriber" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "status" "MedicationStatus" NOT NULL DEFAULT 'ACTIVE',
    "prnIndication" TEXT,
    "prnMaxDose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationAdministration" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "result" "MedicationAdministrationResult" NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "administeredAt" TIMESTAMP(3),
    "notes" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicationAdministration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarerAvailabilitySlot" (
    "id" TEXT NOT NULL,
    "carerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTimeMinutes" INTEGER NOT NULL,
    "endTimeMinutes" INTEGER NOT NULL,
    "crossesMidnight" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarerAvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_patientId_key" ON "PatientProfile"("patientId");
CREATE UNIQUE INDEX "PatientProfile_patientId_organizationId_key" ON "PatientProfile"("patientId", "organizationId");
CREATE INDEX "PatientProfile_organizationId_idx" ON "PatientProfile"("organizationId");

-- CreateIndex
CREATE INDEX "PatientEmergencyContact_organizationId_patientId_idx" ON "PatientEmergencyContact"("organizationId", "patientId");

-- CreateIndex
CREATE INDEX "PatientAllergy_organizationId_patientId_idx" ON "PatientAllergy"("organizationId", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "CarePlan_id_organizationId_key" ON "CarePlan"("id", "organizationId");
CREATE INDEX "CarePlanCondition_organizationId_carePlanId_idx" ON "CarePlanCondition"("organizationId", "carePlanId");

-- CreateIndex
CREATE INDEX "CarePlanRisk_organizationId_carePlanId_idx" ON "CarePlanRisk"("organizationId", "carePlanId");

-- CreateIndex
CREATE INDEX "CarePlanTask_organizationId_carePlanId_idx" ON "CarePlanTask"("organizationId", "carePlanId");

-- CreateIndex
CREATE INDEX "CarePlanGoal_organizationId_carePlanId_idx" ON "CarePlanGoal"("organizationId", "carePlanId");

-- CreateIndex
CREATE UNIQUE INDEX "Medication_id_organizationId_key" ON "Medication"("id", "organizationId");
CREATE INDEX "Medication_organizationId_patientId_idx" ON "Medication"("organizationId", "patientId");

-- CreateIndex
CREATE INDEX "MedicationAdministration_organizationId_patientId_idx" ON "MedicationAdministration"("organizationId", "patientId");
CREATE INDEX "MedicationAdministration_organizationId_medicationId_idx" ON "MedicationAdministration"("organizationId", "medicationId");

-- CreateIndex
CREATE UNIQUE INDEX "CarerAvailabilitySlot_carerId_organizationId_dayOfWeek_startTimeMinutes_endTimeMinutes_crossesMidnight_key" ON "CarerAvailabilitySlot"("carerId", "organizationId", "dayOfWeek", "startTimeMinutes", "endTimeMinutes", "crossesMidnight");
CREATE INDEX "CarerAvailabilitySlot_organizationId_dayOfWeek_idx" ON "CarerAvailabilitySlot"("organizationId", "dayOfWeek");
CREATE INDEX "CarerAvailabilitySlot_carerId_organizationId_idx" ON "CarerAvailabilitySlot"("carerId", "organizationId");

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_patientId_organizationId_fkey" FOREIGN KEY ("patientId", "organizationId") REFERENCES "Patient"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientEmergencyContact" ADD CONSTRAINT "PatientEmergencyContact_patientId_organizationId_fkey" FOREIGN KEY ("patientId", "organizationId") REFERENCES "Patient"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientEmergencyContact" ADD CONSTRAINT "PatientEmergencyContact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_patientId_organizationId_fkey" FOREIGN KEY ("patientId", "organizationId") REFERENCES "Patient"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanCondition" ADD CONSTRAINT "CarePlanCondition_carePlanId_organizationId_fkey" FOREIGN KEY ("carePlanId", "organizationId") REFERENCES "CarePlan"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanRisk" ADD CONSTRAINT "CarePlanRisk_carePlanId_organizationId_fkey" FOREIGN KEY ("carePlanId", "organizationId") REFERENCES "CarePlan"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanTask" ADD CONSTRAINT "CarePlanTask_carePlanId_organizationId_fkey" FOREIGN KEY ("carePlanId", "organizationId") REFERENCES "CarePlan"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarePlanGoal" ADD CONSTRAINT "CarePlanGoal_carePlanId_organizationId_fkey" FOREIGN KEY ("carePlanId", "organizationId") REFERENCES "CarePlan"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_patientId_organizationId_fkey" FOREIGN KEY ("patientId", "organizationId") REFERENCES "Patient"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationAdministration" ADD CONSTRAINT "MedicationAdministration_medicationId_organizationId_fkey" FOREIGN KEY ("medicationId", "organizationId") REFERENCES "Medication"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicationAdministration" ADD CONSTRAINT "MedicationAdministration_patientId_organizationId_fkey" FOREIGN KEY ("patientId", "organizationId") REFERENCES "Patient"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicationAdministration" ADD CONSTRAINT "MedicationAdministration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicationAdministration" ADD CONSTRAINT "MedicationAdministration_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarerAvailabilitySlot" ADD CONSTRAINT "CarerAvailabilitySlot_carerId_organizationId_fkey" FOREIGN KEY ("carerId", "organizationId") REFERENCES "Carer"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CarerAvailabilitySlot" ADD CONSTRAINT "CarerAvailabilitySlot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Carer" DROP COLUMN "availability";
