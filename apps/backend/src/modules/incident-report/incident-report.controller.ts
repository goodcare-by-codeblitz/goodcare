import type { FastifyReply, FastifyRequest } from 'fastify';
import { logAudit } from '../../lib/audit';
import {
	createIncidentReportService, deleteIncidentReportService, getIncidentReportService,
	listIncidentReportsService, updateIncidentReportService,
} from './incident-report.service';
import type { CreateIncidentReportBody, IncidentReportListQuery, UpdateIncidentReportBody } from './incident-report.types';

export async function createIncidentReportController(request: FastifyRequest, reply: FastifyReply) {
	const body = request.body as CreateIncidentReportBody;
	const incident = await createIncidentReportService(request.org.id, request.user.id, body);

	logAudit({
		action: 'CREATE',
		entityType: 'IncidentReport',
		entityId: incident.id,
		newValues: body as Record<string, unknown>,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.status(201).send(incident);
}

export async function listIncidentReportsController(request: FastifyRequest, reply: FastifyReply) {
	const query = request.query as IncidentReportListQuery;
	const result = await listIncidentReportsService(request.org.id, query);
	return reply.send(result);
}

export async function getIncidentReportController(request: FastifyRequest, reply: FastifyReply) {
	const { incidentId } = request.params as { incidentId: string };
	const incident = await getIncidentReportService(request.org.id, incidentId);
	return reply.send(incident);
}

export async function updateIncidentReportController(request: FastifyRequest, reply: FastifyReply) {
	const { incidentId } = request.params as { incidentId: string };
	const body = request.body as UpdateIncidentReportBody;
	const incident = await updateIncidentReportService(request.org.id, incidentId, body);

	logAudit({
		action: 'UPDATE',
		entityType: 'IncidentReport',
		entityId: incidentId,
		newValues: body as Record<string, unknown>,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.send(incident);
}

export async function deleteIncidentReportController(request: FastifyRequest, reply: FastifyReply) {
	const { incidentId } = request.params as { incidentId: string };
	const result = await deleteIncidentReportService(request.org.id, incidentId);
	return reply.send(result);
}
