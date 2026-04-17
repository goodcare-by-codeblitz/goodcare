import axios from 'axios';
import { getCurrentOrgSlug } from '@/lib/auth-session';

export type OrgContext = {
	organizationId: string;
	organizationSlug: string;
	organizationName: string;
};

export type TeamRole = {
	id: string;
	name: string;
};

export type TeamMember = {
	id: string;
	userId: string;
	status: 'ACTIVE' | 'SUSPENDED';
	invitedAt: string;
	joinedAt: string | null;
	invitedBy: {
		firstName: string;
		lastName: string;
		email: string;
	};
	user: {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
	};
	role: TeamRole | null;
};

export type TeamInvite = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: TeamRole;
	invitedAt: string;
	expiresAt: string;
	invitedBy: {
		firstName: string;
		lastName: string;
		email: string;
	};
	kind: 'TEAM';
};

export type CarerStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';

export type CarerListItem = {
	id: string;
	organizationUserId: string;
	firstName: string;
	lastName: string;
	email: string;
	employmentType: string;
	experienceYears: number;
	hireDate: string;
	status: CarerStatus;
	updatedAt: string;
};

export type CarerInvite = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: TeamRole;
	invitedAt: string;
	expiresAt: string;
	invitedBy: {
		firstName: string;
		lastName: string;
		email: string;
	};
	kind: 'CARER';
};

type CarerApiRecord = {
	id: string;
	organizationUserId: string;
	hireDate: string;
	employmentType: string;
	experienceYears: number;
	status: CarerStatus;
	updatedAt: string;
	organizationUser: {
		user: {
			firstName: string;
			lastName: string;
			email: string;
		};
	};
};

export const TEAM_ROLE_META: Record<
	string,
	{ description: string; category: 'admin' | 'manager' | 'viewer' }
> = {
	Admin: {
		description:
			'Full access to organization settings, team management, and operational data.',
		category: 'admin',
	},
	Manager: {
		description:
			'Manage day-to-day operations, staff access, and care delivery workflows.',
		category: 'manager',
	},
	Viewer: {
		description:
			'Read-only access to organization dashboards, reports, and summaries.',
		category: 'viewer',
	},
};

function getBackendBaseUrl() {
	const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.replace(/\/+$/, '');
	if (!baseUrl) {
		throw new Error('Missing NEXT_PUBLIC_BACKEND_BASE_URL in apps/web/.env');
	}

	return baseUrl;
}

function getOrgHeader() {
	const orgSlug = getCurrentOrgSlug();
	if (!orgSlug) {
		throw new Error('Unable to determine the current organization from the URL');
	}

	return orgSlug;
}

function extractErrorMessage(error: unknown, fallback: string) {
	if (axios.isAxiosError(error)) {
		const message = error.response?.data?.error;
		if (typeof message === 'string' && message.length > 0) {
			return message;
		}
	}

	return fallback;
}

export function getOrgManagementError(error: unknown, fallback: string) {
	return extractErrorMessage(error, fallback);
}

export function getOrgManagementStatusCode(error: unknown) {
	if (axios.isAxiosError(error)) {
		return error.response?.status ?? null;
	}

	return null;
}

export async function getCurrentOrgContext(): Promise<OrgContext> {
	const baseUrl = getBackendBaseUrl();
	const orgSlug = getOrgHeader();
	const response = await axios.get(`${baseUrl}/v1/auth/current-org-access`, {
		withCredentials: true,
		headers: {
			'x-org-slug': orgSlug,
		},
	});

	if (!response.data?.authorized || !response.data.organizationId) {
		throw new Error('You do not have access to the current organization');
	}

	return {
		organizationId: response.data.organizationId,
		organizationSlug: response.data.organizationSlug,
		organizationName: response.data.organizationName,
	};
}

export async function fetchTeamRoles(organizationId: string) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(`${baseUrl}/v1/orgs/${organizationId}/roles`, {
		params: { kind: 'team' },
		withCredentials: true,
	});

	return response.data.roles as TeamRole[];
}

export async function fetchTeamMembers(organizationId: string) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(`${baseUrl}/v1/orgs/${organizationId}/members`, {
		withCredentials: true,
	});

	return response.data.members as TeamMember[];
}

export async function fetchTeamInvites(organizationId: string) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(
		`${baseUrl}/v1/orgs/${organizationId}/invitations`,
		{
			withCredentials: true,
		},
	);

	return response.data.invites as TeamInvite[];
}

export async function createTeamInvite(
	organizationId: string,
	input: {
		firstName: string;
		lastName: string;
		email: string;
		roleId: string;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.post(
		`${baseUrl}/v1/orgs/${organizationId}/invitations`,
		input,
		{
			withCredentials: true,
		},
	);

	return response.data.invite as TeamInvite;
}

export async function createCarerInvite(
	organizationId: string,
	input: {
		firstName: string;
		lastName: string;
		email: string;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.post(
		`${baseUrl}/v1/orgs/${organizationId}/carer-invitations`,
		input,
		{
			withCredentials: true,
		},
	);

	return response.data.invite as CarerInvite;
}

export async function fetchCarers(
	organizationId: string,
	params?: {
		page?: number;
		limit?: number;
		search?: string;
		status?: CarerStatus;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(`${baseUrl}/v1/orgs/${organizationId}/carers`, {
		params,
		withCredentials: true,
	});

	return (response.data.carers as CarerApiRecord[]).map((carer) => ({
		id: carer.id,
		organizationUserId: carer.organizationUserId,
		firstName: carer.organizationUser.user.firstName,
		lastName: carer.organizationUser.user.lastName,
		email: carer.organizationUser.user.email,
		employmentType: carer.employmentType,
		experienceYears: carer.experienceYears,
		hireDate: carer.hireDate,
		status: carer.status,
		updatedAt: carer.updatedAt,
	})) as CarerListItem[];
}

export async function fetchCarerInvites(organizationId: string) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(
		`${baseUrl}/v1/orgs/${organizationId}/carer-invitations`,
		{
			withCredentials: true,
		},
	);

	return response.data.invites as CarerInvite[];
}

export async function revokeCarerInvite(
	organizationId: string,
	inviteId: string,
) {
	const baseUrl = getBackendBaseUrl();
	await axios.delete(
		`${baseUrl}/v1/orgs/${organizationId}/carer-invitations/${inviteId}`,
		{
			withCredentials: true,
		},
	);
}

export async function updateTeamMember(
	organizationId: string,
	userId: string,
	input: {
		roleId?: string | null;
		status?: 'ACTIVE' | 'SUSPENDED';
	},
) {
	const baseUrl = getBackendBaseUrl();
	await axios.patch(
		`${baseUrl}/v1/orgs/${organizationId}/members/${userId}`,
		input,
		{
			withCredentials: true,
		},
	);
}

export async function removeTeamMember(
	organizationId: string,
	userId: string,
) {
	const baseUrl = getBackendBaseUrl();
	await axios.delete(`${baseUrl}/v1/orgs/${organizationId}/members/${userId}`, {
		withCredentials: true,
	});
}

export async function revokeTeamInvite(
	organizationId: string,
	inviteId: string,
) {
	const baseUrl = getBackendBaseUrl();
	await axios.delete(
		`${baseUrl}/v1/orgs/${organizationId}/invitations/${inviteId}`,
		{
			withCredentials: true,
		},
	);
}
