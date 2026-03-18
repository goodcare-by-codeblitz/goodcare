import type { FastifyInstance } from 'fastify';
import {
	acceptInviteController,
	forgotPasswordController,
	loginController,
	logoutController,
	refreshController,
	registerController,
	changePasswordController,
} from './auth.controller';
import {
	acceptInviteOpts,
	changePasswordOpts,
	forgotPasswordOpts,
	loginOpts,
	registerOpts,
	resetPasswordOpts,
} from './auth.schemas';
import { authenticate } from '../../middleware/authenticate';

export async function authRoutes(app: FastifyInstance) {
	app.post('/register', registerOpts, registerController(app));
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
	app.post('/accept-invite', acceptInviteOpts, acceptInviteController(app));
	app.post('/refresh', refreshController(app));
}
