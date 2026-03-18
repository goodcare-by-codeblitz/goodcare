import crypto from 'crypto';
import { prisma } from '@repo/db';
import { hashToken } from '../../../utils/token-hash';
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import type { CreateInviteInput } from './invitation.types';

export async function createInviteService(input: CreateInviteInput) {
  const { email, roleId, firstName, lastName, organizationId, invitedByUserId } = input;
  const normalizedEmail = email.toLowerCase().trim();

  // Validate role is organization-scoped
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { id: true, scope: true, name: true },
  });

  if (!role || role.scope !== 'ORGANIZATION') {
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
    select: { id: true, email: true, expiresAt: true, createdAt: true },
  });

  if (existingInvite) {
    return { invite: existingInvite, alreadyPending: true as const };
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
      update: { status: 'INVITED', invitedById: invitedByUserId },
      create: {
        userId: user.id,
        organizationId,
        status: 'INVITED',
        invitedById: invitedByUserId,
      },
      select: { id: true },
    });

    // Assign requested role
    await tx.roleAssignment.upsert({
      where: {
        userId_roleId_organizationId: {
          userId: user.id,
          roleId,
          organizationId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId,
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
      select: { id: true, email: true, expiresAt: true, createdAt: true },
    });

    return { invite, rawToken, user };
  });

  return { ...result, alreadyPending: false as const };
}

export async function listInvitesService(organizationId: string) {
  return prisma.inviteToken.findMany({
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
      createdBy: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function revokeInviteService(organizationId: string, inviteId: string) {
  const invite = await prisma.inviteToken.findFirst({
    where: {
      id: inviteId,
      organizationId,
      usedAt: null,
      revokedAt: null,
    },
    select: { id: true, organizationUserId: true },
  });

  if (!invite) {
    throw new NotFoundError('Invite not found or already used/revoked');
  }

  await prisma.$transaction(async (tx) => {
    await tx.inviteToken.update({
      where: { id: invite.id },
      data: { revokedAt: new Date() },
    });

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
