-- CreateEnum
CREATE TYPE "OrganizationRoleKind" AS ENUM ('TEAM', 'CARER');

-- CreateEnum
CREATE TYPE "InviteKind" AS ENUM ('TEAM', 'CARER');

-- AlterTable
ALTER TABLE "Role"
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "description" TEXT,
ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "key" TEXT,
ADD COLUMN "organizationId" TEXT,
ADD COLUMN "organizationRoleKind" "OrganizationRoleKind";

-- Backfill built-in role metadata
UPDATE "Role"
SET
    "key" = CASE
        WHEN "scope" = 'PLATFORM' AND "name" = 'SuperAdmin' THEN 'platform_super_admin'
        WHEN "scope" = 'PLATFORM' AND "name" = 'SystemAdmin' THEN 'platform_system_admin'
        WHEN "scope" = 'PLATFORM' AND "name" = 'Moderator' THEN 'platform_moderator'
        WHEN "scope" = 'PLATFORM' AND "name" = 'Viewer' THEN 'platform_viewer'
        WHEN "scope" = 'ORGANIZATION' AND "name" = 'Admin' THEN 'org_admin'
        WHEN "scope" = 'ORGANIZATION' AND "name" = 'Manager' THEN 'org_manager'
        WHEN "scope" = 'ORGANIZATION' AND "name" = 'Caregiver' THEN 'org_caregiver'
        WHEN "scope" = 'ORGANIZATION' AND "name" = 'Viewer' THEN 'org_viewer'
        ELSE lower(replace("scope" || '_' || "name", ' ', '_'))
    END,
    "description" = COALESCE(
        "description",
        CASE
            WHEN "scope" = 'PLATFORM' AND "name" = 'SuperAdmin' THEN 'Full platform administration access.'
            WHEN "scope" = 'PLATFORM' AND "name" = 'SystemAdmin' THEN 'Operational platform administrator access.'
            WHEN "scope" = 'PLATFORM' AND "name" = 'Moderator' THEN 'Moderation and incident oversight access.'
            WHEN "scope" = 'PLATFORM' AND "name" = 'Viewer' THEN 'Read-only platform access.'
            WHEN "scope" = 'ORGANIZATION' AND "name" = 'Admin' THEN 'Full organization administration access.'
            WHEN "scope" = 'ORGANIZATION' AND "name" = 'Manager' THEN 'Operational team management access.'
            WHEN "scope" = 'ORGANIZATION' AND "name" = 'Caregiver' THEN 'Care delivery role for staff assigned to visits and MAR workflows.'
            WHEN "scope" = 'ORGANIZATION' AND "name" = 'Viewer' THEN 'Read-only organization access.'
            ELSE NULL
        END
    ),
    "organizationRoleKind" = CASE
        WHEN "scope" = 'ORGANIZATION' AND "name" = 'Caregiver' THEN 'CARER'::"OrganizationRoleKind"
        WHEN "scope" = 'ORGANIZATION' THEN 'TEAM'::"OrganizationRoleKind"
        ELSE NULL
    END,
    "organizationId" = NULL,
    "isSystem" = true;

ALTER TABLE "Role"
ALTER COLUMN "key" SET NOT NULL;

-- Replace the old global name uniqueness with stable key uniqueness
DROP INDEX "Role_scope_name_key";

-- CreateTable
CREATE TABLE "InviteTokenRole" (
    "inviteTokenId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "InviteTokenRole_pkey" PRIMARY KEY ("inviteTokenId","roleId")
);

-- AlterTable
ALTER TABLE "InviteToken"
ADD COLUMN "inviteeFirstName" TEXT,
ADD COLUMN "inviteeLastName" TEXT,
ADD COLUMN "kind" "InviteKind";

-- Backfill invite metadata from the invited membership and current pending role assignments
UPDATE "InviteToken" AS it
SET
    "inviteeFirstName" = COALESCE(u."firstName", split_part(it."email", '@', 1), 'Invited'),
    "inviteeLastName" = COALESCE(u."lastName", ''),
    "kind" = CASE
        WHEN EXISTS (
            SELECT 1
            FROM "RoleAssignment" ra
            INNER JOIN "Role" r ON r."id" = ra."roleId"
            INNER JOIN "OrganizationUser" ou2
                ON ou2."userId" = ra."userId"
               AND ou2."organizationId" = ra."organizationId"
            WHERE ou2."id" = it."organizationUserId"
              AND ra."organizationId" = it."organizationId"
              AND r."organizationRoleKind" = 'CARER'
              AND NOT EXISTS (
                  SELECT 1
                  FROM "RoleAssignment" tra
                  INNER JOIN "Role" tr ON tr."id" = tra."roleId"
                  WHERE tra."userId" = ra."userId"
                    AND tra."organizationId" = ra."organizationId"
                    AND tr."organizationRoleKind" = 'TEAM'
              )
        ) THEN 'CARER'::"InviteKind"
        ELSE 'TEAM'::"InviteKind"
    END
FROM "OrganizationUser" ou
INNER JOIN "User" u ON u."id" = ou."userId"
WHERE ou."id" = it."organizationUserId";

UPDATE "InviteToken"
SET
    "inviteeFirstName" = COALESCE("inviteeFirstName", split_part("email", '@', 1), 'Invited'),
    "inviteeLastName" = COALESCE("inviteeLastName", ''),
    "kind" = COALESCE("kind", 'TEAM'::"InviteKind");

ALTER TABLE "InviteToken"
ALTER COLUMN "inviteeFirstName" SET NOT NULL,
ALTER COLUMN "inviteeLastName" SET NOT NULL,
ALTER COLUMN "kind" SET NOT NULL;

-- Backfill invite-role joins from the old pending role-assignment model
INSERT INTO "InviteTokenRole" ("inviteTokenId", "roleId")
SELECT DISTINCT it."id", ra."roleId"
FROM "InviteToken" it
INNER JOIN "OrganizationUser" ou ON ou."id" = it."organizationUserId"
INNER JOIN "RoleAssignment" ra
    ON ra."userId" = ou."userId"
   AND ra."organizationId" = it."organizationId"
INNER JOIN "Role" r ON r."id" = ra."roleId"
WHERE (
        it."kind" = 'TEAM'::"InviteKind"
        AND r."organizationRoleKind" = 'TEAM'
    )
    OR (
        it."kind" = 'CARER'::"InviteKind"
        AND r."organizationRoleKind" = 'CARER'
    );

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE INDEX "Role_scope_name_idx" ON "Role"("scope", "name");

-- CreateIndex
CREATE INDEX "Role_scope_organizationId_organizationRoleKind_archivedAt_idx"
ON "Role"("scope", "organizationId", "organizationRoleKind", "archivedAt");

-- CreateIndex
CREATE INDEX "InviteTokenRole_roleId_idx" ON "InviteTokenRole"("roleId");

-- AddForeignKey
ALTER TABLE "Role"
ADD CONSTRAINT "Role_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteTokenRole"
ADD CONSTRAINT "InviteTokenRole_inviteTokenId_fkey"
FOREIGN KEY ("inviteTokenId") REFERENCES "InviteToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteTokenRole"
ADD CONSTRAINT "InviteTokenRole_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
