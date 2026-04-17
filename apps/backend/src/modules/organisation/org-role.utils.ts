import { prisma } from '@repo/db';

export const TEAM_ROLE_NAMES = ['Admin', 'Manager', 'Viewer'] as const;
export const CARER_ROLE_NAME = 'Caregiver' as const;

export type OrganizationRoleKind = 'team' | 'carer';

export type OrganizationRoleSummary = {
	id: string;
	name: string;
};

export function isTeamRoleName(name: string) {
	return TEAM_ROLE_NAMES.includes(name as (typeof TEAM_ROLE_NAMES)[number]);
}

export function isCarerRoleName(name: string) {
	return name === CARER_ROLE_NAME;
}

export async function listOrganizationRoles(
	kind: OrganizationRoleKind,
): Promise<OrganizationRoleSummary[]> {
	const names =
		kind === 'team' ? [...TEAM_ROLE_NAMES] : [CARER_ROLE_NAME];

	const roles = await prisma.role.findMany({
		where: {
			scope: 'ORGANIZATION',
			name: { in: names },
		},
		select: { id: true, name: true },
	});

	const roleByName = new Map(roles.map((role) => [role.name, role]));
	return names
		.map((name) => roleByName.get(name))
		.filter((role): role is OrganizationRoleSummary => Boolean(role));
}
