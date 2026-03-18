import { prisma } from '@repo/db';
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import type { UpdateMemberBody, UpdateOrgBody } from './org.types';

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
  user: { id: string; email: string; firstName: string; lastName: string };
  roles: Array<{ id: string; name: string }>;
}>> {
  const members = await prisma.organizationUser.findMany({
    where: { organizationId },
    select: {
      id: true,
      userId: true,
      status: true,
      invitedAt: true,
      joinedAt: true,
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

  // Load roles for each member
  const userIds = members.map(m => m.userId);
  const roleAssignments = await prisma.roleAssignment.findMany({
    where: { organizationId, userId: { in: userIds } },
    select: {
      userId: true,
      role: { select: { id: true, name: true } },
    },
  });

  const rolesByUser = new Map<string, Array<{ id: string; name: string }>>();
  for (const ra of roleAssignments) {
    const existing = rolesByUser.get(ra.userId) ?? [];
    existing.push(ra.role);
    rolesByUser.set(ra.userId, existing);
  }

  return members.map(m => ({
    ...m,
    roles: rolesByUser.get(m.userId) ?? [],
  }));
}

export async function updateMemberService(
  organizationId: string,
  targetUserId: string,
  actingUserId: string,
  input: UpdateMemberBody,
) {
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

  // If changing role, validate it's org-scoped
  if (input.roleId) {
    const role = await prisma.role.findUnique({
      where: { id: input.roleId },
      select: { id: true, scope: true },
    });

    if (!role || role.scope !== 'ORGANIZATION') {
      throw new ForbiddenError('Invalid organization role');
    }

    // Replace all org role assignments for this user in this org
    await prisma.$transaction(async (tx) => {
      await tx.roleAssignment.deleteMany({
        where: { userId: targetUserId, organizationId },
      });
      await tx.roleAssignment.create({
        data: {
          userId: targetUserId,
          roleId: input.roleId!,
          organizationId,
        },
      });
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
