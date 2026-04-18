import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { orgScope } from '../../middleware/org-scope';
import {
	assignCarerController, createVisitController, deleteVisitController,
	getVisitController, listVisitsController, previewAssignmentController,
	unassignCarerController, updateVisitController,
} from './visit.controller';
import {
	assignCarerSchema, createVisitSchema, deleteVisitOpts, getVisitSchema,
	listVisitsSchema, previewAssignmentSchema, unassignCarerSchema, updateVisitSchema,
} from './visit.schemas';

export async function visitRoutes(app: FastifyInstance) {
	app.addHook('preHandler', authenticate(app));
	app.addHook('preHandler', orgScope);

	app.post('/:organizationId/visits', { ...createVisitSchema, preHandler: [authorize('manage_visits')] }, createVisitController);
	app.get('/:organizationId/visits', { ...listVisitsSchema, preHandler: [authorize('view_visits')] }, listVisitsController);
	app.get('/:organizationId/visits/:visitId', { ...getVisitSchema, preHandler: [authorize('view_visits')] }, getVisitController);
	app.patch('/:organizationId/visits/:visitId', { ...updateVisitSchema, preHandler: [authorize('manage_visits')] }, updateVisitController);
	app.delete('/:organizationId/visits/:visitId', { ...deleteVisitOpts, preHandler: [authorize('manage_visits')] }, deleteVisitController);
	app.get('/:organizationId/visits/:visitId/assignment-preview', { ...previewAssignmentSchema, preHandler: [authorize('assign_visits')] }, previewAssignmentController);
	app.post('/:organizationId/visits/:visitId/assign', { ...assignCarerSchema, preHandler: [authorize('assign_visits')] }, assignCarerController);
	app.delete('/:organizationId/visits/:visitId/assign/:carerId', { ...unassignCarerSchema, preHandler: [authorize('assign_visits')] }, unassignCarerController);
}
