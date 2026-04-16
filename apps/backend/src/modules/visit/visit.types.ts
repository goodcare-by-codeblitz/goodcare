export type CreateVisitBody = {
	patientId: string;
	scheduledStart: string;
	scheduledEnd: string;
	status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | undefined;
};

export type UpdateVisitBody = {
	scheduledStart?: string | undefined;
	scheduledEnd?: string | undefined;
	actualStart?: string | undefined;
	actualEnd?: string | undefined;
	status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | undefined;
};

export type VisitListQuery = {
	page?: string | undefined;
	limit?: string | undefined;
	patientId?: string | undefined;
	status?: string | undefined;
	from?: string | undefined;
	to?: string | undefined;
};

export type AssignCarerBody = {
	carerId: string;
};
