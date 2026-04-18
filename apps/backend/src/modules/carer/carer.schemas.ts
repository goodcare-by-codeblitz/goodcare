const timePattern = '^([01]\\d|2[0-3]):[0-5]\\d$';

const availabilitySlotSchema = {
	type: 'object',
	required: ['startTime', 'endTime'],
	properties: {
		startTime: { type: 'string', pattern: timePattern },
		endTime: { type: 'string', pattern: timePattern },
		crossesMidnight: { type: 'boolean' },
	},
};

const weeklyAvailabilitySchema = {
	type: 'object',
	properties: {
		monday: { type: 'array', items: availabilitySlotSchema },
		tuesday: { type: 'array', items: availabilitySlotSchema },
		wednesday: { type: 'array', items: availabilitySlotSchema },
		thursday: { type: 'array', items: availabilitySlotSchema },
		friday: { type: 'array', items: availabilitySlotSchema },
		saturday: { type: 'array', items: availabilitySlotSchema },
		sunday: { type: 'array', items: availabilitySlotSchema },
	},
};

export const createCarerSchema = {
	schema: {
		tags: ['Carers'],
		body: {
			type: 'object',
			required: ['organizationUserId', 'hireDate', 'employmentType'],
			properties: {
				organizationUserId: { type: 'string', format: 'uuid' },
				hireDate: { type: 'string', format: 'date' },
				employmentType: { type: 'string', minLength: 1 },
				experienceYears: { type: 'integer', minimum: 0 },
				availability: weeklyAvailabilitySchema,
			},
		},
	},
};

export const updateCarerSchema = {
	schema: {
		tags: ['Carers'],
		params: {
			type: 'object',
			required: ['organizationId', 'carerId'],
			properties: {
				organizationId: { type: 'string', format: 'uuid' },
				carerId: { type: 'string', format: 'uuid' },
			},
		},
		body: {
			type: 'object',
			properties: {
				hireDate: { type: 'string', format: 'date' },
				employmentType: { type: 'string', minLength: 1 },
				experienceYears: { type: 'integer', minimum: 0 },
				availability: weeklyAvailabilitySchema,
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
		params: {
			type: 'object',
			required: ['organizationId', 'carerId'],
			properties: {
				organizationId: { type: 'string', format: 'uuid' },
				carerId: { type: 'string', format: 'uuid' },
			},
		},
	},
};

export const deleteCarerOpts = {
	schema: {
		tags: ['Carers'],
		params: {
			type: 'object',
			required: ['organizationId', 'carerId'],
			properties: {
				organizationId: { type: 'string', format: 'uuid' },
				carerId: { type: 'string', format: 'uuid' },
			},
		},
	},
};
