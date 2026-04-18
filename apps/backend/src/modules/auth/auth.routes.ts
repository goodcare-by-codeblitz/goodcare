import type { FastifyInstance } from 'fastify';
import {
	acceptInviteController,
	forgotPasswordController,
	currentOrgAccessController,
	invitePreviewController,
	loginController,
	logoutController,
	refreshController,
	registerController,
	changePasswordController,
	myOrganizationsController,
} from './auth.controller';
import {
	acceptInviteOpts,
	changePasswordOpts,
	currentOrgAccessOpts,
	forgotPasswordOpts,
	invitePreviewOpts,
	loginOpts,
	orgSlugCheckOpts,
	registerOpts,
	resetPasswordOpts,
} from './auth.schemas';
import { authenticate } from '../../middleware/authenticate';
import { meController } from './auth.controller';
import { meOpts } from './auth.schemas';
import { orgSlugCheckHandler } from '../../../utils/generate-slug';

export async function authRoutes(app: FastifyInstance) {
	app.post('/register', registerOpts, registerController(app));
	app.post('/org-slug/check', orgSlugCheckOpts, orgSlugCheckHandler);
	app.post('/login', loginOpts, loginController(app));
	app.delete(
		'/logout',
		{ preHandler: [authenticate(app)] },
		logoutController(app),
	);
	app.post(
		'/forgot-password',
		forgotPasswordOpts,
		forgotPasswordController(app),
	);
	app.put(
		'/change-password',
		{ ...changePasswordOpts, preHandler: [authenticate(app)] },
		changePasswordController(app),
	);
	app.get('/invite-preview', invitePreviewOpts, invitePreviewController(app));
	app.post('/accept-invite', acceptInviteOpts, acceptInviteController(app));
	app.post('/refresh', refreshController(app));

	app.get(
		'/my-organizations',
		{ preHandler: [authenticate(app)] },
		myOrganizationsController(app),
	);

	app.get(
		'/me',
		{ ...meOpts, preHandler: [authenticate(app)] },
		meController(),
	);
	app.get(
		'/current-org-access',
		{ ...currentOrgAccessOpts, preHandler: [authenticate(app)] },
		currentOrgAccessController(),
	);
}
