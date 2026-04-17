import { prisma } from '@repo/db';
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import {
  CARER_ROLE_NAME,
  isTeamRoleName,
  listOrganizationRoles,
} from './org-role.utils';
import type { OrgRole, RoleKind, UpdateMemberBody, UpdateOrgBody } from './org.types';

export async function getOrgService(organizationId: string): Promise<{
  id: string; name: string; slug: string; status: string; createdAt: Date;
}> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
    },
  });

  if (!org) throw new NotFoundError('Organization not found');
  return org;
}

export async function updateOrgService(organizationId: string, input: UpdateOrgBody): Promise<{
  id: string; name: string; slug: string; status: string;
}> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });

  if (!org) throw new NotFoundError('Organization not found');

  return prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(input.name ? { name: input.name } : {}),
    },
    select: { id: true, name: true, slug: true, status: true },
  });
}

export async function listMembersService(organizationId: string): Promise<Array<{
  id: string; userId: string; status: string; invitedAt: Date; joinedAt: Date | null;
  invitedBy: { firstName: string; lastName: string; email: string };
  user: { id: string; email: string; firstName: string; lastName: string };
  role: OrgRole | null;
}>> {
  const members = await prisma.organizationUser.findMany({
    where: {
      organizationId,
      status: { in: ['ACTIVE', 'SUSPENDED'] },
    },
    select: {
      id: true,
      userId: true,
      status: true,
      invitedAt: true,
      joinedAt: true,
      invitedBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const userIds = members.map(m => m.userId);
  const roleAssignments = await prisma.roleAssignment.findMany({
    where: { organizationId, userId: { in: userIds } },
    select: {
      userId: true,
      role: { select: { id: true, name: true } },
    },
  });

  const teamRoleByUser = new Map<string, OrgRole>();
  const hasCarerRole = new Set<string>();
  for (const ra of roleAssignments) {
    if (isTeamRoleName(ra.role.name) && !teamRoleByUser.has(ra.userId)) {
      teamRoleByUser.set(ra.userId, ra.role);
    }

    if (ra.role.name === CARER_ROLE_NAME) {
      hasCarerRole.add(ra.userId);
    }
  }

  return members
    .filter((member) => !(hasCarerRole.has(member.userId) && !teamRoleByUser.has(member.userId)))
    .map((member) => ({
      ...member,
      role: teamRoleByUser.get(member.userId) ?? null,
    }));
}

export async function listRolesService(kind: RoleKind) {
  return listOrganizationRoles(kind);
}

export async function updateMemberService(
  organizationId: string,
  targetUserId: string,
  actingUserId: string,
  input: UpdateMemberBody,
) {
  const teamRoles = await listOrganizationRoles('team');
  const teamRoleIds = teamRoles.map((role) => role.id);
  const requestedRole =
    input.roleId === undefined || input.roleId === null
      ? null
      : teamRoles.find((role) => role.id === input.roleId);

  const orgUser = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId: targetUserId,
        organizationId,
      },
    },
    select: { id: true, userId: true, status: true },
  });

  if (!orgUser) throw new NotFoundError('Member not found in this organization');

  const existingAssignments = await prisma.roleAssignment.findMany({
    where: {
      userId: targetUserId,
      organizationId,
    },
    select: {
      roleId: true,
      role: { select: { name: true } },
    },
  });

  const currentTeamRole = existingAssignments.find((assignment) =>
    isTeamRoleName(assignment.role.name),
  );
  const isCaregiverOnly =
    existingAssignments.some((assignment) => assignment.role.name === CARER_ROLE_NAME) &&
    !currentTeamRole;

  if (isCaregiverOnly) {
    throw new ForbiddenError('Carer members must be managed through the carer flow');
  }

  if (input.roleId !== undefined && input.roleId !== null && !requestedRole) {
    throw new ForbiddenError('Invalid organization role');
  }

  if (
    input.roleId !== undefined &&
    currentTeamRole?.role.name === 'Admin' &&
    input.roleId !== currentTeamRole.roleId
  ) {
    await guardLastAdmin(organizationId, targetUserId);
  }

  if (input.roleId !== undefined) {
    await prisma.$transaction(async (tx) => {
      await tx.roleAssignment.deleteMany({
        where: {
          userId: targetUserId,
          organizationId,
          roleId: { in: teamRoleIds },
        },
      });

      if (requestedRole) {
        await tx.roleAssignment.create({
          data: {
            userId: targetUserId,
            roleId: requestedRole.id,
            organizationId,
          },
        });
      }
    });
  }

  // If changing status
  if (input.status) {
    // Prevent suspending the last admin
    if (input.status === 'SUSPENDED') {
      await guardLastAdmin(organizationId, targetUserId);
    }

    await prisma.organizationUser.update({
      where: { id: orgUser.id },
      data: { status: input.status },
    });
  }

  return { message: 'Member updated successfully' };
}

export async function removeMemberService(
  organizationId: string,
  targetUserId: string,
  actingUserId: string,
) {
  const orgUser = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId: targetUserId,
        organizationId,
      },
    },
    select: { id: true },
  });

  if (!orgUser) throw new NotFoundError('Member not found in this organization');

  const existingAssignments = await prisma.roleAssignment.findMany({
    where: {
      userId: targetUserId,
      organizationId,
    },
    select: {
      role: { select: { name: true } },
    },
  });

  const isCaregiverOnly =
    existingAssignments.some((assignment) => assignment.role.name === CARER_ROLE_NAME) &&
    !existingAssignments.some((assignment) => isTeamRoleName(assignment.role.name));

  if (isCaregiverOnly) {
    throw new ForbiddenError('Carer members must be managed through the carer flow');
  }

  // Cannot remove yourself
  if (targetUserId === actingUserId) {
    throw new ConflictError('Cannot remove yourself from the organization');
  }

  // Prevent removing the last admin
  await guardLastAdmin(organizationId, targetUserId);

  await prisma.$transaction(async (tx) => {
    await tx.organizationUser.update({
      where: { id: orgUser.id },
      data: { status: 'LEFT', leftAt: new Date() },
    });

    // Remove org-scoped role assignments
    await tx.roleAssignment.deleteMany({
      where: { userId: targetUserId, organizationId },
    });
  });

  return { message: 'Member removed successfully' };
}

async function guardLastAdmin(organizationId: string, targetUserId: string) {
  const adminRole = await prisma.role.findFirst({
    where: { name: 'Admin', scope: 'ORGANIZATION' },
    select: { id: true },
  });

  if (!adminRole) return;

  const isTargetAdmin = await prisma.roleAssignment.findFirst({
    where: {
      userId: targetUserId,
      roleId: adminRole.id,
      organizationId,
    },
  });

  if (!isTargetAdmin) return; // target is not an admin, safe to proceed

  const adminCount = await prisma.roleAssignment.count({
    where: {
      roleId: adminRole.id,
      organizationId,
    },
  });

  if (adminCount <= 1) {
    throw new ConflictError('Cannot remove or suspend the last admin of this organization');
  }
}
