import type { FastifyReply, FastifyRequest } from 'fastify';
import { logAudit } from '../../lib/audit';
import { enqueueInvitationEmail } from '../../jobs/email-queue';
import {
  createInviteService,
  listInvitesService,
  revokeInviteService,
} from './invitation.service';
import type { CreateInviteBody } from './invitation.types';

export async function createInviteController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.params as { organizationId: string };
  const body = request.body as CreateInviteBody;

  const result = await createInviteService({
    ...body,
    organizationId,
    invitedByUserId: request.user.id,
  });

  if (result.alreadyPending) {
    return reply.status(200).send({
      message: 'An invitation is already pending for this email',
      invite: result.invite,
    });
  }

  await enqueueInvitationEmail({
    to: result.invite.email,
    firstName: body.firstName,
    organizationName: request.org.name,
    slug: request.org.slug,
    inviteToken: result.rawToken,
  });

  logAudit({
    action: 'CREATE',
    entityType: 'InviteToken',
    entityId: result.invite.id,
    newValues: { email: result.invite.email },
    organizationId,
    actorUserId: request.user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? undefined,
  });

  return reply.status(201).send({
    message: 'Invitation sent successfully',
    invite: result.invite,
  });
}

export async function listInvitesController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.params as { organizationId: string };
  const invites = await listInvitesService(organizationId, 'TEAM');
  return reply.send({ invites });
}

export async function listCarerInvitesController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.params as { organizationId: string };
  const invites = await listInvitesService(organizationId, 'CARER');
  return reply.send({ invites });
}

export async function revokeInviteController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId, inviteId } = request.params as { organizationId: string; inviteId: string };
  const result = await revokeInviteService(organizationId, inviteId, 'TEAM');

  logAudit({
    action: 'DELETE',
    entityType: 'InviteToken',
    entityId: inviteId,
    organizationId,
    actorUserId: request.user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? undefined,
  });

  return reply.send(result);
}

export async function revokeCarerInviteController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId, inviteId } = request.params as { organizationId: string; inviteId: string };
  const result = await revokeInviteService(organizationId, inviteId, 'CARER');

  logAudit({
    action: 'DELETE',
    entityType: 'InviteToken',
    entityId: inviteId,
    organizationId,
    actorUserId: request.user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? undefined,
  });

  return reply.send(result);
}
