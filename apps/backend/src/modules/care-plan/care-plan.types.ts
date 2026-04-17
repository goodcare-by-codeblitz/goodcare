export type CarePlanConditionInput = {
	name: string;
	diagnosedYear?: number | undefined;
	description?: string | undefined;
	patientImpact?: string | undefined;
	carerNotes?: string | undefined;
};

export type CarePlanRiskInput = {
	label: string;
	level?: 'LOW' | 'MEDIUM' | 'HIGH' | undefined;
	notes: string;
	reviewDate?: string | undefined;
};

export type CarePlanTaskInput = {
	label: string;
	visitType: string;
	required?: boolean | undefined;
	notes?: string | undefined;
};

export type CarePlanGoalInput = {
	description: string;
	category: string;
	targetDate?: string | undefined;
	status?: 'ACTIVE' | 'ACHIEVED' | 'PAUSED' | undefined;
	notes?: string | undefined;
};

export type CreateCarePlanBody = {
	patientId: string;
	summary: string;
	status?: 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED' | undefined;
	conditions?: CarePlanConditionInput[] | undefined;
	risks?: CarePlanRiskInput[] | undefined;
	tasks?: CarePlanTaskInput[] | undefined;
	goals?: CarePlanGoalInput[] | undefined;
};

export type UpdateCarePlanBody = {
	summary?: string | undefined;
	status?: 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED' | undefined;
	conditions?: CarePlanConditionInput[] | undefined;
	risks?: CarePlanRiskInput[] | undefined;
	tasks?: CarePlanTaskInput[] | undefined;
	goals?: CarePlanGoalInput[] | undefined;
};

export type CarePlanListQuery = {
	page?: string | undefined;
	limit?: string | undefined;
	patientId?: string | undefined;
	status?: string | undefined;
};
