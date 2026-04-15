import type { FastifyReply, FastifyRequest } from 'fastify';
import { ForbiddenError } from '../lib/errors';

/**
 *
 * @param requiredPermissions
 * @returns
 * Middleware to check if the user has the required permissions within the organization context.
 * It assumes that `request.org.userPermissions` has been populated by the `orgScope` middleware.
 * If the user is missing any of the required permissions, it throws a ForbiddenError.
 */
export function authorize(...requiredPermissions: string[]) {
	return async function handler(request: FastifyRequest, _reply: FastifyReply) {
		const userPermissions = request.org.userPermissions;

		const missing = requiredPermissions.filter(
			(p) => !userPermissions.includes(p),
		);

		if (missing.length > 0) {
			throw new ForbiddenError(
				`Missing required permissions: ${missing.join(', ')}`,
			);
		}
	};
}

/**
 * @param requiredPermissions
 * @returns  boolean
 * Middleware to check if the user has the required platform-level permissions.
 * It assumes that `request.user.permissions` has been populated by the authentication middleware.
 * If the user is missing any of the required permissions, it throws a ForbiddenError.
 */
export function authorizePlatform(...requiredPermissions: string[]) {
	return async function handler(request: FastifyRequest, _reply: FastifyReply) {
		const userPermissions = request.user.permissions;

		const missing = requiredPermissions.filter(
			(p) => !userPermissions.includes(p),
		);

		if (missing.length > 0) {
			throw new ForbiddenError(
				`Missing required platform permissions: ${missing.join(', ')}`,
			);
		}
	};
}
