import crypto from 'crypto';
import { prisma } from '@repo/db';
import { hashToken } from '../../../utils/token-hash';
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import {
  CARER_ROLE_NAME,
  isCarerRoleName,
  isTeamRoleName,
  listOrganizationRoles,
} from '../organisation/org-role.utils';
import type { CreateInviteInput, InviteKind, InviteSummary } from './invitation.types';

export async function createInviteService(input: CreateInviteInput) {
  const { email, roleId, firstName, lastName, organizationId, invitedByUserId, kind } = input;
  const normalizedEmail = email.toLowerCase().trim();

  const teamRoles = await listOrganizationRoles('team');
  const carerRoles = await listOrganizationRoles('carer');
  const teamRoleIds = teamRoles.map((role) => role.id);
  const carerRole = carerRoles[0];

  if (!carerRole) {
    throw new NotFoundError('Caregiver role not found');
  }

  const role =
    kind === 'TEAM'
      ? teamRoles.find((candidate) => candidate.id === roleId)
      : carerRole;

  if (!role) {
    throw new ForbiddenError('Invalid organization role');
  }

  // Check for existing unexpired invite for same email+org
  const existingInvite = await prisma.inviteToken.findFirst({
    where: {
      organizationId,
      email: normalizedEmail,
      usedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (existingInvite) {
    return {
      invite: await getInviteSummaryById(existingInvite.id, organizationId),
      alreadyPending: true as const,
    };
  }

  // Check if user is already an active member
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    const existingMembership = await prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: existingUser.id,
          organizationId,
        },
      },
      select: { status: true },
    });

    if (existingMembership?.status === 'ACTIVE') {
      throw new ConflictError('User is already an active member of this organization');
    }
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000); // 7 days

  const result = await prisma.$transaction(async (tx) => {
    // Upsert user
    const user = await tx.user.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: {
        email: normalizedEmail,
        firstName,
        lastName,
        passwordHash: '',
      },
      select: { id: true, email: true },
    });

    // Create or update org membership
    const orgUser = await tx.organizationUser.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId,
        },
      },
      update: {
        status: 'INVITED',
        invitedById: invitedByUserId,
        leftAt: null,
        joinedAt: null,
      },
      create: {
        userId: user.id,
        organizationId,
        status: 'INVITED',
        invitedById: invitedByUserId,
      },
      select: { id: true },
    });

    if (kind === 'TEAM') {
      await tx.roleAssignment.deleteMany({
        where: {
          userId: user.id,
          organizationId,
          roleId: { in: teamRoleIds },
        },
      });
    }

    await tx.roleAssignment.upsert({
      where: {
        userId_roleId_organizationId: {
          userId: user.id,
          roleId: role.id,
          organizationId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
        organizationId,
      },
    });

    // Create invite token
    const invite = await tx.inviteToken.create({
      data: {
        organizationId,
        organizationUserId: orgUser.id,
        email: normalizedEmail,
        tokenHash,
        expiresAt,
        createdByUserId: invitedByUserId,
      },
      select: { id: true },
    });

    return { invite, rawToken, user };
  });

  return {
    invite: await getInviteSummaryById(result.invite.id, organizationId),
    rawToken: result.rawToken,
    alreadyPending: false as const,
  };
}

