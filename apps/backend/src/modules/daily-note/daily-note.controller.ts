import type { FastifyReply, FastifyRequest } from 'fastify';
import { logAudit } from '../../lib/audit';
import {
	createDailyNoteService, deleteDailyNoteService, getDailyNoteService,
	listDailyNotesService, updateDailyNoteService,
} from './daily-note.service';
import type { CreateDailyNoteBody, DailyNoteListQuery, UpdateDailyNoteBody } from './daily-note.types';

export async function createDailyNoteController(request: FastifyRequest, reply: FastifyReply) {
	const body = request.body as CreateDailyNoteBody;
	const note = await createDailyNoteService(request.org.id, body);

	logAudit({
		action: 'CREATE',
		entityType: 'DailyNote',
		entityId: note.id,
		newValues: body as Record<string, unknown>,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.status(201).send(note);
}

export async function listDailyNotesController(request: FastifyRequest, reply: FastifyReply) {
	const query = request.query as DailyNoteListQuery;
	const result = await listDailyNotesService(request.org.id, query);
	return reply.send(result);
}

export async function getDailyNoteController(request: FastifyRequest, reply: FastifyReply) {
	const { dailyNoteId } = request.params as { dailyNoteId: string };
	const note = await getDailyNoteService(request.org.id, dailyNoteId);
	return reply.send(note);
}

export async function updateDailyNoteController(request: FastifyRequest, reply: FastifyReply) {
	const { dailyNoteId } = request.params as { dailyNoteId: string };
	const body = request.body as UpdateDailyNoteBody;
	const note = await updateDailyNoteService(request.org.id, dailyNoteId, body);

	logAudit({
		action: 'UPDATE',
		entityType: 'DailyNote',
		entityId: dailyNoteId,
		newValues: body as Record<string, unknown>,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.send(note);
}

export async function deleteDailyNoteController(request: FastifyRequest, reply: FastifyReply) {
	const { dailyNoteId } = request.params as { dailyNoteId: string };
	const result = await deleteDailyNoteService(request.org.id, dailyNoteId);

	logAudit({
		action: 'DELETE',
		entityType: 'DailyNote',
		entityId: dailyNoteId,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.send(result);
}
