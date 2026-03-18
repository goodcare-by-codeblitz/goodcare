import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { orgScope } from '../../middleware/org-scope';
import { listAuditLogsController } from './audit.controller';
import { listAuditLogsSchema } from './audit.schemas';

export async function auditRoutes(app: FastifyInstance) {
	app.addHook('preHandler', authenticate(app));
	app.addHook('preHandler', orgScope);

	app.get(
		'/:organizationId/audit-logs',
		{
			...listAuditLogsSchema,
			preHandler: [authorize('view_audit_logs')],
		},
		listAuditLogsController,
	);
}
