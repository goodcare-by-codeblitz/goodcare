import axios from 'axios';
import { getCurrentOrgSlug } from '@/lib/auth-session';

export type OrgContext = {
	organizationId: string;
	organizationSlug: string;
	organizationName: string;
	permissions: string[];
};

export type PaginationMeta = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
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

export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_SPECIFIED';
export type PatientStatus = 'ACTIVE' | 'INACTIVE';

export type PatientListItem = {
	id: string;
	firstName: string;
	lastName: string;
	dateOfBirth: string;
	gender: PatientGender;
	status: PatientStatus;
	createdAt: string;
};

export type PatientDetail = PatientListItem & {
	genderDescription: string | null;
	updatedAt: string;
};

export type PatientAddress = {
	line1: string;
	line2: string | null;
	city: string;
	postcode: string;
	country: string;
};

export type PatientEmergencyContact = {
	id: string;
	name: string;
	relationship: string;
	phone: string;
	email: string | null;
	isPrimary: boolean;
};

export type PatientAllergy = {
	id: string;
	name: string;
	notes: string | null;
};

export type PatientProfile = PatientDetail & {
	address: PatientAddress | null;
	emergencyContacts: PatientEmergencyContact[];
	allergies: PatientAllergy[];
	medicalSummary: string | null;
	careRequirements: string | null;
};

export type CarePlanStatus = 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';
export type CarePlanRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type CarePlanGoalStatus = 'ACTIVE' | 'ACHIEVED' | 'PAUSED';

export type CarePlanCondition = {
	id: string;
	name: string;
	diagnosedYear: number | null;
	description: string | null;
	patientImpact: string | null;
	carerNotes: string | null;
};

export type CarePlanRisk = {
	id: string;
	label: string;
	level: CarePlanRiskLevel;
	notes: string;
	reviewDate: string | null;
};

export type CarePlanTask = {
	id: string;
	label: string;
	visitType: string;
	required: boolean;
	notes: string | null;
};

export type CarePlanGoal = {
	id: string;
	description: string;
	category: string;
	targetDate: string | null;
	status: CarePlanGoalStatus;
	notes: string | null;
};

export type CarePlanListItem = {
	id: string;
	version: number;
	summary: string;
	status: CarePlanStatus;
	patientId: string;
	organizationId: string;
	createdById: string;
	createdAt: string;
	updatedAt: string;
	patient: { id: string; firstName: string; lastName: string };
};

export type CarePlanDetail = CarePlanListItem & {
	createdBy: {
		firstName: string;
		lastName: string;
		email: string;
	};
	conditions: CarePlanCondition[];
	risks: CarePlanRisk[];
	tasks: CarePlanTask[];
	goals: CarePlanGoal[];
};

export type MedicationStatus = 'ACTIVE' | 'PRN' | 'DISCONTINUED';
export type MedicationAdministrationResult = 'GIVEN' | 'MISSED' | 'REFUSED' | 'NA';

export type MedicationSchedule = {
	morning: boolean;
	noon: boolean;
	evening: boolean;
	night: boolean;
	bedtime: boolean;
};

export type MedicationRecord = {
	id: string;
	patientId: string;
	organizationId: string;
	name: string;
	doseAmount: string;
	doseUnit: string;
	route: string;
	frequency: string;
	schedule: MedicationSchedule;
	startDate: string;
	endDate: string | null;
	prescriber: string;
	instructions: string;
	status: MedicationStatus;
	prnIndication: string | null;
	prnMaxDose: string | null;
	createdAt: string;
	updatedAt: string;
	patient: { id: string; firstName: string; lastName: string };
};

export type MedicationAdministrationRecord = {
	id: string;
	medicationId: string;
	patientId: string;
	organizationId: string;
	result: MedicationAdministrationResult;
	scheduledFor: string | null;
	administeredAt: string | null;
	notes: string | null;
	actorUser: {
		firstName: string;
		lastName: string;
		email: string;
	} | null;
	createdAt: string;
	updatedAt: string;
};

export type VisitStatus =
	| 'SCHEDULED'
	| 'IN_PROGRESS'
	| 'COMPLETED'
	| 'CANCELLED'
	| 'NO_SHOW';

