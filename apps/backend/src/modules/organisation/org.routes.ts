import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { orgScope } from '../../middleware/org-scope';
import {
  archiveRoleController,
  createRoleController,
  getOrgController,
  listPermissionsController,
  listRolesController,
  listMembersController,
  removeMemberController,
  updateRoleController,
  updateMemberController,
  updateOrgController,
} from './org.controller';
import {
  createRoleOpts,
  listMembersOpts,
  listRolesOpts,
  memberParamsOpts,
  orgIdParamsOpts,
  roleParamsOpts,
  updateMemberOpts,
  updateOrgOpts,
  updateRoleOpts,
} from './org.schemas';
import { invitationRoutes } from '../invitation/invitation.routes';

export async function orgRoutes(app: FastifyInstance) {
  // All org routes require authentication + org scoping
  const auth = authenticate(app);

  // GET /orgs/:organizationId — view org details (any active member)
  app.get(
    '/:organizationId',
    { ...orgIdParamsOpts, preHandler: [auth, orgScope] },
    getOrgController,
  );

  // PATCH /orgs/:organizationId — update org settings
  app.patch(
    '/:organizationId',
    { ...updateOrgOpts, preHandler: [auth, orgScope, authorize('manage_organization')] },
    updateOrgController,
  );

  // GET /orgs/:organizationId/members — list members
  app.get(
    '/:organizationId/members',
    { ...listMembersOpts, preHandler: [auth, orgScope, authorize('view_users')] },
    listMembersController,
  );

  app.get(
    '/:organizationId/roles',
    { ...listRolesOpts, preHandler: [auth, orgScope, authorize('view_roles')] },
    listRolesController,
  );

  app.get(
    '/:organizationId/permissions',
    { ...orgIdParamsOpts, preHandler: [auth, orgScope, authorize('view_roles')] },
    listPermissionsController,
  );

  app.post(
    '/:organizationId/roles',
    { ...createRoleOpts, preHandler: [auth, orgScope, authorize('manage_roles')] },
    createRoleController,
  );

  app.patch(
    '/:organizationId/roles/:roleId',
    { ...updateRoleOpts, preHandler: [auth, orgScope, authorize('manage_roles')] },
    updateRoleController,
  );

  app.delete(
    '/:organizationId/roles/:roleId',
    { ...roleParamsOpts, preHandler: [auth, orgScope, authorize('manage_roles')] },
    archiveRoleController,
  );

  // PATCH /orgs/:organizationId/members/:userId — update member
  app.patch(
    '/:organizationId/members/:userId',
    { ...updateMemberOpts, preHandler: [auth, orgScope, authorize('manage_members', 'manage_roles')] },
    updateMemberController,
  );

  // DELETE /orgs/:organizationId/members/:userId — remove member
  app.delete(
    '/:organizationId/members/:userId',
    { ...memberParamsOpts, preHandler: [auth, orgScope, authorize('manage_members')] },
    removeMemberController,
  );

  // Register invitation sub-routes
  app.register(invitationRoutes);
}
