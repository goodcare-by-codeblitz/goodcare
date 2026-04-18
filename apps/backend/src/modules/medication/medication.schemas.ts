const orgParams = {
	type: 'object',
	required: ['organizationId'],
	properties: {
		organizationId: { type: 'string', format: 'uuid' },
	},
} as const;

const orgPatientParams = {
	type: 'object',
	required: ['organizationId', 'patientId'],
	properties: {
		organizationId: { type: 'string', format: 'uuid' },
		patientId: { type: 'string', format: 'uuid' },
	},
} as const;

const orgMedicationParams = {
	type: 'object',
	required: ['organizationId', 'patientId', 'medicationId'],
	properties: {
		organizationId: { type: 'string', format: 'uuid' },
		patientId: { type: 'string', format: 'uuid' },
		medicationId: { type: 'string', format: 'uuid' },
	},
} as const;

const medicationScheduleSchema = {
	type: 'object',
	properties: {
		morning: { type: 'boolean' },
		noon: { type: 'boolean' },
		evening: { type: 'boolean' },
		night: { type: 'boolean' },
		bedtime: { type: 'boolean' },
	},
	additionalProperties: false,
};

const medicationSlotSchema = {
	type: 'string',
	enum: ['morning', 'noon', 'evening', 'night', 'bedtime'],
};

const medicationBodySchema = {
	type: 'object',
	required: [
		'name',
		'doseAmount',
		'doseUnit',
		'route',
		'frequency',
		'startDate',
		'prescriber',
		'instructions',
	],
	properties: {
		name: { type: 'string', minLength: 1 },
		doseAmount: { type: 'string', minLength: 1 },
		doseUnit: { type: 'string', minLength: 1 },
		route: { type: 'string', minLength: 1 },
		frequency: { type: 'string', minLength: 1 },
		schedule: medicationScheduleSchema,
		startDate: { type: 'string', format: 'date' },
		endDate: { type: 'string', format: 'date' },
		prescriber: { type: 'string', minLength: 1 },
		instructions: { type: 'string' },
		status: { type: 'string', enum: ['ACTIVE', 'PRN', 'DISCONTINUED'] },
		prnIndication: { type: 'string' },
		prnMaxDose: { type: 'string' },
	},
	additionalProperties: false,
};

export const listMedicationsSchema = {
	schema: {
		tags: ['Medications'],
		params: orgParams,
		querystring: {
			type: 'object',
			properties: {
				page: { type: 'string' },
				limit: { type: 'string' },
				patientId: { type: 'string', format: 'uuid' },
				search: { type: 'string' },
				status: { type: 'string', enum: ['ACTIVE', 'PRN', 'DISCONTINUED'] },
			},
			additionalProperties: false,
		},
	},
};

export const createMedicationSchema = {
	schema: {
		tags: ['Medications'],
		params: orgPatientParams,
		body: medicationBodySchema,
	},
};

export const getMedicationSchema = {
	schema: {
		tags: ['Medications'],
		params: orgMedicationParams,
	},
};

export const updateMedicationSchema = {
	schema: {
		tags: ['Medications'],
		params: orgMedicationParams,
		body: {
			type: 'object',
			properties: medicationBodySchema.properties,
			additionalProperties: false,
		},
	},
};

export const deleteMedicationOpts = {
	schema: {
		tags: ['Medications'],
		params: orgMedicationParams,
	},
};

export const listAdministrationsSchema = {
	schema: {
		tags: ['Medications'],
		params: orgMedicationParams,
	},
};

export const getMarSchema = {
	schema: {
		tags: ['Medications'],
		params: orgPatientParams,
		querystring: {
			type: 'object',
			properties: {
				view: { type: 'string', enum: ['daily', 'monthly'] },
				date: { type: 'string', format: 'date' },
			},
			additionalProperties: false,
		},
	},
};

export const createAdministrationSchema = {
	schema: {
		tags: ['Medications'],
		params: orgMedicationParams,
		body: {
			type: 'object',
			required: ['result'],
			properties: {
				result: { type: 'string', enum: ['GIVEN', 'MISSED', 'REFUSED', 'NA'] },
				slot: medicationSlotSchema,
				scheduledFor: { type: 'string', format: 'date-time' },
				administeredAt: { type: 'string', format: 'date-time' },
				notes: { type: 'string' },
			},
			additionalProperties: false,
		},
	},
};
