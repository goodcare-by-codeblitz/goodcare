import type { FastifyReply, FastifyRequest } from 'fastify';
import { listAuditLogsService } from './audit.service';
import type { AuditLogListQuery } from './audit.types';

type OrgRequest = FastifyRequest & { org: { id: string } };

export async function listAuditLogsController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { org } = request as OrgRequest;
	const query = request.query as AuditLogListQuery;
	const result = await listAuditLogsService(org.id, query);
	return reply.send(result);
}
