import { prisma } from '@repo/db';
import type { AuditLogListQuery } from './audit.types';

type AuditLogRecord = {
	id: string;
	action: string;
	entityType: string;
	entityId: string;
	oldValues: unknown;
	newValues: unknown;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: Date;
	actorUser: { firstName: string; lastName: string; email: string };
};

export async function listAuditLogsService(
	organizationId: string,
	query: AuditLogListQuery,
): Promise<{ logs: AuditLogRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
	const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
	const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '50', 10) || 50));
	const skip = (page - 1) * limit;

	const where: Record<string, unknown> = { organizationId };
	if (query.entityType) where.entityType = query.entityType;
	if (query.entityId) where.entityId = query.entityId;
	if (query.action) where.action = query.action;
	if (query.actorUserId) where.actorUserId = query.actorUserId;

	const [logs, total] = await Promise.all([
		prisma.auditLog.findMany({
			where,
			select: {
				id: true, action: true, entityType: true, entityId: true,
				oldValues: true, newValues: true, ipAddress: true, userAgent: true, createdAt: true,
				actorUser: { select: { firstName: true, lastName: true, email: true } },
			},
			orderBy: { createdAt: 'desc' },
			skip,
			take: limit,
		}),
		prisma.auditLog.count({ where }),
	]);

	return { logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
