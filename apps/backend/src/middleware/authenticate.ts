import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@repo/db';
import { UnauthorizedError } from '../lib/errors';

/**
 *
 * @param app
 * @returns boolean
 * @description This middleware checks for the presence of a JWT access token in the cookies of incoming requests. It verifies the token, extracts the user information, and attaches it to the request object for use in subsequent handlers. If the token is missing, invalid, or if the user is inactive, it throws an UnauthorizedError.
 */

export function authenticate(app: FastifyInstance) {
	return async function handler(request: FastifyRequest, _reply: FastifyReply) {
		const token = request.cookies.access_token;
		if (!token) {
			throw new UnauthorizedError('No access token provided!', {
				reason: 'NO_TOKEN',
			});
		}

		let decoded: { sub: string; email: string; type: string };
		try {
			decoded = app.jwt.verify<{ sub: string; email: string; type: string }>(
				token,
			);
		} catch {
			throw new UnauthorizedError('Invalid or expired access token', {
				reason: 'INVALID_TOKEN',
				code: 'INVALID_TOKEN',
				statusCode: 401,
			});
		}

		if (decoded.type !== 'access' || !decoded.sub) {
			throw new UnauthorizedError('Invalid token type', {
				reason: 'INVALID_TOKEN_TYPE',
				code: 'INVALID_TOKEN_TYPE',
				statusCode: 401,
			});
		}

		const user = await prisma.user.findUnique({
			where: { id: decoded.sub },
			select: {
				id: true,
				email: true,
				status: true,
				organizationUsers: {
					select: {
						status: true,
						organization: { select: { id: true, slug: true } },
					},
				},
				roles: {
					where: { organizationId: null },
					select: {
						role: {
							select: {
								permissions: {
									select: { permission: { select: { key: true } } },
								},
							},
						},
					},
				},
			},
		});

		if (!user || user.status !== 'ACTIVE') {
			throw new UnauthorizedError('User not found or inactive');
		}

		const platformPermissions = user.roles.flatMap((ra) =>
			ra.role.permissions.map((rp) => rp.permission.key),
		);

		request.user = {
			id: user.id,
			email: user.email,
			permissions: [...new Set(platformPermissions)],
			organizationMemberships: user.organizationUsers.map((ou) => ({
				orgId: ou.organization.id,
				orgSlug: ou.organization.slug,
				role: '',
				status: ou.status,
			})),
		};
	};
}
