import type { FastifyReply, FastifyRequest } from 'fastify';
import { logAudit } from '../../lib/audit';
import {
	createCarerService, deleteCarerService, getCarerService, listCarersService, updateCarerService,
} from './carer.service';
import type { CarerListQuery, CreateCarerBody, UpdateCarerBody } from './carer.types';

export async function createCarerController(request: FastifyRequest, reply: FastifyReply) {
	const body = request.body as CreateCarerBody;
	const carer = await createCarerService(request.org.id, body);

	logAudit({
		action: 'CREATE',
		entityType: 'Carer',
		entityId: carer.id,
		newValues: body as Record<string, unknown>,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.status(201).send(carer);
}

export async function listCarersController(request: FastifyRequest, reply: FastifyReply) {
	const query = request.query as CarerListQuery;
	const result = await listCarersService(request.org.id, query);
	return reply.send(result);
}

export async function getCarerController(request: FastifyRequest, reply: FastifyReply) {
	const { carerId } = request.params as { carerId: string };
	const carer = await getCarerService(request.org.id, carerId);
	return reply.send(carer);
}

export async function updateCarerController(request: FastifyRequest, reply: FastifyReply) {
	const { carerId } = request.params as { carerId: string };
	const body = request.body as UpdateCarerBody;
	const carer = await updateCarerService(request.org.id, carerId, body);

	logAudit({
		action: 'UPDATE',
		entityType: 'Carer',
		entityId: carerId,
		newValues: body as Record<string, unknown>,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.send(carer);
}

export async function deleteCarerController(request: FastifyRequest, reply: FastifyReply) {
	const { carerId } = request.params as { carerId: string };
	const result = await deleteCarerService(request.org.id, carerId);

	logAudit({
		action: 'UPDATE',
		entityType: 'Carer',
		entityId: carerId,
		newValues: { status: 'TERMINATED' },
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.send(result);
}
