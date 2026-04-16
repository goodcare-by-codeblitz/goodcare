import '@fastify/jwt';
import crypto from 'crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
	ACCESS_TTL,
	REFRESH_DAYS,
	getCookieDomain,
	refreshExpiryDate,
	setAuthCookies,
} from '../../../utils/cookies';

import { resolveOrganizationFromRequest } from '../../../utils/org-resolver';
import { hashToken } from '../../../utils/token-hash';
import {
	enqueuePasswordResetEmail,
	enqueueWelcomeEmail,
} from '../../jobs/email-queue';
import { logAudit } from '../../lib/audit';
import {
	acceptInviteService,
	changePasswordService,
	forgotPasswordService,
	loginService,
	logoutService,
	myOrganizationsService,
	refreshService,
	registerService,
} from './auth.service';
import type {
	AcceptInviteBody,
	ChangePasswordBody,
	ForgotPasswordBody,
	LoginBody,
	RegisterBody,
} from './auth.types';

export function registerController(app: FastifyInstance) {
	return async function handler(
		request: FastifyRequest<{ Body: RegisterBody }>,
		reply: FastifyReply,
	) {
		const body = request.body;

		console.log('RegisterController called with body:', body);

		try {
			const sessionId = crypto.randomUUID();
			const refreshToken = app.jwt.sign(
				{ sid: sessionId, type: 'refresh' },
				{ expiresIn: `${REFRESH_DAYS}d` },
			);
			const tokenHash = hashToken(refreshToken);

			const expiresAt = refreshExpiryDate();
			const ip = request.ip;
			const userAgent = request.headers['user-agent'] ?? null;

			const result = await registerService({
				firstName: body.firstName,
				lastName: body.lastName,
				email: body.email,
				password: body.password,
				organizationName: body.organizationName,
				slug: body.slug,
				session: { sessionId, tokenHash, expiresAt, userAgent, ip },
			});

			if (!result) {
				return reply.status(400).send({
					error: 'Registration failed',
				});
			}

			const accessToken = app.jwt.sign(
				{ sub: result.userId, email: result.email, type: 'access' },
				{ expiresIn: ACCESS_TTL },
			);

			setAuthCookies(reply, { accessToken, refreshToken });

			await enqueueWelcomeEmail({
				to: result.email,
				firstName: body.firstName,
				organizationName: body.organizationName,
				slug: result.chosenSlug,
			});

			logAudit({
				action: 'CREATE',
				entityType: 'User',
				entityId: result.userId,
				newValues: {
					email: result.email,
					organizationName: body.organizationName,
				},
				organizationId: result.organizationId,
				actorUserId: result.userId,
				actorOrganizationUserId: result.userId,
				ipAddress: ip,
				userAgent: userAgent ?? undefined,
			});

			return reply.send({
				message: 'Registration successful',
				email: body.email.toLowerCase().trim(),
				organizationName: body.organizationName,
				slug: result.chosenSlug,
				refreshToken,
			});
		} catch (err: any) {
			app.log.error({ err }, 'register failed');

			// keep it simple; upgrade later to typed errors
			return reply.status(400).send({
				error: err?.message ?? 'Registration failed',
			});
		}
	};
}

export function loginController(app: FastifyInstance) {
	return async function handler(
		request: FastifyRequest<{ Body: LoginBody }>,
		reply: FastifyReply,
	) {
		const body = request.body;

		try {
			const sessionId = crypto.randomUUID();
			const refreshToken = app.jwt.sign(
				{ sid: sessionId, type: 'refresh' },
				{ expiresIn: `${REFRESH_DAYS}d` },
			);
			const tokenHash = hashToken(refreshToken);

			const expiresAt = refreshExpiryDate();
			const ip = request.ip;
			const userAgent = request.headers['user-agent'] ?? null;

			if (!body.email || !body.password) {
				return new Error('Email and password are required');
			}

			const result = await loginService({
				email: body.email,
				password: body.password,
				session: { sessionId, tokenHash, expiresAt, userAgent, ip },
			});

			const accessToken = app.jwt.sign(
				{ sub: result.userId, email: result.email, type: 'access' },
				{ expiresIn: ACCESS_TTL },
			);

			setAuthCookies(reply, { accessToken, refreshToken });

			const org = await resolveOrganizationFromRequest(request, result.userId);
			const orgs = result.organizations;

			const resolvedOrgId = org?.id;
			const actorOrganizationUserId = org?.organizationUser?.id;

			logAudit({
				action: 'LOGIN',
				entityType: 'User',
				entityId: result.userId,
				actorUserId: result.userId,
				organizationId: resolvedOrgId,
				...(actorOrganizationUserId && { actorOrganizationUserId }),
				ipAddress: ip,
				userAgent: userAgent ?? undefined,
			});

			return reply.send({
				message: 'Login successful',
				email: body.email.toLowerCase().trim(),
				organizations: orgs,
				refreshToken,
			});
		} catch (error) {
			// return reply.status(401).send({
			// 	error: error instanceof Error ? error : 'Login failed!!!',
			// });
			return error instanceof Error
				? Promise.reject(error)
				: Promise.reject(new Error('Login failed'));
		}
	};
}

