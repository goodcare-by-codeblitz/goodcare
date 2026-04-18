import { prisma } from '@repo/db';

export const SYSTEM_TEAM_ROLE_KEYS = [
	'org_admin',
	'org_manager',
	'org_viewer',
] as const;
export const SYSTEM_CARER_ROLE_KEYS = ['org_caregiver'] as const;

export const SYSTEM_TEAM_ROLE_NAMES = ['Admin', 'Manager', 'Viewer'] as const;
export const CARER_ROLE_NAME = 'Caregiver' as const;

export type OrganizationRoleKind = 'team' | 'carer';

export type OrganizationRoleSummary = {
	id: string;
	key: string;
	name: string;
	description: string | null;
	isSystem: boolean;
	organizationId: string | null;
	permissions: Array<{ id: string; key: string; description: string }>;
};

function dbRoleKind(kind: OrganizationRoleKind) {
	return kind === 'team' ? 'TEAM' : 'CARER';
}

export function isTeamRoleName(name: string) {
	return SYSTEM_TEAM_ROLE_NAMES.includes(
		name as (typeof SYSTEM_TEAM_ROLE_NAMES)[number],
	);
}

export function isCarerRoleName(name: string) {
	return name === CARER_ROLE_NAME;
}

export function buildCustomRoleKey(organizationId: string, name: string) {
	const normalized = name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 40);

	return `org_${organizationId.replace(/-/g, '').slice(0, 8)}_${normalized || 'role'}`;
}

export async function listOrganizationRoles(
	kind: OrganizationRoleKind,
	organizationId?: string,
): Promise<OrganizationRoleSummary[]> {
	const roles = await prisma.role.findMany({
		where: {
			scope: 'ORGANIZATION',
			organizationRoleKind: dbRoleKind(kind),
			archivedAt: null,
			OR: [{ isSystem: true, organizationId: null }, ...(organizationId ? [{ organizationId }] : [])],
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
				orderBy: {
					permission: {
						key: 'asc',
					},
				},
			},
		},
		orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
	});

	return roles.map((role) => ({
		id: role.id,
		key: role.key,
		name: role.name,
		description: role.description,
		isSystem: role.isSystem,
		organizationId: role.organizationId,
		permissions: role.permissions.map((entry) => entry.permission),
	}));
}
