import type { FastifyReply, FastifyRequest } from 'fastify';
import { logAudit } from '../../lib/audit';
import {
	createMedicationAdministrationService,
	createMedicationService,
	deleteMedicationService,
	getMedicationService,
	getPatientMedicationMarService,
	listMedicationAdministrationsService,
	listMedicationsService,
	updateMedicationService,
} from './medication.service';
import type {
	CreateMedicationAdministrationBody,
	CreateMedicationBody,
	MedicationMarQuery,
	MedicationListQuery,
	UpdateMedicationBody,
} from './medication.types';

export async function listMedicationsController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const query = request.query as MedicationListQuery;
	const result = await listMedicationsService(request.org.id, query);
	return reply.send(result);
}

export async function createMedicationController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { patientId } = request.params as { patientId: string };
	const body = request.body as CreateMedicationBody;
	const medication = await createMedicationService(request.org.id, patientId, body);

	logAudit({
		action: 'CREATE',
		entityType: 'Medication',
		entityId: medication.id,
		newValues: body as Record<string, unknown>,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.status(201).send(medication);
}

export async function getPatientMarController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { patientId } = request.params as { patientId: string };
	const query = request.query as MedicationMarQuery;
	const mar = await getPatientMedicationMarService(
		request.org.id,
		patientId,
		query,
	);

	return reply.send(mar);
}

export async function getMedicationController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { patientId, medicationId } = request.params as {
		patientId: string;
		medicationId: string;
	};
	const medication = await getMedicationService(
		request.org.id,
		patientId,
		medicationId,
	);
	return reply.send(medication);
}

export async function updateMedicationController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { patientId, medicationId } = request.params as {
		patientId: string;
		medicationId: string;
	};
	const body = request.body as UpdateMedicationBody;
	const medication = await updateMedicationService(
		request.org.id,
		patientId,
		medicationId,
		body,
	);

	logAudit({
		action: 'UPDATE',
		entityType: 'Medication',
		entityId: medicationId,
		newValues: body as Record<string, unknown>,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.send(medication);
}

export async function deleteMedicationController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { patientId, medicationId } = request.params as {
		patientId: string;
		medicationId: string;
	};
	const result = await deleteMedicationService(
		request.org.id,
		patientId,
		medicationId,
	);

	logAudit({
		action: 'DELETE',
		entityType: 'Medication',
		entityId: medicationId,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.send(result);
}

export async function listMedicationAdministrationsController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { patientId, medicationId } = request.params as {
		patientId: string;
		medicationId: string;
	};
	const result = await listMedicationAdministrationsService(
		request.org.id,
		patientId,
		medicationId,
	);
	return reply.send(result);
}

export async function createMedicationAdministrationController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { patientId, medicationId } = request.params as {
		patientId: string;
		medicationId: string;
	};
	const body = request.body as CreateMedicationAdministrationBody;
	const administration = await createMedicationAdministrationService(
		request.org.id,
		patientId,
		medicationId,
		request.user.id,
		body,
	);

	logAudit({
		action: 'CREATE',
		entityType: 'MedicationAdministration',
		entityId: administration.id,
		newValues: body as Record<string, unknown>,
		organizationId: request.org.id,
		actorUserId: request.user.id,
		ipAddress: request.ip,
		userAgent: request.headers['user-agent'] ?? undefined,
	});

	return reply.status(201).send(administration);
}
