import type { FastifyReply, FastifyRequest } from 'fastify';
import { logAudit } from '../../lib/audit';
import {
	createCarePlanService, deleteCarePlanService, getCarePlanService,
	listCarePlansService, updateCarePlanService,
} from './care-plan.service';
import type { CarePlanListQuery, CreateCarePlanBody, UpdateCarePlanBody } from './care-plan.types';

export async function createCarePlanController(request: FastifyRequest, reply: FastifyReply) {
	const body = request.body as CreateCarePlanBody;
	const carePlan = await createCarePlanService(request.org.id, request.user.id, body);

	logAudit({
		action: 'CREATE',
		entityType: 'CarePlan',
		entityId: carePlan.id,
		newValues: body as Record<string, unknown>,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.status(201).send(carePlan);
}

export async function listCarePlansController(request: FastifyRequest, reply: FastifyReply) {
	const query = request.query as CarePlanListQuery;
	const result = await listCarePlansService(request.org.id, query);
	return reply.send(result);
}

export async function getCarePlanController(request: FastifyRequest, reply: FastifyReply) {
	const { carePlanId } = request.params as { carePlanId: string };
	const carePlan = await getCarePlanService(request.org.id, carePlanId);
	return reply.send(carePlan);
}

export async function updateCarePlanController(request: FastifyRequest, reply: FastifyReply) {
	const { carePlanId } = request.params as { carePlanId: string };
	const body = request.body as UpdateCarePlanBody;
	const carePlan = await updateCarePlanService(request.org.id, carePlanId, body);

	logAudit({
		action: 'UPDATE',
		entityType: 'CarePlan',
		entityId: carePlanId,
		newValues: body as Record<string, unknown>,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.send(carePlan);
}

export async function deleteCarePlanController(request: FastifyRequest, reply: FastifyReply) {
	const { carePlanId } = request.params as { carePlanId: string };
	const result = await deleteCarePlanService(request.org.id, carePlanId);
	return reply.send(result);
}
