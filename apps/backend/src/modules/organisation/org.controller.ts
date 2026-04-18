import type { FastifyReply, FastifyRequest } from 'fastify';
import { logAudit } from '../../lib/audit';
import {
  archiveRoleService,
  createRoleService,
  getOrgService,
  listPermissionCatalogService,
  listRolesService,
  listMembersService,
  removeMemberService,
  updateRoleService,
  updateMemberService,
  updateOrgService,
} from './org.service';
import type {
  CreateOrgRoleBody,
  RoleKind,
  UpdateMemberBody,
  UpdateOrgBody,
  UpdateOrgRoleBody,
} from './org.types';

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

export async function listRolesController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.params as { organizationId: string };
  const { kind } = request.query as { kind: RoleKind };
  const roles = await listRolesService(organizationId, kind);
  return reply.send({ roles });
}

export async function listPermissionsController(_request: FastifyRequest, reply: FastifyReply) {
  const permissions = await listPermissionCatalogService();
  return reply.send({ permissions });
}

export async function createRoleController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.params as { organizationId: string };
  const body = request.body as CreateOrgRoleBody;
  const role = await createRoleService(organizationId, body);

  logAudit({
    action: 'CREATE',
    entityType: 'Role',
    entityId: role.id,
    newValues: body as Record<string, unknown>,
    organizationId,
    actorUserId: request.user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? undefined,
  });

  return reply.status(201).send({ role });
}

export async function updateRoleController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId, roleId } = request.params as { organizationId: string; roleId: string };
  const body = request.body as UpdateOrgRoleBody;
  const role = await updateRoleService(organizationId, roleId, body);

  logAudit({
    action: 'UPDATE',
    entityType: 'Role',
    entityId: roleId,
    newValues: body as Record<string, unknown>,
    organizationId,
    actorUserId: request.user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? undefined,
  });

  return reply.send({ role });
}

export async function archiveRoleController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId, roleId } = request.params as { organizationId: string; roleId: string };
  const result = await archiveRoleService(organizationId, roleId);

  logAudit({
    action: 'DELETE',
    entityType: 'Role',
    entityId: roleId,
    organizationId,
    actorUserId: request.user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? undefined,
  });

  return reply.send(result);
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
