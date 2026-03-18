export type CreateIncidentReportBody = {
	description: string;
	severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
	patientId?: string | undefined;
	visitId?: string | undefined;
};

export type UpdateIncidentReportBody = {
	description?: string | undefined;
	severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined;
	status?: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED' | undefined;
};

export type IncidentReportListQuery = {
	page?: string | undefined;
	limit?: string | undefined;
	status?: string | undefined;
	severity?: string | undefined;
};