export type VisitAssignment = {
	id: string;
	isActive: boolean;
	carer: {
		id: string;
		organizationUser: {
			user: {
				firstName: string;
				lastName: string;
			};
		};
	};
};

export type VisitRecord = {
	id: string;
	scheduledStart: string;
	scheduledEnd: string;
	actualStart: string | null;
	actualEnd: string | null;
	status: VisitStatus;
	patientId: string;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
	patient: {
		id?: string;
		firstName: string;
		lastName: string;
	};
	assignments: VisitAssignment[];
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
		permissions: Array.isArray(response.data.permissions)
			? response.data.permissions
			: [],
	};
}

export function hasOrgPermission(
	context: Pick<OrgContext, 'permissions'>,
	permission: string,
) {
	return context.permissions.includes(permission);
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
	const response = await axios.get(`${baseUrl}/v1/orgs/${organizationId}/invitations`, {
		withCredentials: true,
	});

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

export async function revokeCarerInvite(organizationId: string, inviteId: string) {
	const baseUrl = getBackendBaseUrl();
	await axios.delete(
		`${baseUrl}/v1/orgs/${organizationId}/carer-invitations/${inviteId}`,
		{
			withCredentials: true,
		},
	);
}

export async function fetchPatients(
	organizationId: string,
	params?: {
		page?: number;
		limit?: number;
		search?: string;
		status?: PatientStatus;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(`${baseUrl}/v1/orgs/${organizationId}/patients`, {
		params,
		withCredentials: true,
	});

	return response.data as {
		patients: PatientListItem[];
		pagination: PaginationMeta;
	};
}

export async function fetchPatient(organizationId: string, patientId: string) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(
		`${baseUrl}/v1/orgs/${organizationId}/patients/${patientId}`,
		{
			withCredentials: true,
		},
	);

	return response.data as PatientDetail;
}

export async function fetchPatientProfile(
	organizationId: string,
	patientId: string,
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(
		`${baseUrl}/v1/orgs/${organizationId}/patients/${patientId}/profile`,
		{
			withCredentials: true,
		},
	);

	return response.data as PatientProfile;
}

export async function createPatient(
	organizationId: string,
	input: {
		firstName: string;
		lastName: string;
		dateOfBirth: string;
		gender?: PatientGender;
		genderDescription?: string;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.post(`${baseUrl}/v1/orgs/${organizationId}/patients`, input, {
		withCredentials: true,
	});

	return response.data as PatientListItem;
}

export async function updatePatient(
	organizationId: string,
	patientId: string,
	input: {
		firstName?: string;
		lastName?: string;
		dateOfBirth?: string;
		gender?: PatientGender;
		genderDescription?: string;
		status?: PatientStatus;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.patch(
		`${baseUrl}/v1/orgs/${organizationId}/patients/${patientId}`,
		input,
		{
			withCredentials: true,
		},
	);

	return response.data as PatientDetail;
}

export async function updatePatientProfile(
	organizationId: string,
	patientId: string,
	input: {
		address?:
			| {
					line1: string;
					line2?: string;
					city: string;
					postcode: string;
					country: string;
			  }
			| null;
		emergencyContacts?: Array<{
			name: string;
			relationship: string;
			phone: string;
			email?: string;
			isPrimary?: boolean;
		}>;
		allergies?: Array<{
			name: string;
			notes?: string;
		}>;
		medicalSummary?: string | null;
		careRequirements?: string | null;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.patch(
		`${baseUrl}/v1/orgs/${organizationId}/patients/${patientId}/profile`,
		input,
		{
			withCredentials: true,
		},
	);

	return response.data as PatientProfile;
}

export async function deletePatient(organizationId: string, patientId: string) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.delete(
		`${baseUrl}/v1/orgs/${organizationId}/patients/${patientId}`,
		{
			withCredentials: true,
		},
	);

	return response.data as { message: string };
}

export async function fetchCarePlans(
	organizationId: string,
	params?: {
		page?: number;
		limit?: number;
		patientId?: string;
		status?: CarePlanStatus;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(`${baseUrl}/v1/orgs/${organizationId}/care-plans`, {
		params,
		withCredentials: true,
	});

	return response.data as {
		carePlans: CarePlanListItem[];
		pagination: PaginationMeta;
	};
}

export async function fetchCarePlan(organizationId: string, carePlanId: string) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(
		`${baseUrl}/v1/orgs/${organizationId}/care-plans/${carePlanId}`,
		{
			withCredentials: true,
		},
	);

	return response.data as CarePlanDetail;
}

export async function createCarePlan(
	organizationId: string,
	input: {
		patientId: string;
		summary: string;
		status?: CarePlanStatus;
		conditions?: Array<{
			name: string;
			diagnosedYear?: number;
			description?: string;
			patientImpact?: string;
			carerNotes?: string;
		}>;
		risks?: Array<{
			label: string;
			level?: CarePlanRiskLevel;
			notes: string;
			reviewDate?: string;
		}>;
		tasks?: Array<{
			label: string;
			visitType: string;
			required?: boolean;
			notes?: string;
		}>;
		goals?: Array<{
			description: string;
			category: string;
			targetDate?: string;
			status?: CarePlanGoalStatus;
			notes?: string;
		}>;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.post(
		`${baseUrl}/v1/orgs/${organizationId}/care-plans`,
		input,
		{
			withCredentials: true,
		},
	);

	return response.data as CarePlanDetail;
}

export async function updateCarePlan(
	organizationId: string,
	carePlanId: string,
	input: {
		summary?: string;
		status?: CarePlanStatus;
		conditions?: Array<{
			name: string;
			diagnosedYear?: number;
			description?: string;
			patientImpact?: string;
			carerNotes?: string;
		}>;
		risks?: Array<{
			label: string;
			level?: CarePlanRiskLevel;
			notes: string;
			reviewDate?: string;
		}>;
		tasks?: Array<{
			label: string;
			visitType: string;
			required?: boolean;
			notes?: string;
		}>;
		goals?: Array<{
			description: string;
			category: string;
			targetDate?: string;
			status?: CarePlanGoalStatus;
			notes?: string;
		}>;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.patch(
		`${baseUrl}/v1/orgs/${organizationId}/care-plans/${carePlanId}`,
		input,
		{
			withCredentials: true,
		},
	);

	return response.data as CarePlanDetail;
}

export async function deleteCarePlan(organizationId: string, carePlanId: string) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.delete(
		`${baseUrl}/v1/orgs/${organizationId}/care-plans/${carePlanId}`,
		{
			withCredentials: true,
		},
	);

	return response.data as { message: string };
}

export async function fetchMedications(
	organizationId: string,
	params?: {
		page?: number;
		limit?: number;
		patientId?: string;
		search?: string;
		status?: MedicationStatus;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(`${baseUrl}/v1/orgs/${organizationId}/medications`, {
		params,
		withCredentials: true,
	});

	return response.data as {
		medications: MedicationRecord[];
		pagination: PaginationMeta;
	};
}

export async function fetchMedication(
	organizationId: string,
	patientId: string,
	medicationId: string,
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(
		`${baseUrl}/v1/orgs/${organizationId}/patients/${patientId}/medications/${medicationId}`,
		{
			withCredentials: true,
		},
	);

	return response.data as MedicationRecord;
}

export async function createMedication(
	organizationId: string,
	patientId: string,
	input: {
		name: string;
		doseAmount: string;
		doseUnit: string;
		route: string;
		frequency: string;
		schedule?: Partial<MedicationSchedule>;
		startDate: string;
		endDate?: string;
		prescriber: string;
		instructions: string;
		status?: MedicationStatus;
		prnIndication?: string;
		prnMaxDose?: string;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.post(
		`${baseUrl}/v1/orgs/${organizationId}/patients/${patientId}/medications`,
		input,
		{
			withCredentials: true,
		},
	);

	return response.data as MedicationRecord;
}

export async function updateMedication(
	organizationId: string,
	patientId: string,
	medicationId: string,
	input: {
		name?: string;
		doseAmount?: string;
		doseUnit?: string;
		route?: string;
		frequency?: string;
		schedule?: Partial<MedicationSchedule>;
		startDate?: string;
		endDate?: string;
		prescriber?: string;
		instructions?: string;
		status?: MedicationStatus;
		prnIndication?: string;
		prnMaxDose?: string;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.patch(
		`${baseUrl}/v1/orgs/${organizationId}/patients/${patientId}/medications/${medicationId}`,
		input,
		{
			withCredentials: true,
		},
	);

	return response.data as MedicationRecord;
}

export async function deleteMedication(
	organizationId: string,
	patientId: string,
	medicationId: string,
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.delete(
		`${baseUrl}/v1/orgs/${organizationId}/patients/${patientId}/medications/${medicationId}`,
		{
			withCredentials: true,
		},
	);

	return response.data as { message: string };
}

export async function fetchMedicationAdministrations(
	organizationId: string,
	patientId: string,
	medicationId: string,
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(
		`${baseUrl}/v1/orgs/${organizationId}/patients/${patientId}/medications/${medicationId}/administrations`,
		{
			withCredentials: true,
		},
	);

	return response.data as { administrations: MedicationAdministrationRecord[] };
}

export async function createMedicationAdministration(
	organizationId: string,
	patientId: string,
	medicationId: string,
	input: {
		result: MedicationAdministrationResult;
		scheduledFor?: string;
		administeredAt?: string;
		notes?: string;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.post(
		`${baseUrl}/v1/orgs/${organizationId}/patients/${patientId}/medications/${medicationId}/administrations`,
		input,
		{
			withCredentials: true,
		},
	);

	return response.data as MedicationAdministrationRecord;
}

export async function fetchVisits(
	organizationId: string,
	params?: {
		page?: number;
		limit?: number;
		patientId?: string;
		status?: VisitStatus;
		from?: string;
		to?: string;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(`${baseUrl}/v1/orgs/${organizationId}/visits`, {
		params,
		withCredentials: true,
	});

	return response.data as {
		visits: VisitRecord[];
		pagination: PaginationMeta;
	};
}

export async function fetchVisit(organizationId: string, visitId: string) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.get(
		`${baseUrl}/v1/orgs/${organizationId}/visits/${visitId}`,
		{
			withCredentials: true,
		},
	);

	return response.data as VisitRecord;
}

export async function createVisit(
	organizationId: string,
	input: {
		patientId: string;
		scheduledStart: string;
		scheduledEnd: string;
		status?: VisitStatus;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.post(`${baseUrl}/v1/orgs/${organizationId}/visits`, input, {
		withCredentials: true,
	});

	return response.data as VisitRecord;
}

export async function updateVisit(
	organizationId: string,
	visitId: string,
	input: {
		scheduledStart?: string;
		scheduledEnd?: string;
		actualStart?: string;
		actualEnd?: string;
		status?: VisitStatus;
	},
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.patch(
		`${baseUrl}/v1/orgs/${organizationId}/visits/${visitId}`,
		input,
		{
			withCredentials: true,
		},
	);

	return response.data as VisitRecord;
}

export async function deleteVisit(organizationId: string, visitId: string) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.delete(`${baseUrl}/v1/orgs/${organizationId}/visits/${visitId}`, {
		withCredentials: true,
	});

	return response.data as { message: string };
}

export async function assignVisitCarer(
	organizationId: string,
	visitId: string,
	carerId: string,
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.post(
		`${baseUrl}/v1/orgs/${organizationId}/visits/${visitId}/assign`,
		{ carerId },
		{
			withCredentials: true,
		},
	);

	return response.data as { id: string };
}

export async function unassignVisitCarer(
	organizationId: string,
	visitId: string,
	carerId: string,
) {
	const baseUrl = getBackendBaseUrl();
	const response = await axios.delete(
		`${baseUrl}/v1/orgs/${organizationId}/visits/${visitId}/assign/${carerId}`,
		{
			withCredentials: true,
		},
	);

	return response.data as { message: string };
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
	await axios.patch(`${baseUrl}/v1/orgs/${organizationId}/members/${userId}`, input, {
		withCredentials: true,
	});
}

export async function removeTeamMember(organizationId: string, userId: string) {
	const baseUrl = getBackendBaseUrl();
	await axios.delete(`${baseUrl}/v1/orgs/${organizationId}/members/${userId}`, {
		withCredentials: true,
	});
}

export async function revokeTeamInvite(organizationId: string, inviteId: string) {
	const baseUrl = getBackendBaseUrl();
	await axios.delete(`${baseUrl}/v1/orgs/${organizationId}/invitations/${inviteId}`, {
		withCredentials: true,
	});
}