export async function listInvitesService(organizationId: string) {
  const invites = await prisma.inviteToken.findMany({
    where: {
      organizationId,
      usedAt: null,
      revokedAt: null,
    },
    select: {
      id: true,
      email: true,
      expiresAt: true,
      createdAt: true,
      organizationUser: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              roles: {
                where: { organizationId },
                select: {
                  role: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
      createdBy: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invites
    .map((invite) => summarizeInviteRecord(invite))
    .filter((invite): invite is InviteSummary => invite?.kind === 'TEAM');
}

export async function revokeInviteService(organizationId: string, inviteId: string) {
  const invite = await prisma.inviteToken.findFirst({
    where: {
      id: inviteId,
      organizationId,
      usedAt: null,
      revokedAt: null,
    },
    select: {
      id: true,
      organizationUserId: true,
      organizationUser: {
        select: {
          userId: true,
          user: {
            select: {
              roles: {
                where: { organizationId },
                select: {
                  roleId: true,
                  role: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!invite) {
    throw new NotFoundError('Invite not found or already used/revoked');
  }

  await prisma.$transaction(async (tx) => {
    await tx.inviteToken.update({
      where: { id: invite.id },
      data: { revokedAt: new Date() },
    });

    const userRoleAssignments = invite.organizationUser?.user.roles ?? [];
    const pendingTeamRoleIds = userRoleAssignments
      .filter((assignment) => isTeamRoleName(assignment.role.name))
      .map((assignment) => assignment.roleId);
    const pendingCarerRoleIds = userRoleAssignments
      .filter((assignment) => isCarerRoleName(assignment.role.name))
      .map((assignment) => assignment.roleId);

    if (invite.organizationUser?.userId && pendingTeamRoleIds.length > 0) {
      await tx.roleAssignment.deleteMany({
        where: {
          userId: invite.organizationUser.userId,
          organizationId,
          roleId: { in: pendingTeamRoleIds },
        },
      });
    } else if (invite.organizationUser?.userId && pendingCarerRoleIds.length > 0) {
      await tx.roleAssignment.deleteMany({
        where: {
          userId: invite.organizationUser.userId,
          organizationId,
          roleId: { in: pendingCarerRoleIds },
        },
      });
    }

    // Revert membership to LEFT if it was INVITED
    if (invite.organizationUserId) {
      const orgUser = await tx.organizationUser.findUnique({
        where: { id: invite.organizationUserId },
        select: { id: true, status: true },
      });

      if (orgUser?.status === 'INVITED') {
        await tx.organizationUser.update({
          where: { id: orgUser.id },
          data: { status: 'LEFT', leftAt: new Date() },
        });
      }
    }
  });

  return { message: 'Invite revoked successfully' };
}

async function getInviteSummaryById(
  inviteId: string,
  organizationId: string,
): Promise<InviteSummary> {
  const invite = await prisma.inviteToken.findFirst({
    where: { id: inviteId, organizationId },
    select: {
      id: true,
      email: true,
      expiresAt: true,
      createdAt: true,
      organizationUser: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              roles: {
                where: { organizationId },
                select: {
                  role: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
      createdBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  const summary = summarizeInviteRecord(invite);
  if (!summary) {
    throw new NotFoundError('Invite not found');
  }

  return summary;
}

function summarizeInviteRecord(
  invite:
    | {
        id: string;
        email: string;
        expiresAt: Date;
        createdAt: Date;
        createdBy: { firstName: string; lastName: string; email: string };
        organizationUser: {
          user: {
            firstName: string;
            lastName: string;
            roles: Array<{ role: { id: string; name: string } }>;
          };
        } | null;
      }
    | null,
): InviteSummary | null {
  if (!invite?.organizationUser) {
    return null;
  }

  const roles = invite.organizationUser.user.roles.map((assignment) => assignment.role);
  const role =
    roles.find((candidate) => isTeamRoleName(candidate.name)) ??
    roles.find((candidate) => candidate.name === CARER_ROLE_NAME);

  if (!role) {
    return null;
  }

  return {
    id: invite.id,
    email: invite.email,
    firstName: invite.organizationUser.user.firstName,
    lastName: invite.organizationUser.user.lastName,
    role: {
      id: role.id,
      name: role.name,
    },
    invitedAt: invite.createdAt,
    expiresAt: invite.expiresAt,
    invitedBy: invite.createdBy,
    kind: resolveInviteKind(role.name),
  };
}

function resolveInviteKind(roleName: string): InviteKind {
  return isCarerRoleName(roleName) ? 'CARER' : 'TEAM';
}
