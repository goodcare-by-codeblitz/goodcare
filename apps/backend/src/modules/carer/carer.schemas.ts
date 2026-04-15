export const createCarerSchema = {
	schema: {
		tags: ['Carers'],
		body: {
			type: 'object',
			required: ['organizationUserId', 'hireDate', 'employmentType', 'availability'],
			properties: {
				organizationUserId: { type: 'string', format: 'uuid' },
				hireDate: { type: 'string', format: 'date' },
				employmentType: { type: 'string', minLength: 1 },
				experienceYears: { type: 'integer', minimum: 0 },
				availability: { type: 'string', minLength: 1 },
			},
		},
	},
};

export const updateCarerSchema = {
	schema: {
		tags: ['Carers'],
		params: { type: 'object', required: ['organizationId', 'carerId'], properties: { organizationId: { type: 'string', format: 'uuid' }, carerId: { type: 'string', format: 'uuid' } } },
		body: {
			type: 'object',
			properties: {
				hireDate: { type: 'string', format: 'date' },
				employmentType: { type: 'string', minLength: 1 },
				experienceYears: { type: 'integer', minimum: 0 },
				availability: { type: 'string', minLength: 1 },
				status: { type: 'string', enum: ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'] },
			},
		},
	},
};

export const listCarersSchema = {
	schema: {
		tags: ['Carers'],
		querystring: {
			type: 'object',
			properties: {
				page: { type: 'string' },
				limit: { type: 'string' },
				search: { type: 'string' },
				status: { type: 'string', enum: ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'] },
			},
		},
	},
};

export const getCarerSchema = {
	schema: {
		tags: ['Carers'],
		params: { type: 'object', required: ['organizationId', 'carerId'], properties: { organizationId: { type: 'string', format: 'uuid' }, carerId: { type: 'string', format: 'uuid' } } },
	},
};

export const deleteCarerOpts = {
	schema: {
		tags: ['Carers'],
		params: { type: 'object', required: ['organizationId', 'carerId'], properties: { organizationId: { type: 'string', format: 'uuid' }, carerId: { type: 'string', format: 'uuid' } } },
	},
};
