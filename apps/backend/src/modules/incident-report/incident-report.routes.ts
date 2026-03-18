import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { orgScope } from '../../middleware/org-scope';
import {
	createIncidentReportController, deleteIncidentReportController, getIncidentReportController,
	listIncidentReportsController, updateIncidentReportController,
} from './incident-report.controller';
import {
	createIncidentReportSchema, deleteIncidentReportOpts, getIncidentReportSchema,
	listIncidentReportsSchema, updateIncidentReportSchema,
} from './incident-report.schemas';

export async function incidentReportRoutes(app: FastifyInstance) {
	app.addHook('preHandler', authenticate(app));
	app.addHook('preHandler', orgScope);

	app.post('/:organizationId/incidents', { ...createIncidentReportSchema, preHandler: [authorize('manage_incidents')] }, createIncidentReportController);
	app.get('/:organizationId/incidents', { ...listIncidentReportsSchema, preHandler: [authorize('view_incidents')] }, listIncidentReportsController);
	app.get('/:organizationId/incidents/:incidentId', { ...getIncidentReportSchema, preHandler: [authorize('view_incidents')] }, getIncidentReportController);
	app.patch('/:organizationId/incidents/:incidentId', { ...updateIncidentReportSchema, preHandler: [authorize('manage_incidents')] }, updateIncidentReportController);
	app.delete('/:organizationId/incidents/:incidentId', { ...deleteIncidentReportOpts, preHandler: [authorize('manage_incidents')] }, deleteIncidentReportController);
}
