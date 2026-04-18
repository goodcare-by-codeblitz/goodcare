import crypto from 'crypto';
import { prisma } from '@repo/db';
import { hashToken } from '../../../utils/token-hash';
import {
	ConflictError,
	ForbiddenError,
	NotFoundError,
} from '../../lib/errors';
import { listOrganizationRoles } from '../organisation/org-role.utils';
import type {
	CreateInviteInput,
	InviteKind,
	InviteSummary,
} from './invitation.types';

const db = prisma as any;

export async function createInviteService(input: CreateInviteInput) {
	const {
		email,
		roleIds,
		firstName,
		lastName,
		organizationId,
		invitedByUserId,
		kind,
	} = input;
	const normalizedEmail = email.toLowerCase().trim();
	const resolvedRoles =
		kind === 'TEAM'
			? await resolveInviteRoles(organizationId, 'team', roleIds ?? [])
			: await resolveInviteRoles(organizationId, 'carer', []);

	const existingInvite = await prisma.inviteToken.findFirst({
		where: {
			organizationId,
			email: normalizedEmail,
			kind,
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
			throw new ConflictError(
				'User is already an active member of this organization',
			);
		}
	}

	const rawToken = crypto.randomBytes(32).toString('hex');
	const tokenHash = hashToken(rawToken);
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000);

	const result = await prisma.$transaction(async (tx) => {
		const user = await tx.user.upsert({
			where: { email: normalizedEmail },
			update: {},
			create: {
				email: normalizedEmail,
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				passwordHash: '',
			},
			select: { id: true },
		});

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
			},
			create: {
				userId: user.id,
				organizationId,
				status: 'INVITED',
				invitedById: invitedByUserId,
			},
			select: { id: true },
		});

		const invite = await tx.inviteToken.create({
			data: {
				organizationId,
				organizationUserId: orgUser.id,
				kind,
				email: normalizedEmail,
				inviteeFirstName: firstName.trim(),
				inviteeLastName: lastName.trim(),
				tokenHash,
				expiresAt,
				createdByUserId: invitedByUserId,
				roles: {
					create: resolvedRoles.map((role) => ({
						roleId: role.id,
					})),
				},
			},
			select: { id: true },
		});

		return { invite, rawToken };
	});

	return {
		invite: await getInviteSummaryById(result.invite.id, organizationId),
		rawToken: result.rawToken,
		alreadyPending: false as const,
	};
}

export async function listInvitesService(
	organizationId: string,
	kind: InviteKind,
) {
	const invites = await prisma.inviteToken.findMany({
		where: {
			organizationId,
			kind,
			usedAt: null,
			revokedAt: null,
			expiresAt: { gt: new Date() },
		},
		select: inviteSummarySelect(),
		orderBy: { createdAt: 'desc' },
	});

	return invites.map((invite) => summarizeInviteRecord(invite));
}

export async function revokeInviteService(
	organizationId: string,
	inviteId: string,
	kind: InviteKind,
) {
	const invite = await prisma.inviteToken.findFirst({
		where: {
			id: inviteId,
			organizationId,
			kind,
			usedAt: null,
			revokedAt: null,
		},
		select: {
			id: true,
			organizationUserId: true,
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

		if (!invite.organizationUserId) {
			return;
		}

		const [orgUser, remainingInvites] = await Promise.all([
			tx.organizationUser.findUnique({
				where: { id: invite.organizationUserId },
				select: { id: true, status: true },
			}),
			tx.inviteToken.count({
				where: {
					organizationUserId: invite.organizationUserId,
					usedAt: null,
					revokedAt: null,
					expiresAt: { gt: new Date() },
				},
			}),
		]);

		if (orgUser?.status === 'INVITED' && remainingInvites === 0) {
			await tx.organizationUser.update({
				where: { id: orgUser.id },
				data: { status: 'LEFT', leftAt: new Date() },
			});
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
		select: inviteSummarySelect(),
	});

	if (!invite) {
		throw new NotFoundError('Invite not found');
	}

	return summarizeInviteRecord(invite);
}

function inviteSummarySelect() {
	return {
		id: true,
		email: true,
		kind: true,
		inviteeFirstName: true,
		inviteeLastName: true,
		expiresAt: true,
		createdAt: true,
		roles: {
			select: {
				role: {
					select: {
						id: true,
						key: true,
						name: true,
						description: true,
						isSystem: true,
						organizationId: true,
						permissions: {
							select: {
								permission: {
									select: {
										id: true,
										key: true,
										description: true,
									},
								},
							},
						},
					},
				},
			},
		},
		createdBy: { select: { firstName: true, lastName: true, email: true } },
	} as const;
}

function summarizeInviteRecord(invite: {
	id: string;
	email: string;
	kind: InviteKind;
	inviteeFirstName: string;
	inviteeLastName: string;
	expiresAt: Date;
	createdAt: Date;
	roles: Array<{
		role: {
			id: string;
			key: string;
			name: string;
			description: string | null;
			isSystem: boolean;
			organizationId: string | null;
			permissions: Array<{
				permission: {
					id: string;
					key: string;
					description: string;
				};
			}>;
		};
	}>;
	createdBy: { firstName: string; lastName: string; email: string };
}): InviteSummary {
	return {
		id: invite.id,
		email: invite.email,
		firstName: invite.inviteeFirstName,
		lastName: invite.inviteeLastName,
		roles: invite.roles.map((entry) => ({
			id: entry.role.id,
			key: entry.role.key,
			name: entry.role.name,
			description: entry.role.description,
			isSystem: entry.role.isSystem,
			organizationId: entry.role.organizationId,
			permissions: entry.role.permissions.map((permissionEntry) => permissionEntry.permission),
		})),
		invitedAt: invite.createdAt,
		expiresAt: invite.expiresAt,
		invitedBy: invite.createdBy,
		kind: invite.kind,
	};
}

async function resolveInviteRoles(
	organizationId: string,
	kind: 'team' | 'carer',
	roleIds: string[],
) {
	const availableRoles = await listOrganizationRoles(kind, organizationId);
	if (kind === 'carer') {
		const caregiverRole = availableRoles.find((role) => isCarerRoleName(role.name));
		if (!caregiverRole) {
			throw new NotFoundError('Caregiver role not found');
		}

		return [caregiverRole];
	}

	const roleById = new Map(availableRoles.map((role) => [role.id, role]));
	const resolved = roleIds.map((roleId) => roleById.get(roleId)).filter(Boolean);
	if (resolved.length !== roleIds.length) {
		throw new ForbiddenError('Invalid organization role');
	}

	return resolved as Awaited<ReturnType<typeof listOrganizationRoles>>;
}

function isCarerRoleName(name: string) {
	return name === 'Caregiver';
}
