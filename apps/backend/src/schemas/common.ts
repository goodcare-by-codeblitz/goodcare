export const errorResponse = {
	type: 'object',
	properties: {
		error: { type: 'string' },
	},
} as const;

export const messageResponse = {
	type: 'object',
	properties: {
		message: { type: 'string' },
	},
} as const;

export const paginatedMeta = {
	type: 'object',
	properties: {
		page: { type: 'integer' },
		limit: { type: 'integer' },
		total: { type: 'integer' },
		totalPages: { type: 'integer' },
	},
} as const;
