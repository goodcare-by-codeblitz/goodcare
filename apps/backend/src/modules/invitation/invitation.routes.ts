import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { orgScope } from '../../middleware/org-scope';
import {
  createInviteController,
  listInvitesController,
  revokeInviteController,
} from './invitation.controller';
import { createInviteOpts, inviteListOpts, revokeInviteOpts } from './invitation.schemas';

export async function invitationRoutes(app: FastifyInstance) {
  const auth = authenticate(app);

  // POST /orgs/:organizationId/invitations — send invite
  app.post(
    '/:organizationId/invitations',
    { ...createInviteOpts, preHandler: [auth, orgScope, authorize('manage_members')] },
    createInviteController,
  );

  // GET /orgs/:organizationId/invitations — list pending invites
  app.get(
    '/:organizationId/invitations',
    { ...inviteListOpts, preHandler: [auth, orgScope, authorize('manage_members')] },
    listInvitesController,
  );

  // DELETE /orgs/:organizationId/invitations/:inviteId — revoke invite
  app.delete(
    '/:organizationId/invitations/:inviteId',
    { ...revokeInviteOpts, preHandler: [auth, orgScope, authorize('manage_members')] },
    revokeInviteController,
  );
}
