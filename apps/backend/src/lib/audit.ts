import { prisma } from '@repo/db';

export type LogAuditInput = {
	action: string;
	entityType: string;
	entityId: string;
	oldValues?: Record<string, unknown>;
	newValues?: Record<string, unknown>;
	organizationId?: string | undefined;
	actorUserId: string;
	actorOrganizationUserId?: string;
	ipAddress?: string | undefined;
	userAgent?: string | undefined;
};

/**
 * Fire-and-forget audit logging. Errors are silently caught to avoid
 * disrupting the request flow.
 */
export function logAudit(input: LogAuditInput): void {
	const data: Record<string, unknown> = {
		action: input.action,
		entityType: input.entityType,
		entityId: input.entityId,
		organizationId: input.organizationId ?? null,
		actorUserId: input.actorUserId,
		actorOrganizationUserId: input.actorOrganizationUserId ?? null,
		ipAddress: input.ipAddress ?? null,
		userAgent: input.userAgent ?? null,
	};
	if (input.oldValues) data.oldValues = input.oldValues;
	if (input.newValues) data.newValues = input.newValues;

	prisma.auditLog
		.create({
			data: data as Parameters<typeof prisma.auditLog.create>[0]['data'],
		})
		.catch((err) => {
			// Silently ignore audit log failures
			console.error('Failed to log audit event', { input, err });
		});
}
