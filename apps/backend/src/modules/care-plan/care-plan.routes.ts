import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { orgScope } from '../../middleware/org-scope';
import {
	createCarePlanController, deleteCarePlanController, getCarePlanController,
	listCarePlansController, updateCarePlanController,
} from './care-plan.controller';
import {
	createCarePlanSchema, deleteCarePlanOpts, getCarePlanSchema,
	listCarePlansSchema, updateCarePlanSchema,
} from './care-plan.schemas';

export async function carePlanRoutes(app: FastifyInstance) {
	app.addHook('preHandler', authenticate(app));
	app.addHook('preHandler', orgScope);

	app.post('/:organizationId/care-plans', { ...createCarePlanSchema, preHandler: [authorize('manage_care_plans')] }, createCarePlanController);
	app.get('/:organizationId/care-plans', { ...listCarePlansSchema, preHandler: [authorize('view_care_plans')] }, listCarePlansController);
	app.get('/:organizationId/care-plans/:carePlanId', { ...getCarePlanSchema, preHandler: [authorize('view_care_plans')] }, getCarePlanController);
	app.patch('/:organizationId/care-plans/:carePlanId', { ...updateCarePlanSchema, preHandler: [authorize('manage_care_plans')] }, updateCarePlanController);
	app.delete('/:organizationId/care-plans/:carePlanId', { ...deleteCarePlanOpts, preHandler: [authorize('manage_care_plans')] }, deleteCarePlanController);
}
