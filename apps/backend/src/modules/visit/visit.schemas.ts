export const createVisitSchema = {
	schema: {
		tags: ['Visits'],
		body: {
			type: 'object',
			required: ['patientId', 'scheduledStart', 'scheduledEnd'],
			properties: {
				patientId: { type: 'string', format: 'uuid' },
				scheduledStart: { type: 'string', format: 'date-time' },
				scheduledEnd: { type: 'string', format: 'date-time' },
				status: { type: 'string', enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
			},
		},
	},
};

export const updateVisitSchema = {
	schema: {
		tags: ['Visits'],
		params: { type: 'object', required: ['organizationId', 'visitId'], properties: { organizationId: { type: 'string', format: 'uuid' }, visitId: { type: 'string', format: 'uuid' } } },
		body: {
			type: 'object',
			properties: {
				scheduledStart: { type: 'string', format: 'date-time' },
				scheduledEnd: { type: 'string', format: 'date-time' },
				actualStart: { type: 'string', format: 'date-time' },
				actualEnd: { type: 'string', format: 'date-time' },
				status: { type: 'string', enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
			},
		},
	},
};

export const listVisitsSchema = {
	schema: {
		tags: ['Visits'],
		querystring: {
			type: 'object',
			properties: {
				page: { type: 'string' },
				limit: { type: 'string' },
				patientId: { type: 'string', format: 'uuid' },
				status: { type: 'string', enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
				from: { type: 'string', format: 'date-time' },
				to: { type: 'string', format: 'date-time' },
			},
		},
	},
};

export const getVisitSchema = {
	schema: {
		tags: ['Visits'],
		params: { type: 'object', required: ['organizationId', 'visitId'], properties: { organizationId: { type: 'string', format: 'uuid' }, visitId: { type: 'string', format: 'uuid' } } },
	},
};

export const deleteVisitOpts = {
	schema: {
		tags: ['Visits'],
		params: { type: 'object', required: ['organizationId', 'visitId'], properties: { organizationId: { type: 'string', format: 'uuid' }, visitId: { type: 'string', format: 'uuid' } } },
	},
};

export const assignCarerSchema = {
	schema: {
		tags: ['Visits'],
		params: { type: 'object', required: ['organizationId', 'visitId'], properties: { organizationId: { type: 'string', format: 'uuid' }, visitId: { type: 'string', format: 'uuid' } } },
		body: { type: 'object', required: ['carerId'], properties: { carerId: { type: 'string', format: 'uuid' } } },
	},
};

export const previewAssignmentSchema = {
	schema: {
		tags: ['Visits'],
		params: {
			type: 'object',
			required: ['organizationId', 'visitId'],
			properties: {
				organizationId: { type: 'string', format: 'uuid' },
				visitId: { type: 'string', format: 'uuid' },
			},
		},
		querystring: {
			type: 'object',
			required: ['carerId'],
			properties: {
				carerId: { type: 'string', format: 'uuid' },
			},
			additionalProperties: false,
		},
	},
};

export const unassignCarerSchema = {
	schema: {
		tags: ['Visits'],
		params: {
			type: 'object',
			required: ['organizationId', 'visitId', 'carerId'],
			properties: { organizationId: { type: 'string', format: 'uuid' }, visitId: { type: 'string', format: 'uuid' }, carerId: { type: 'string', format: 'uuid' } },
		},
	},
};
