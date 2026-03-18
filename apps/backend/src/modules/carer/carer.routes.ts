import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { orgScope } from '../../middleware/org-scope';
import {
	createCarerController, deleteCarerController, getCarerController, listCarersController, updateCarerController,
} from './carer.controller';
import { createCarerSchema, deleteCarerOpts, getCarerSchema, listCarersSchema, updateCarerSchema } from './carer.schemas';

export async function carerRoutes(app: FastifyInstance) {
	app.addHook('preHandler', authenticate(app));
	app.addHook('preHandler', orgScope);

	app.post('/:organizationId/carers', { ...createCarerSchema, preHandler: [authorize('manage_carers')] }, createCarerController);
	app.get('/:organizationId/carers', { ...listCarersSchema, preHandler: [authorize('view_users')] }, listCarersController);
	app.get('/:organizationId/carers/:carerId', { ...getCarerSchema, preHandler: [authorize('view_users')] }, getCarerController);
	app.patch('/:organizationId/carers/:carerId', { ...updateCarerSchema, preHandler: [authorize('manage_carers')] }, updateCarerController);
	app.delete('/:organizationId/carers/:carerId', { ...deleteCarerOpts, preHandler: [authorize('manage_carers')] }, deleteCarerController);
}
