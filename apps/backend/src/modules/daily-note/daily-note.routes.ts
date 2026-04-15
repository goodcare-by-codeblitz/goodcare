import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { orgScope } from '../../middleware/org-scope';
import {
	createDailyNoteController, deleteDailyNoteController, getDailyNoteController,
	listDailyNotesController, updateDailyNoteController,
} from './daily-note.controller';
import {
	createDailyNoteSchema, deleteDailyNoteOpts, getDailyNoteSchema,
	listDailyNotesSchema, updateDailyNoteSchema,
} from './daily-note.schemas';

export async function dailyNoteRoutes(app: FastifyInstance) {
	app.addHook('preHandler', authenticate(app));
	app.addHook('preHandler', orgScope);

	app.post('/:organizationId/daily-notes', { ...createDailyNoteSchema, preHandler: [authorize('manage_daily_notes')] }, createDailyNoteController);
	app.get('/:organizationId/daily-notes', { ...listDailyNotesSchema, preHandler: [authorize('view_daily_notes')] }, listDailyNotesController);
	app.get('/:organizationId/daily-notes/:dailyNoteId', { ...getDailyNoteSchema, preHandler: [authorize('view_daily_notes')] }, getDailyNoteController);
	app.patch('/:organizationId/daily-notes/:dailyNoteId', { ...updateDailyNoteSchema, preHandler: [authorize('manage_daily_notes')] }, updateDailyNoteController);
	app.delete('/:organizationId/daily-notes/:dailyNoteId', { ...deleteDailyNoteOpts, preHandler: [authorize('manage_daily_notes')] }, deleteDailyNoteController);
}
