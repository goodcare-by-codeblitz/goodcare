export type CreateCarePlanBody = {
	patientId: string;
	goals: string;
	status?: 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED' | undefined;
};

export type UpdateCarePlanBody = {
	goals?: string | undefined;
	status?: 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED' | undefined;
};

export type CarePlanListQuery = {
	page?: string | undefined;
	limit?: string | undefined;
	patientId?: string | undefined;
	status?: string | undefined;
};
