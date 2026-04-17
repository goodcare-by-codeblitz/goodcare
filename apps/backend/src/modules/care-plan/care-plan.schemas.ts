export const createCarePlanSchema = {
	schema: {
		tags: ['Care Plans'],
		body: {
			type: 'object',
			required: ['patientId', 'summary'],
			properties: {
				patientId: { type: 'string', format: 'uuid' },
				summary: { type: 'string', minLength: 1 },
				status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED'] },
				conditions: {
					type: 'array',
					items: {
						type: 'object',
						required: ['name'],
						properties: {
							name: { type: 'string', minLength: 1 },
							diagnosedYear: { type: 'integer' },
							description: { type: 'string' },
							patientImpact: { type: 'string' },
							carerNotes: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
				risks: {
					type: 'array',
					items: {
						type: 'object',
						required: ['label', 'notes'],
						properties: {
							label: { type: 'string', minLength: 1 },
							level: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
							notes: { type: 'string', minLength: 1 },
							reviewDate: { type: 'string', format: 'date' },
						},
						additionalProperties: false,
					},
				},
				tasks: {
					type: 'array',
					items: {
						type: 'object',
						required: ['label', 'visitType'],
						properties: {
							label: { type: 'string', minLength: 1 },
							visitType: { type: 'string', minLength: 1 },
							required: { type: 'boolean' },
							notes: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
				goals: {
					type: 'array',
					items: {
						type: 'object',
						required: ['description', 'category'],
						properties: {
							description: { type: 'string', minLength: 1 },
							category: { type: 'string', minLength: 1 },
							targetDate: { type: 'string', format: 'date' },
							status: { type: 'string', enum: ['ACTIVE', 'ACHIEVED', 'PAUSED'] },
							notes: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
			},
			additionalProperties: false,
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
				summary: { type: 'string', minLength: 1 },
				status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED'] },
				conditions: {
					type: 'array',
					items: {
						type: 'object',
						required: ['name'],
						properties: {
							name: { type: 'string', minLength: 1 },
							diagnosedYear: { type: 'integer' },
							description: { type: 'string' },
							patientImpact: { type: 'string' },
							carerNotes: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
				risks: {
					type: 'array',
					items: {
						type: 'object',
						required: ['label', 'notes'],
						properties: {
							label: { type: 'string', minLength: 1 },
							level: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
							notes: { type: 'string', minLength: 1 },
							reviewDate: { type: 'string', format: 'date' },
						},
						additionalProperties: false,
					},
				},
				tasks: {
					type: 'array',
					items: {
						type: 'object',
						required: ['label', 'visitType'],
						properties: {
							label: { type: 'string', minLength: 1 },
							visitType: { type: 'string', minLength: 1 },
							required: { type: 'boolean' },
							notes: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
				goals: {
					type: 'array',
					items: {
						type: 'object',
						required: ['description', 'category'],
						properties: {
							description: { type: 'string', minLength: 1 },
							category: { type: 'string', minLength: 1 },
							targetDate: { type: 'string', format: 'date' },
							status: { type: 'string', enum: ['ACTIVE', 'ACHIEVED', 'PAUSED'] },
							notes: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
			},
			additionalProperties: false,
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
