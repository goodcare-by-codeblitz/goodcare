import { prisma } from '@repo/db';
import {
	ConflictError,
	ForbiddenError,
	NotFoundError,
} from '../../lib/errors';
import {
	CARER_ROLE_NAME,
	buildCustomRoleKey,
	isCarerRoleName,
	listOrganizationRoles,
} from './org-role.utils';
import type {
	CreateOrgRoleBody,
	OrgMember,
	OrgPermissionCatalogEntry,
	RoleKind,
	UpdateMemberBody,
	UpdateOrgBody,
	UpdateOrgRoleBody,
} from './org.types';

const db = prisma as any;
const GOVERNANCE_PERMISSION_KEYS = ['manage_members', 'manage_roles'] as const;

type RoleSummary = Awaited<ReturnType<typeof listOrganizationRoles>>[number];

export async function getOrgService(organizationId: string): Promise<{
	id: string;
	name: string;
	slug: string;
	status: string;
	createdAt: Date;
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

export async function updateOrgService(
	organizationId: string,
	input: UpdateOrgBody,
): Promise<{
	id: string;
	name: string;
	slug: string;
	status: string;
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

export async function listMembersService(
	organizationId: string,
	view: 'active' | 'former' = 'active',
): Promise<OrgMember[]> {
	const members = await prisma.organizationUser.findMany({
		where: {
			organizationId,
			status: view === 'former' ? 'LEFT' : { in: ['ACTIVE', 'SUSPENDED'] },
		},
		select: {
			id: true,
			userId: true,
			status: true,
			invitedAt: true,
			joinedAt: true,
			leftAt: true,
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

	const availableTeamRoles = await listOrganizationRoles('team', organizationId);
	const teamRoleIdSet = new Set(availableTeamRoles.map((role) => role.id));
	const teamRoleById = new Map(availableTeamRoles.map((role) => [role.id, role]));
	const userIds = members.map((member) => member.userId);

	const roleAssignments = await prisma.roleAssignment.findMany({
		where: {
			organizationId,
			userId: { in: userIds },
		},
		select: {
			userId: true,
			roleId: true,
			role: {
				select: {
					name: true,
				},
			},
		},
	});

	const teamRolesByUser = new Map<string, RoleSummary[]>();
	const hasCarerRole = new Set<string>();

	for (const assignment of roleAssignments) {
		if (teamRoleIdSet.has(assignment.roleId)) {
			const role = teamRoleById.get(assignment.roleId);
			if (!role) {
				continue;
			}

			const current = teamRolesByUser.get(assignment.userId) ?? [];
			current.push(role);
			teamRolesByUser.set(assignment.userId, current);
		}

		if (assignment.role.name === CARER_ROLE_NAME) {
			hasCarerRole.add(assignment.userId);
		}
	}

	return members
		.filter(
			(member) =>
				!(
					hasCarerRole.has(member.userId) &&
					(teamRolesByUser.get(member.userId)?.length ?? 0) === 0
				),
		)
		.map((member) => ({
			...member,
			roles:
				teamRolesByUser
					.get(member.userId)
					?.slice()
					.sort((left, right) => left.name.localeCompare(right.name)) ?? [],
		}))
		.sort((left, right) => {
			if (view === 'former') {
				return (right.leftAt?.getTime() ?? 0) - (left.leftAt?.getTime() ?? 0);
			}

			return (right.joinedAt?.getTime() ?? 0) - (left.joinedAt?.getTime() ?? 0);
		});
}

export async function listRolesService(
	organizationId: string,
	kind: RoleKind,
) {
	return listOrganizationRoles(kind, organizationId);
}

export async function listPermissionCatalogService(): Promise<
	OrgPermissionCatalogEntry[]
> {
	return prisma.permission.findMany({
		select: {
			id: true,
			key: true,
			description: true,
		},
		orderBy: {
			key: 'asc',
		},
	});
}

export async function createRoleService(
	organizationId: string,
	input: CreateOrgRoleBody,
) {
	const permissions = await resolvePermissions(input.permissionKeys);

	if (input.cloneRoleId) {
		await getOrganizationRoleById(organizationId, input.cloneRoleId);
	}

	return prisma.$transaction(async (tx) => {
		const role = await tx.role.create({
			data: {
				key: buildCustomRoleKey(organizationId, input.name),
				name: input.name.trim(),
				description: input.description?.trim() || null,
				scope: 'ORGANIZATION',
				isSystem: false,
				organizationId,
				organizationRoleKind: input.kind === 'team' ? 'TEAM' : 'CARER',
				permissions: {
					create: permissions.map((permission) => ({
						permissionId: permission.id,
					})),
				},
			},
		});

		return getOrganizationRoleById(organizationId, role.id, tx);
	});
}

export async function updateRoleService(
	organizationId: string,
	roleId: string,
	input: UpdateOrgRoleBody,
) {
	const role = await getOrganizationRoleById(organizationId, roleId);
	if (role.isSystem) {
		throw new ForbiddenError('Built-in roles cannot be edited');
	}

	const permissionKeys =
		input.permissionKeys !== undefined
			? input.permissionKeys
			: role.permissions.map((permission: { key: string }) => permission.key);
	const permissions = await resolvePermissions(permissionKeys);

	return prisma.$transaction(async (tx) => {
		await tx.role.update({
			where: { id: roleId },
			data: {
				...(input.name !== undefined ? { name: input.name.trim() } : {}),
				...(input.description !== undefined
					? { description: input.description?.trim() || null }
					: {}),
			},
		});

		if (input.permissionKeys !== undefined) {
			await tx.rolePermission.deleteMany({
				where: { roleId },
			});
			await tx.rolePermission.createMany({
				data: permissions.map((permission) => ({
					roleId,
					permissionId: permission.id,
				})),
			});
		}

		await ensureGovernanceCoverage(tx, organizationId);
		return getOrganizationRoleById(organizationId, roleId, tx);
	});
}

export async function archiveRoleService(
	organizationId: string,
	roleId: string,
) {
	const role = await getOrganizationRoleById(organizationId, roleId);
	if (role.isSystem) {
		throw new ForbiddenError('Built-in roles cannot be archived');
	}

	const [activeAssignments, pendingInvites] = await Promise.all([
		prisma.roleAssignment.count({
			where: {
				organizationId,
				roleId,
			},
		}),
		db.inviteTokenRole.count({
			where: {
				roleId,
				inviteToken: {
					organizationId,
					usedAt: null,
					revokedAt: null,
					expiresAt: { gt: new Date() },
				},
			},
		}),
	]);

	if (activeAssignments > 0 || pendingInvites > 0) {
		throw new ConflictError(
			'This role is still assigned to members or pending invitations.',
		);
	}

	await prisma.role.update({
		where: { id: roleId },
		data: { archivedAt: new Date() },
	});

	return { message: 'Role archived successfully' };
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

	const existingAssignments = await prisma.roleAssignment.findMany({
		where: {
			userId: targetUserId,
			organizationId,
		},
		select: {
			roleId: true,
			role: {
				select: {
					name: true,
					organizationRoleKind: true,
				},
			},
		},
	});

	const hasTeamRole = existingAssignments.some(
		(assignment) => assignment.role.organizationRoleKind === 'TEAM',
	);
	const isCaregiverOnly =
		existingAssignments.some((assignment) => assignment.role.name === CARER_ROLE_NAME) &&
		!hasTeamRole;

	if (isCaregiverOnly) {
		throw new ForbiddenError('Carer members must be managed through the carer flow');
	}

	const requestedRoles =
		input.roleIds === undefined
			? null
			: await resolveAssignableRoleIds(organizationId, 'team', input.roleIds);
	const requestedRoleIdSet = requestedRoles ? new Set(requestedRoles.map((role) => role.id)) : null;
	const currentTeamRoleIds = existingAssignments
		.filter((assignment) => assignment.role.organizationRoleKind === 'TEAM')
		.map((assignment) => assignment.roleId);

	if (requestedRoles || input.status) {
		await prisma.$transaction(async (tx) => {
			if (requestedRoles) {
				await tx.roleAssignment.deleteMany({
					where: {
						userId: targetUserId,
						organizationId,
						role: {
							organizationRoleKind: 'TEAM',
						},
					},
				});

				if (requestedRoles.length > 0) {
					await tx.roleAssignment.createMany({
						data: requestedRoles.map((role) => ({
							userId: targetUserId,
							roleId: role.id,
							organizationId,
						})),
						skipDuplicates: true,
					});
				}
			}

			if (input.status) {
				await tx.organizationUser.update({
					where: { id: orgUser.id },
					data: { status: input.status },
				});
			}

			const nextStatus = input.status ?? orgUser.status;
			const nextRoleIds = requestedRoleIdSet
				? [...requestedRoleIdSet]
				: currentTeamRoleIds;

			await ensureGovernanceCoverage(tx, organizationId, {
				targetUserId,
				nextStatus,
				nextRoleIds,
			});
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
			role: { select: { name: true, organizationRoleKind: true } },
		},
	});

	const isCaregiverOnly =
		existingAssignments.some((assignment) => assignment.role.name === CARER_ROLE_NAME) &&
		!existingAssignments.some(
			(assignment) => assignment.role.organizationRoleKind === 'TEAM',
		);

	if (isCaregiverOnly) {
		throw new ForbiddenError('Carer members must be managed through the carer flow');
	}

	if (targetUserId === actingUserId) {
		throw new ConflictError('Cannot remove yourself from the organization');
	}

	await prisma.$transaction(async (tx) => {
		await tx.organizationUser.update({
			where: { id: orgUser.id },
			data: { status: 'LEFT', leftAt: new Date() },
		});

		await ensureGovernanceCoverage(tx, organizationId, {
			targetUserId,
			nextStatus: 'LEFT',
			nextRoleIds: [],
		});
	});

	return { message: 'Member removed successfully' };
}

async function getOrganizationRoleById(
	organizationId: string,
	roleId: string,
	tx: typeof prisma | any = prisma,
) {
	const role = await tx.role.findFirst({
		where: {
			id: roleId,
			scope: 'ORGANIZATION',
			archivedAt: null,
			OR: [{ isSystem: true, organizationId: null }, { organizationId }],
		},
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
	});

	if (!role) {
		throw new NotFoundError('Role not found');
	}

	return {
		id: role.id,
		key: role.key,
		name: role.name,
		description: role.description,
		isSystem: role.isSystem,
		organizationId: role.organizationId,
		permissions: role.permissions.map((entry: any) => entry.permission),
	};
}

async function resolveAssignableRoleIds(
	organizationId: string,
	kind: RoleKind,
	roleIds: string[],
) {
	const allowedRoles = await listOrganizationRoles(kind, organizationId);
	const roleById = new Map(allowedRoles.map((role) => [role.id, role]));
	const resolved = roleIds.map((roleId) => roleById.get(roleId)).filter(Boolean);

	if (resolved.length !== roleIds.length) {
		throw new ForbiddenError('Invalid organization role');
	}

	return resolved as RoleSummary[];
}

async function resolvePermissions(permissionKeys: string[]) {
	const normalizedKeys = [...new Set(permissionKeys.map((key) => key.trim()).filter(Boolean))];
	if (normalizedKeys.length === 0) {
		throw new ForbiddenError('At least one permission is required');
	}

	const permissions = await prisma.permission.findMany({
		where: { key: { in: normalizedKeys } },
		select: { id: true, key: true, description: true },
	});

	if (permissions.length !== normalizedKeys.length) {
		throw new ForbiddenError('One or more permission keys are invalid');
	}

	return permissions;
}

async function ensureGovernanceCoverage(
	tx: typeof prisma | any,
	organizationId: string,
	override?: {
		targetUserId: string;
		nextStatus: string;
		nextRoleIds: string[];
	},
) {
	const members = await tx.organizationUser.findMany({
		where: {
			organizationId,
			status: { in: ['ACTIVE', 'SUSPENDED'] },
		},
		select: {
			userId: true,
			status: true,
		},
	});

	const roleAssignments = await tx.roleAssignment.findMany({
		where: {
			organizationId,
			userId: { in: members.map((member: { userId: string }) => member.userId) },
			role: {
				scope: 'ORGANIZATION',
				archivedAt: null,
			},
		},
		select: {
			userId: true,
			roleId: true,
			role: {
				select: {
					permissions: {
						select: {
							permission: {
								select: {
									key: true,
								},
							},
						},
					},
					organizationRoleKind: true,
				},
			},
		},
	});

	const assignmentPermissions = new Map<string, Set<string>>();
	for (const assignment of roleAssignments) {
		if (assignment.role.organizationRoleKind !== 'TEAM') {
			continue;
		}

		const current = assignmentPermissions.get(assignment.userId) ?? new Set<string>();
		for (const permission of assignment.role.permissions) {
			current.add(permission.permission.key);
		}
		assignmentPermissions.set(assignment.userId, current);
	}

	if (override) {
		const overrideRoleAssignments = await tx.roleAssignment.findMany({
			where: {
				organizationId,
				userId: override.targetUserId,
				roleId: { in: override.nextRoleIds },
			},
			select: {
				role: {
					select: {
						permissions: {
							select: {
								permission: {
									select: {
										key: true,
									},
								},
							},
						},
					},
				},
			},
		});

		const nextPermissions = new Set<string>();
		for (const assignment of overrideRoleAssignments) {
			for (const permission of assignment.role.permissions) {
				nextPermissions.add(permission.permission.key);
			}
		}
		assignmentPermissions.set(override.targetUserId, nextPermissions);
	}

	const hasGovernanceMember = members.some((member: { userId: string; status: string }) => {
		const effectiveStatus =
			override && override.targetUserId === member.userId
				? override.nextStatus
				: member.status;

		if (effectiveStatus !== 'ACTIVE') {
			return false;
		}

		const permissions = assignmentPermissions.get(member.userId) ?? new Set<string>();
		return GOVERNANCE_PERMISSION_KEYS.every((key) => permissions.has(key));
	});

	if (!hasGovernanceMember) {
		throw new ConflictError(
			'At least one active member must keep both member-management and role-management access.',
		);
	}
}
