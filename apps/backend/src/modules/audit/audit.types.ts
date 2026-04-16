export type AuditLogListQuery = {
	page?: string | undefined;
	limit?: string | undefined;
	entityType?: string | undefined;
	entityId?: string | undefined;
	action?: string | undefined;
	actorUserId?: string | undefined;
};
