import type { FastifyReply, FastifyRequest } from 'fastify';
import { logAudit } from '../../lib/audit';
import { enqueueInvitationEmail } from '../../jobs/email-queue';
import {
  createInviteService,
  listInvitesService,
  revokeInviteService,
} from './invitation.service';
import type { CreateCarerInviteBody, CreateInviteBody } from './invitation.types';

export async function createInviteController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.params as { organizationId: string };
  const body = request.body as CreateInviteBody;

  const result = await createInviteService({
    ...body,
    kind: 'TEAM',
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

export async function createCarerInviteController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.params as { organizationId: string };
  const body = request.body as CreateCarerInviteBody;

  const result = await createInviteService({
    ...body,
    kind: 'CARER',
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
    newValues: { email: result.invite.email, kind: result.invite.kind },
    organizationId,
    actorUserId: request.user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? undefined,
  });

  return reply.status(201).send({
    message: 'Carer invitation sent successfully',
    invite: result.invite,
  });
}

export async function listInvitesController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.params as { organizationId: string };
  const invites = await listInvitesService(organizationId);
  return reply.send({ invites });
}

export async function revokeInviteController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId, inviteId } = request.params as { organizationId: string; inviteId: string };
  const result = await revokeInviteService(organizationId, inviteId);

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
