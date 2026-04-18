import '@fastify/jwt';
import { prisma } from '@repo/db';
import crypto from 'crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
	ACCESS_TTL,
	REFRESH_COOKIE_NAME,
	REFRESH_DAYS,
	clearAuthCookies,
	refreshExpiryDate,
	setAccessTokenCookie,
	setAuthCookies,
} from '../../../utils/cookies';

import { resolveOrganizationFromRequest } from '../../../utils/org-resolver';
import { hashToken } from '../../../utils/token-hash';
import { CARER_ROLE_NAME } from '../organisation/org-role.utils';
import {
	enqueuePasswordResetEmail,
	enqueueWelcomeEmail,
} from '../../jobs/email-queue';
import { AppError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';
import {
	acceptInviteService,
	changePasswordService,
	forgotPasswordService,
	getInvitePreviewService,
	loginService,
	logoutService,
	myOrganizationsService,
	resetPasswordService,
	refreshService,
	registerService,
} from './auth.service';
import type {
	AcceptInviteBody,
	ChangePasswordBody,
	ForgotPasswordBody,
	LoginBody,
	RegisterBody,
	ResetPasswordBody,
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
				...(body.slug ? { slug: body.slug } : {}),
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
					...(request.body.nextPath
						? { nextPath: request.body.nextPath }
						: {}),
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

export function resetPasswordController(app: FastifyInstance) {
	return async function handler(
		request: FastifyRequest<{ Body: ResetPasswordBody }>,
		reply: FastifyReply,
	) {
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

			const result = await resetPasswordService({
				token: request.body.token,
				newPassword: request.body.newPassword,
				session: { sessionId, tokenHash, expiresAt, userAgent, ip },
			});

			const accessToken = app.jwt.sign(
				{ sub: result.userId, email: result.email, type: 'access' },
				{ expiresIn: ACCESS_TTL },
			);

			setAuthCookies(reply, { accessToken, refreshToken });

			return reply.send({
				message: 'Password reset successfully',
				email: result.email,
			});
		} catch (err: any) {
			app.log.error({ err }, 'reset-password failed');
			if (err instanceof AppError) {
				return reply.status(err.statusCode).send({
					error: err.message,
					code: err.code,
					details: err.details,
				});
			}

			return reply.status(400).send({
				error: err?.message ?? 'Reset password failed',
			});
		}
	};
}

export function logoutController(app: FastifyInstance) {
	return async function handler(request: FastifyRequest, reply: FastifyReply) {
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

		clearAuthCookies(reply);

		return reply.send({ message: 'Logged out successfully' });
	};
}

export function changePasswordController(app: FastifyInstance) {
	return async function handler(request: FastifyRequest, reply: FastifyReply) {
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

			clearAuthCookies(reply);

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
				currentUserId: (await getCurrentSessionUser(app, request))?.id ?? null,
				session: { sessionId, tokenHash, expiresAt, userAgent, ip },
			});

			if (result.setAuthSession) {
				const accessToken = app.jwt.sign(
					{ sub: result.userId, email: result.email, type: 'access' },
					{ expiresIn: ACCESS_TTL },
				);

				setAuthCookies(reply, { accessToken, refreshToken });
			}

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
				inviteKind: result.inviteKind,
				nextStep: result.nextStep,
				inviteState: result.inviteState,
			});
		} catch (err: any) {
			app.log.error({ err }, 'accept-invite failed');
			if (err instanceof AppError) {
				return reply.status(err.statusCode).send({
					error: err.message,
					code: err.code,
					details: err.details,
				});
			}
			return reply.status(400).send({
				error: err?.message ?? 'Accept invite failed',
			});
		}
	};
}

export function invitePreviewController(app: FastifyInstance) {
	return async function handler(
		request: FastifyRequest<{ Querystring: { token: string } }>,
		reply: FastifyReply,
	) {
		try {
			const preview = await getInvitePreviewService(
				request.query.token,
				await getCurrentSessionUser(app, request),
			);

			return reply.send(preview);
		} catch (err: any) {
			app.log.error({ err }, 'invite-preview failed');
			if (err instanceof AppError) {
				return reply.status(err.statusCode).send({
					error: err.message,
					code: err.code,
					details: err.details,
				});
			}
			return reply.status(400).send({
				error: err?.message ?? 'Unable to preview invite',
			});
		}
	};
}

