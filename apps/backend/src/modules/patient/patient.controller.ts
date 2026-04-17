import type { FastifyReply, FastifyRequest } from 'fastify';
import { logAudit } from '../../lib/audit';
import {
  createPatientService,
  deletePatientService,
  getPatientService,
  getPatientProfileService,
  listPatientsService,
  updatePatientService,
  updatePatientProfileService,
} from './patient.service';
import type {
  CreatePatientBody,
  PatientListQuery,
  UpdatePatientBody,
  UpdatePatientProfileBody,
} from './patient.types';

export async function createPatientController(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as CreatePatientBody;
  const patient = await createPatientService(request.org.id, body);

  logAudit({
    action: 'CREATE',
    entityType: 'Patient',
    entityId: patient.id,
    newValues: body as Record<string, unknown>,
    organizationId: request.org.id,
    actorUserId: request.user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? undefined,
  });

  return reply.status(201).send(patient);
}

export async function listPatientsController(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as PatientListQuery;
  const result = await listPatientsService(request.org.id, query);
  return reply.send(result);
}

export async function getPatientController(request: FastifyRequest, reply: FastifyReply) {
  const { patientId } = request.params as { patientId: string };
  const patient = await getPatientService(request.org.id, patientId);
  return reply.send(patient);
}

export async function getPatientProfileController(request: FastifyRequest, reply: FastifyReply) {
  const { patientId } = request.params as { patientId: string };
  const patient = await getPatientProfileService(request.org.id, patientId);
  return reply.send(patient);
}

export async function updatePatientController(request: FastifyRequest, reply: FastifyReply) {
  const { patientId } = request.params as { patientId: string };
  const body = request.body as UpdatePatientBody;
  const patient = await updatePatientService(request.org.id, patientId, body);

  logAudit({
    action: 'UPDATE',
    entityType: 'Patient',
    entityId: patientId,
    newValues: body as Record<string, unknown>,
    organizationId: request.org.id,
    actorUserId: request.user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? undefined,
  });

  return reply.send(patient);
}

export async function updatePatientProfileController(request: FastifyRequest, reply: FastifyReply) {
  const { patientId } = request.params as { patientId: string };
  const body = request.body as UpdatePatientProfileBody;
  const patient = await updatePatientProfileService(request.org.id, patientId, body);

  logAudit({
    action: 'UPDATE',
    entityType: 'PatientProfile',
    entityId: patientId,
    newValues: body as Record<string, unknown>,
    organizationId: request.org.id,
    actorUserId: request.user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? undefined,
  });

  return reply.send(patient);
}

export async function deletePatientController(request: FastifyRequest, reply: FastifyReply) {
  const { patientId } = request.params as { patientId: string };
  const result = await deletePatientService(request.org.id, patientId);

  logAudit({
    action: 'DELETE',
    entityType: 'Patient',
    entityId: patientId,
    organizationId: request.org.id,
    actorUserId: request.user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? undefined,
  });

  return reply.send(result);
}
