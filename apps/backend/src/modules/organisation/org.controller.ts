import type { FastifyReply, FastifyRequest } from 'fastify';
import { logAudit } from '../../lib/audit';
import {
  getOrgService,
  listMembersService,
  removeMemberService,
  updateMemberService,
  updateOrgService,
} from './org.service';
import type { UpdateMemberBody, UpdateOrgBody } from './org.types';

export async function getOrgController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.params as { organizationId: string };
  const org = await getOrgService(organizationId);
  return reply.send(org);
}

export async function updateOrgController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.params as { organizationId: string };
  const body = request.body as UpdateOrgBody;
  const org = await updateOrgService(organizationId, body);

  logAudit({
    action: 'UPDATE',
    entityType: 'Organization',
    entityId: organizationId,
    newValues: body as Record<string, unknown>,
    organizationId,
    actorUserId: request.user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? undefined,
  });

  return reply.send(org);
}

export async function listMembersController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.params as { organizationId: string };
  const members = await listMembersService(organizationId);
  return reply.send({ members });
}

export async function updateMemberController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId, userId } = request.params as { organizationId: string; userId: string };
  const body = request.body as UpdateMemberBody;
  const result = await updateMemberService(organizationId, userId, request.user.id, body);

  logAudit({
    action: 'ROLE_ASSIGNMENT',
    entityType: 'OrganizationUser',
    entityId: userId,
    newValues: body as Record<string, unknown>,
    organizationId,
    actorUserId: request.user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? undefined,
  });

  return reply.send(result);
}

export async function removeMemberController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId, userId } = request.params as { organizationId: string; userId: string };
  const result = await removeMemberService(organizationId, userId, request.user.id);

  logAudit({
    action: 'DELETE',
    entityType: 'OrganizationUser',
    entityId: userId,
    organizationId,
    actorUserId: request.user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? undefined,
  });

  return reply.send(result);
}