export function refreshController(app: FastifyInstance) {
	return async function handler(request: FastifyRequest, reply: FastifyReply) {
		const rawRefreshToken = request.cookies[REFRESH_COOKIE_NAME];
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

			setAccessTokenCookie(reply, accessToken);

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
		const membershipActive = org?.organizationUser?.status === 'ACTIVE';
		let authorized = false;
		let reason: 'CARER_ONLY_ACCOUNT' | null = null;
		let permissions: string[] = [];

		if (membershipActive && org) {
			const roleAssignments = await prisma.roleAssignment.findMany({
				where: {
					userId: user.id,
					organizationId: org.id,
				},
				select: {
					role: {
						select: {
							name: true,
							scope: true,
							organizationRoleKind: true,
							permissions: {
								select: {
									permission: {
										select: {
											key: true,
										},
									},
								},
							},
						},
					},
				},
			});

			const hasTeamRole = roleAssignments.some(
				(assignment) => assignment.role.organizationRoleKind === 'TEAM',
			);
			const hasCarerRole = roleAssignments.some(
				(assignment) => assignment.role.name === CARER_ROLE_NAME,
			);

			authorized = hasTeamRole;
			if (!authorized && hasCarerRole) {
				reason = 'CARER_ONLY_ACCOUNT';
			}

			if (authorized) {
				permissions = [
					...new Set(
						roleAssignments.flatMap((assignment) =>
							assignment.role.permissions.map((entry) => entry.permission.key),
						),
					),
				];

				// Compatibility bridge: older environments may not have been reseeded yet
				// with the new medication permissions, but Admin/Manager/Caregiver/Viewer
				// should still retain the expected access model.
				const roleKeys = new Set(
					roleAssignments.map((assignment) =>
						assignment.role.scope === 'ORGANIZATION'
							? assignment.role.name
							: `${assignment.role.scope}:${assignment.role.name}`,
					),
				);

				if (!permissions.includes('view_medications')) {
					if (
						roleKeys.has('Admin') ||
						roleKeys.has('Manager') ||
						roleKeys.has('Caregiver') ||
						roleKeys.has('ORGANIZATION:Viewer')
					) {
						permissions.push('view_medications');
					}
				}

				if (!permissions.includes('manage_medications')) {
					if (roleKeys.has('Admin') || roleKeys.has('Manager')) {
						permissions.push('manage_medications');
					}
				}

				if (!permissions.includes('administer_medications')) {
					if (
						roleKeys.has('Admin') ||
						roleKeys.has('Manager') ||
						roleKeys.has('Caregiver')
					) {
						permissions.push('administer_medications');
					}
				}
			}
		}

		return reply.send({
			authorized,
			organizationId: authorized && org ? org.id : null,
			organizationSlug: authorized && org ? org.slug : null,
			organizationName: authorized && org ? org.name : null,
			permissions,
			reason,
		});
	};
}

async function getCurrentSessionUser(
	app: FastifyInstance,
	request: FastifyRequest,
) {
	const token = request.cookies.access_token;
	if (token) {
		try {
			const decoded = app.jwt.verify<{
				sub: string;
				email: string;
				type: string;
			}>(token);
			if (decoded.type === 'access') {
				return {
					id: decoded.sub,
					email: decoded.email,
				};
			}
		} catch {
			// fall through to refresh-session lookup
		}
	}

	const refreshToken = request.cookies[REFRESH_COOKIE_NAME];
	if (!refreshToken) {
		return null;
	}

	try {
		const decoded = app.jwt.verify<{ sid: string; type: string }>(refreshToken);
		if (decoded.type !== 'refresh' || !decoded.sid) {
			return null;
		}

		const session = await prisma.session.findUnique({
			where: { sessionId: decoded.sid },
			select: {
				userId: true,
				revokedAt: true,
				expiresAt: true,
				user: {
					select: {
						email: true,
					},
				},
			},
		});

		if (!session || session.revokedAt || session.expiresAt < new Date()) {
			return null;
		}

		return {
			id: session.userId,
			email: session.user.email,
		};
	} catch {
		return null;
	}
}
