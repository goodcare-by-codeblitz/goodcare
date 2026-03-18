-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'ROLE_ASSIGNMENT', 'OTHER');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "addressId" TEXT;

-- CreateTable
CREATE TABLE "Carer" (
    "id" TEXT NOT NULL,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "employmentType" TEXT NOT NULL,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "availability" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "organizationUserId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Carer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Qualification" (
    "id" TEXT NOT NULL,
    "carerId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "QualificationStatus" NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Qualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualificationType" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "expires" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QualificationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "status" "VisitStatus" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitAssignment" (
    "id" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "visitId" TEXT NOT NULL,
    "carerId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "VisitAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarePlan" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "goals" TEXT NOT NULL,
    "status" "CarePlanStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "patientId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "CarePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitTask" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "VisitTaskStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "completedByCarerId" TEXT,
    "visitId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "VisitTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyNote" (
    "id" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "visitId" TEXT NOT NULL,
    "carerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "DailyNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentReport" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "patientId" TEXT,
    "visitId" TEXT,
    "reportedById" TEXT NOT NULL,
    "status" "IncidentReportStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "IncidentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorOrganizationUserId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Carer_organizationUserId_key" ON "Carer"("organizationUserId");
CREATE INDEX "Carer_organizationId_idx" ON "Carer"("organizationId");
CREATE INDEX "Carer_status_idx" ON "Carer"("status");
CREATE UNIQUE INDEX "Carer_id_organizationUserId_key" ON "Carer"("id", "organizationUserId");
CREATE UNIQUE INDEX "Carer_id_organizationId_key" ON "Carer"("id", "organizationId");

CREATE UNIQUE INDEX "QualificationType_key_key" ON "QualificationType"("key");
CREATE INDEX "Qualification_organizationId_idx" ON "Qualification"("organizationId");
CREATE UNIQUE INDEX "Qualification_carerId_organizationId_typeId_key" ON "Qualification"("carerId", "organizationId", "typeId");

CREATE INDEX "Visit_organizationId_scheduledStart_idx" ON "Visit"("organizationId", "scheduledStart");
CREATE INDEX "Visit_patientId_idx" ON "Visit"("patientId");
CREATE UNIQUE INDEX "Visit_id_organizationId_key" ON "Visit"("id", "organizationId");

CREATE INDEX "VisitAssignment_organizationId_idx" ON "VisitAssignment"("organizationId");
CREATE INDEX "VisitAssignment_carerId_idx" ON "VisitAssignment"("carerId");
CREATE INDEX "VisitAssignment_visitId_idx" ON "VisitAssignment"("visitId");
CREATE INDEX "VisitAssignment_assignedById_idx" ON "VisitAssignment"("assignedById");
CREATE INDEX "VisitAssignment_organizationId_carerId_isActive_idx" ON "VisitAssignment"("organizationId", "carerId", "isActive");
CREATE INDEX "VisitAssignment_organizationId_visitId_isActive_idx" ON "VisitAssignment"("organizationId", "visitId", "isActive");
CREATE UNIQUE INDEX "VisitAssignment_visitId_carerId_organizationId_isActive_key" ON "VisitAssignment"("visitId", "carerId", "organizationId", "isActive");

CREATE INDEX "CarePlan_organizationId_patientId_idx" ON "CarePlan"("organizationId", "patientId");
CREATE INDEX "CarePlan_organizationId_patientId_status_idx" ON "CarePlan"("organizationId", "patientId", "status");
CREATE UNIQUE INDEX "CarePlan_patientId_organizationId_version_key" ON "CarePlan"("patientId", "organizationId", "version");

CREATE INDEX "VisitTask_organizationId_visitId_idx" ON "VisitTask"("organizationId", "visitId");

CREATE INDEX "DailyNote_carerId_idx" ON "DailyNote"("carerId");
CREATE INDEX "DailyNote_organizationId_createdAt_idx" ON "DailyNote"("organizationId", "createdAt");
CREATE INDEX "DailyNote_organizationId_visitId_createdAt_idx" ON "DailyNote"("organizationId", "visitId", "createdAt");

CREATE INDEX "IncidentReport_organizationId_visitId_idx" ON "IncidentReport"("organizationId", "visitId");
CREATE INDEX "IncidentReport_reportedById_idx" ON "IncidentReport"("reportedById");
CREATE INDEX "IncidentReport_createdAt_idx" ON "IncidentReport"("createdAt");

CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_actorOrganizationUserId_idx" ON "AuditLog"("actorOrganizationUserId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Carer" ADD CONSTRAINT "Carer_organizationUserId_fkey" FOREIGN KEY ("organizationUserId") REFERENCES "OrganizationUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Carer" ADD CONSTRAINT "Carer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Qualification" ADD CONSTRAINT "Qualification_carerId_organizationId_fkey" FOREIGN KEY ("carerId", "organizationId") REFERENCES "Carer"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Qualification" ADD CONSTRAINT "Qualification_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "QualificationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Qualification" ADD CONSTRAINT "Qualification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_patientId_organizationId_fkey" FOREIGN KEY ("patientId", "organizationId") REFERENCES "Patient"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VisitAssignment" ADD CONSTRAINT "VisitAssignment_visitId_organizationId_fkey" FOREIGN KEY ("visitId", "organizationId") REFERENCES "Visit"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VisitAssignment" ADD CONSTRAINT "VisitAssignment_carerId_organizationId_fkey" FOREIGN KEY ("carerId", "organizationId") REFERENCES "Carer"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VisitAssignment" ADD CONSTRAINT "VisitAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CarePlan" ADD CONSTRAINT "CarePlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CarePlan" ADD CONSTRAINT "CarePlan_patientId_organizationId_fkey" FOREIGN KEY ("patientId", "organizationId") REFERENCES "Patient"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CarePlan" ADD CONSTRAINT "CarePlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VisitTask" ADD CONSTRAINT "VisitTask_completedByCarerId_organizationId_fkey" FOREIGN KEY ("completedByCarerId", "organizationId") REFERENCES "Carer"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VisitTask" ADD CONSTRAINT "VisitTask_visitId_organizationId_fkey" FOREIGN KEY ("visitId", "organizationId") REFERENCES "Visit"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DailyNote" ADD CONSTRAINT "DailyNote_visitId_organizationId_fkey" FOREIGN KEY ("visitId", "organizationId") REFERENCES "Visit"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DailyNote" ADD CONSTRAINT "DailyNote_carerId_organizationId_fkey" FOREIGN KEY ("carerId", "organizationId") REFERENCES "Carer"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DailyNote" ADD CONSTRAINT "DailyNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_patientId_organizationId_fkey" FOREIGN KEY ("patientId", "organizationId") REFERENCES "Patient"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_visitId_organizationId_fkey" FOREIGN KEY ("visitId", "organizationId") REFERENCES "Visit"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorOrganizationUserId_fkey" FOREIGN KEY ("actorOrganizationUserId") REFERENCES "OrganizationUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