export function forgotPasswordController(app: FastifyInstance) {
	return async function handler(
		request: FastifyRequest<{ Body: ForgotPasswordBody }>,
		reply: FastifyReply,
	) {
		try {
			const result = await forgotPasswordService({ email: request.body.email });

			if (result) {
				await enqueuePasswordResetEmail({
					to: request.body.email.toLowerCase().trim(),
					resetToken: result.resetToken,
					expiresAt: result.expiresAt,
				});
			}

			// Always 200 to prevent email enumeration
			return reply.send({
				message: 'If that email exists, a reset link has been sent.',
			});
		} catch (err: any) {
			app.log.error({ err }, 'forgot-password failed');
			return reply.status(500).send({ error: 'Internal server error' });
		}
	};
}

export function logoutController(app: FastifyInstance) {
	return async function handler(request: FastifyRequest, reply: FastifyReply) {
		const cookieDomain = getCookieDomain();
		const token = request.cookies.access_token;
		if (!token) {
			return reply.status(401).send({ error: 'No access token provided' });
		}

		let decoded: { sub: string; email: string; type: string };
		try {
			decoded = app.jwt.verify<{ sub: string; email: string; type: string }>(
				token,
			);
		} catch {
			return reply.status(401).send({ error: 'Invalid or expired token' });
		}
		if (decoded.type !== 'access' || !decoded.sub) {
			return reply.status(401).send({ error: 'Invalid token' });
		}

		await logoutService(decoded.sub);

		const org = await resolveOrganizationFromRequest(request, decoded.sub);
		const resolvedOrgId = org?.id;
		const actorOrganizationUserId = org?.organizationUser?.id;
		logAudit({
			action: 'LOGOUT',
			entityType: 'User',
			entityId: decoded.sub,
			actorUserId: decoded.sub,
			organizationId: resolvedOrgId,
			...(actorOrganizationUserId && { actorOrganizationUserId }),
			ipAddress: request.ip,
			userAgent: request.headers['user-agent'] ?? undefined,
		});

		reply.clearCookie('access_token', {
			path: '/',
			...(cookieDomain ? { domain: cookieDomain } : {}),
		});
		reply.clearCookie('refresh_token', {
			path: '/auth/refresh',
			...(cookieDomain ? { domain: cookieDomain } : {}),
		});

		return reply.send({ message: 'Logged out successfully' });
	};
}

export function changePasswordController(app: FastifyInstance) {
	return async function handler(request: FastifyRequest, reply: FastifyReply) {
		const cookieDomain = getCookieDomain();
		const body = request.body as ChangePasswordBody;

		const uid = (request.user as { id: string }).id;

		try {
			await changePasswordService({
				userId: uid,
				currentPassword: body.currentPassword,
				newPassword: body.newPassword,
			});

			logAudit({
				action: 'PASSWORD_CHANGE',
				entityType: 'User',
				entityId: uid,
				actorUserId: uid,
				ipAddress: request.ip,
				userAgent: request.headers['user-agent'] ?? undefined,
			});

			reply.clearCookie('access_token', {
				path: '/',
				...(cookieDomain ? { domain: cookieDomain } : {}),
			});
			reply.clearCookie('refresh_token', {
				path: '/auth/refresh',
				...(cookieDomain ? { domain: cookieDomain } : {}),
			});

			return reply.send({ message: 'Password changed successfully' });
		} catch (err: any) {
			app.log.error({ err }, 'change-password failed');
			if (err?.message === 'Current password is incorrect') {
				return reply.status(400).send({ error: err.message });
			}
			return reply.status(500).send({ error: 'Password change failed' });
		}
	};
}

