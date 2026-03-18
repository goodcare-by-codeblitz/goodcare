export const createIncidentReportSchema = {
	schema: {
		tags: ['Incident Reports'],
		body: {
			type: 'object',
			required: ['description', 'severity'],
			properties: {
				description: { type: 'string', minLength: 1 },
				severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
				patientId: { type: 'string', format: 'uuid' },
				visitId: { type: 'string', format: 'uuid' },
			},
		},
	},
};

export const updateIncidentReportSchema = {
	schema: {
		tags: ['Incident Reports'],
		params: { type: 'object', required: ['organizationId', 'incidentId'], properties: { organizationId: { type: 'string', format: 'uuid' }, incidentId: { type: 'string', format: 'uuid' } } },
		body: {
			type: 'object',
			properties: {
				description: { type: 'string', minLength: 1 },
				severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
				status: { type: 'string', enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] },
			},
		},
	},
};

export const listIncidentReportsSchema = {
	schema: {
		tags: ['Incident Reports'],
		querystring: {
			type: 'object',
			properties: {
				page: { type: 'string' },
				limit: { type: 'string' },
				status: { type: 'string', enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] },
				severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
			},
		},
	},
};

export const getIncidentReportSchema = {
	schema: {
		tags: ['Incident Reports'],
		params: { type: 'object', required: ['organizationId', 'incidentId'], properties: { organizationId: { type: 'string', format: 'uuid' }, incidentId: { type: 'string', format: 'uuid' } } },
	},
};

export const deleteIncidentReportOpts = {
	schema: {
		tags: ['Incident Reports'],
		params: { type: 'object', required: ['organizationId', 'incidentId'], properties: { organizationId: { type: 'string', format: 'uuid' }, incidentId: { type: 'string', format: 'uuid' } } },
	},
};
