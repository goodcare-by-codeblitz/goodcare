export const createCarePlanSchema = {
	schema: {
		tags: ['Care Plans'],
		body: {
			type: 'object',
			required: ['patientId', 'goals'],
			properties: {
				patientId: { type: 'string', format: 'uuid' },
				goals: { type: 'string', minLength: 1 },
				status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED'] },
			},
		},
	},
};

export const updateCarePlanSchema = {
	schema: {
		tags: ['Care Plans'],
		params: { type: 'object', required: ['organizationId', 'carePlanId'], properties: { organizationId: { type: 'string', format: 'uuid' }, carePlanId: { type: 'string', format: 'uuid' } } },
		body: {
			type: 'object',
			properties: {
				goals: { type: 'string', minLength: 1 },
				status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED'] },
			},
		},
	},
};

export const listCarePlansSchema = {
	schema: {
		tags: ['Care Plans'],
		querystring: {
			type: 'object',
			properties: {
				page: { type: 'string' },
				limit: { type: 'string' },
				patientId: { type: 'string', format: 'uuid' },
				status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED'] },
			},
		},
	},
};

export const getCarePlanSchema = {
	schema: {
		tags: ['Care Plans'],
		params: { type: 'object', required: ['organizationId', 'carePlanId'], properties: { organizationId: { type: 'string', format: 'uuid' }, carePlanId: { type: 'string', format: 'uuid' } } },
	},
};

export const deleteCarePlanOpts = {
	schema: {
		tags: ['Care Plans'],
		params: { type: 'object', required: ['organizationId', 'carePlanId'], properties: { organizationId: { type: 'string', format: 'uuid' }, carePlanId: { type: 'string', format: 'uuid' } } },
	},
};
