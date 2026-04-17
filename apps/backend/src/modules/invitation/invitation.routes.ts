import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { orgScope } from '../../middleware/org-scope';
import {
  createCarerInviteController,
  createInviteController,
  listCarerInvitesController,
  listInvitesController,
  revokeCarerInviteController,
  revokeInviteController,
} from './invitation.controller';
import {
  carerInviteListOpts,
  createCarerInviteOpts,
  createInviteOpts,
  inviteListOpts,
  revokeCarerInviteOpts,
  revokeInviteOpts,
} from './invitation.schemas';

export async function invitationRoutes(app: FastifyInstance) {
  const auth = authenticate(app);

  app.post(
    '/:organizationId/invitations',
    { ...createInviteOpts, preHandler: [auth, orgScope, authorize('manage_members', 'manage_roles')] },
    createInviteController,
  );

  app.post(
    '/:organizationId/carer-invitations',
    { ...createCarerInviteOpts, preHandler: [auth, orgScope, authorize('manage_carers')] },
    createCarerInviteController,
  );

  app.get(
    '/:organizationId/invitations',
    { ...inviteListOpts, preHandler: [auth, orgScope, authorize('manage_members')] },
    listInvitesController,
  );

  app.delete(
    '/:organizationId/invitations/:inviteId',
    { ...revokeInviteOpts, preHandler: [auth, orgScope, authorize('manage_members')] },
    revokeInviteController,
  );

  app.get(
    '/:organizationId/carer-invitations',
    { ...carerInviteListOpts, preHandler: [auth, orgScope, authorize('manage_carers')] },
    listCarerInvitesController,
  );

  app.delete(
    '/:organizationId/carer-invitations/:inviteId',
    { ...revokeCarerInviteOpts, preHandler: [auth, orgScope, authorize('manage_carers')] },
    revokeCarerInviteController,
  );
}
