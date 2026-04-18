import type { FastifyReply, FastifyRequest } from 'fastify';
import { logAudit } from '../../lib/audit';
import {
	assignCarerService, createVisitService, deleteVisitService,
	getVisitAssignmentPreviewService, getVisitService, listVisitsService,
	unassignCarerService, updateVisitService,
} from './visit.service';
import type {
	AssignCarerBody,
	CreateVisitBody,
	UpdateVisitBody,
	VisitAssignmentPreviewQuery,
	VisitListQuery,
} from './visit.types';

export async function createVisitController(request: FastifyRequest, reply: FastifyReply) {
	const body = request.body as CreateVisitBody;
	const visit = await createVisitService(request.org.id, body);

	logAudit({
		action: 'CREATE',
		entityType: 'Visit',
		entityId: visit.id,
		newValues: body as Record<string, unknown>,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.status(201).send(visit);
}

export async function listVisitsController(request: FastifyRequest, reply: FastifyReply) {
	const query = request.query as VisitListQuery;
	const result = await listVisitsService(request.org.id, query);
	return reply.send(result);
}

export async function getVisitController(request: FastifyRequest, reply: FastifyReply) {
	const { visitId } = request.params as { visitId: string };
	const visit = await getVisitService(request.org.id, visitId);
	return reply.send(visit);
}

export async function updateVisitController(request: FastifyRequest, reply: FastifyReply) {
	const { visitId } = request.params as { visitId: string };
	const body = request.body as UpdateVisitBody;
	const visit = await updateVisitService(request.org.id, visitId, body);

	logAudit({
		action: 'UPDATE',
		entityType: 'Visit',
		entityId: visitId,
		newValues: body as Record<string, unknown>,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.send(visit);
}

export async function deleteVisitController(request: FastifyRequest, reply: FastifyReply) {
	const { visitId } = request.params as { visitId: string };
	const result = await deleteVisitService(request.org.id, visitId);

	logAudit({
		action: 'DELETE',
		entityType: 'Visit',
		entityId: visitId,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.send(result);
}

export async function assignCarerController(request: FastifyRequest, reply: FastifyReply) {
	const { visitId } = request.params as { visitId: string };
	const { carerId } = request.body as AssignCarerBody;
	const assignment = await assignCarerService(request.org.id, visitId, carerId, request.user.id);

	logAudit({
		action: 'CREATE',
		entityType: 'VisitAssignment',
		entityId: assignment.id,
		newValues: { visitId, carerId },
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.status(201).send(assignment);
}

export async function previewAssignmentController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { visitId } = request.params as { visitId: string };
	const { carerId } = request.query as VisitAssignmentPreviewQuery;
	const preview = await getVisitAssignmentPreviewService(
		request.org.id,
		visitId,
		carerId,
	);

	return reply.send(preview);
}

export async function unassignCarerController(request: FastifyRequest, reply: FastifyReply) {
	const { visitId, carerId } = request.params as { visitId: string; carerId: string };
	const result = await unassignCarerService(request.org.id, visitId, carerId);

	logAudit({
		action: 'DELETE',
		entityType: 'VisitAssignment',
		entityId: `${visitId}:${carerId}`,
		newValues: { visitId, carerId },
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.send(result);
}
