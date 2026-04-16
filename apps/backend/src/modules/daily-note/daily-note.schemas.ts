export const createDailyNoteSchema = {
	schema: {
		tags: ['Daily Notes'],
		body: {
			type: 'object',
			required: ['visitId', 'carerId', 'notes'],
			properties: {
				visitId: { type: 'string', format: 'uuid' },
				carerId: { type: 'string', format: 'uuid' },
				notes: { type: 'string', minLength: 1 },
			},
		},
	},
};

export const updateDailyNoteSchema = {
	schema: {
		tags: ['Daily Notes'],
		params: { type: 'object', required: ['organizationId', 'dailyNoteId'], properties: { organizationId: { type: 'string', format: 'uuid' }, dailyNoteId: { type: 'string', format: 'uuid' } } },
		body: { type: 'object', properties: { notes: { type: 'string', minLength: 1 } } },
	},
};

export const listDailyNotesSchema = {
	schema: {
		tags: ['Daily Notes'],
		querystring: {
			type: 'object',
			properties: {
				page: { type: 'string' },
				limit: { type: 'string' },
				visitId: { type: 'string', format: 'uuid' },
				carerId: { type: 'string', format: 'uuid' },
			},
		},
	},
};

export const getDailyNoteSchema = {
	schema: {
		tags: ['Daily Notes'],
		params: { type: 'object', required: ['organizationId', 'dailyNoteId'], properties: { organizationId: { type: 'string', format: 'uuid' }, dailyNoteId: { type: 'string', format: 'uuid' } } },
	},
};

export const deleteDailyNoteOpts = {
	schema: {
		tags: ['Daily Notes'],
		params: { type: 'object', required: ['organizationId', 'dailyNoteId'], properties: { organizationId: { type: 'string', format: 'uuid' }, dailyNoteId: { type: 'string', format: 'uuid' } } },
	},
};
