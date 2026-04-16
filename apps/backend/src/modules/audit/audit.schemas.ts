export const listAuditLogsSchema = {
	schema: {
		tags: ['Audit'],
		querystring: {
			type: 'object',
			properties: {
				page: { type: 'string' },
				limit: { type: 'string' },
				entityType: { type: 'string' },
				entityId: { type: 'string' },
				action: { type: 'string' },
				actorUserId: { type: 'string', format: 'uuid' },
			},
		},
	},
};