export function acceptInviteController(app: FastifyInstance) {
	return async function handler(
		request: FastifyRequest<{ Body: AcceptInviteBody }>,
		reply: FastifyReply,
	) {
		const body = request.body;
		try {
			const sessionId = crypto.randomUUID();
			const refreshToken = app.jwt.sign(
				{ sid: sessionId, type: 'refresh' },
				{ expiresIn: `${REFRESH_DAYS}d` },
			);
			const tokenHash = hashToken(refreshToken);

			const expiresAt = refreshExpiryDate();
			const ip = request.ip;
			const userAgent = request.headers['user-agent'] ?? null;

			const result = await acceptInviteService({
				token: body.token,
				password: body.password,
				firstName: body.firstName,
				lastName: body.lastName,
				session: { sessionId, tokenHash, expiresAt, userAgent, ip },
			});

			const accessToken = app.jwt.sign(
				{ sub: result.userId, email: result.email, type: 'access' },
				{ expiresIn: ACCESS_TTL },
			);

			setAuthCookies(reply, { accessToken, refreshToken });

			logAudit({
				action: 'CREATE',
				entityType: 'OrganizationUser',
				entityId: result.userId,
				newValues: {
					email: result.email,
					organization: result.organization.name,
				},
				organizationId: result.organization.id,
				actorUserId: result.userId,
				ipAddress: ip,
				userAgent: userAgent ?? undefined,
			});

			return reply.send({
				message: 'Invitation accepted successfully',
				email: result.email,
				organization: result.organization,
			});
		} catch (err: any) {
			app.log.error({ err }, 'accept-invite failed');
			return reply.status(400).send({
				error: err?.message ?? 'Accept invite failed',
			});
		}
	};
}

export function refreshController(app: FastifyInstance) {
	return async function handler(request: FastifyRequest, reply: FastifyReply) {
		const rawRefreshToken = request.cookies.refresh_token;
		if (!rawRefreshToken) {
			return reply.status(401).send({ error: 'No refresh token provided' });
		}

		let decoded: { sid: string; type: string };
		try {
			decoded = app.jwt.verify<{ sid: string; type: string }>(rawRefreshToken);
		} catch {
			return reply
				.status(401)
				.send({ error: 'Invalid or expired refresh token' });
		}

		if (decoded.type !== 'refresh' || !decoded.sid) {
			return reply.status(401).send({ error: 'Invalid token type' });
		}

		try {
			const result = await refreshService(decoded.sid, rawRefreshToken);

			const accessToken = app.jwt.sign(
				{ sub: result.userId, email: result.email, type: 'access' },
				{ expiresIn: ACCESS_TTL },
			);

			reply.setCookie('access_token', accessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				path: '/',
			});

			return reply.send({ message: 'Token refreshed successfully' });
		} catch (err: any) {
			app.log.error({ err }, 'refresh failed');
			return reply.status(401).send({
				error: err?.message ?? 'Refresh failed',
			});
		}
	};
}

// Get current user's organizations and redirect to org selection if >1, otherwise redirect to dashboard
export function myOrganizationsController(app: FastifyInstance) {
	return async function handler(request: FastifyRequest, reply: FastifyReply) {
		const userId = (request.user as { id: string }).id;

		const orgs = await myOrganizationsService(userId);

		return reply.send({
			organizations: orgs.map((ou) => ou.organization),
		});
	};
}

export function meController() {
	return async function handler(request: FastifyRequest, reply: FastifyReply) {
		const user = request.user as { id: string; email: string };
		return reply.send({
			id: user.id,
			email: user.email,
		});
	};
}

export function currentOrgAccessController() {
	return async function handler(request: FastifyRequest, reply: FastifyReply) {
		const user = request.user as { id: string };
		const org = await resolveOrganizationFromRequest(request, user.id);
		const authorized = org?.organizationUser?.status === 'ACTIVE';

		return reply.send({
			authorized,
			organizationId: authorized ? org.id : null,
			organizationSlug: authorized ? org.slug : null,
			organizationName: authorized ? org.name : null,
		});
	};
}
