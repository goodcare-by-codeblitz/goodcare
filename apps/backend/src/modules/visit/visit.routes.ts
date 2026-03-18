import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { orgScope } from '../../middleware/org-scope';
import {
	assignCarerController, createVisitController, deleteVisitController,
	getVisitController, listVisitsController, unassignCarerController, updateVisitController,
} from './visit.controller';
import {
	assignCarerSchema, createVisitSchema, deleteVisitOpts, getVisitSchema,
	listVisitsSchema, unassignCarerSchema, updateVisitSchema,
} from './visit.schemas';

export async function visitRoutes(app: FastifyInstance) {
	app.addHook('preHandler', authenticate(app));
	app.addHook('preHandler', orgScope);

	app.post('/:organizationId/visits', { ...createVisitSchema, preHandler: [authorize('assign_visits')] }, createVisitController);
	app.get('/:organizationId/visits', { ...listVisitsSchema, preHandler: [authorize('view_visits')] }, listVisitsController);
	app.get('/:organizationId/visits/:visitId', { ...getVisitSchema, preHandler: [authorize('view_visits')] }, getVisitController);
	app.patch('/:organizationId/visits/:visitId', { ...updateVisitSchema, preHandler: [authorize('assign_visits')] }, updateVisitController);
	app.delete('/:organizationId/visits/:visitId', { ...deleteVisitOpts, preHandler: [authorize('assign_visits')] }, deleteVisitController);
	app.post('/:organizationId/visits/:visitId/assign', { ...assignCarerSchema, preHandler: [authorize('assign_visits')] }, assignCarerController);
	app.delete('/:organizationId/visits/:visitId/assign/:carerId', { ...unassignCarerSchema, preHandler: [authorize('assign_visits')] }, unassignCarerController);
}
