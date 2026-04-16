import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@repo/db';
import { ForbiddenError, NotFoundError } from '../lib/errors';

/**
 * Middleware to enforce organization scope and load organization details and permissions.
 * Expects `organizationId` in the route parameters and checks if the user is an active member of that organization.
 * If valid, it attaches the organization details and user permissions to `request.org`.
 */
export async function orgScope(request: FastifyRequest, _reply: FastifyReply) {
	const { organizationId } = request.params as { organizationId?: string };

	if (!organizationId) {
		throw new NotFoundError('Organization ID is required');
	}

	const membership = request.user.organizationMemberships.find(
		(m: { orgId: string }) => m.orgId === organizationId,
	);

	if (!membership || membership.status !== 'ACTIVE') {
		throw new ForbiddenError(
			'You are not an active member of this organization',
		);
	}

	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true, slug: true, name: true, status: true },
	});

	if (!org || org.status !== 'ACTIVE') {
		throw new NotFoundError('Organization not found');
	}

	// Load org-scoped permissions for this user
	const roleAssignments = await prisma.roleAssignment.findMany({
		where: {
			userId: request.user.id,
			organizationId,
		},
		select: {
			role: {
				select: {
					name: true,
					permissions: {
						select: { permission: { select: { key: true } } },
					},
				},
			},
		},
	});

	const orgPermissions = roleAssignments.flatMap((ra) =>
		ra.role.permissions.map((rp) => rp.permission.key),
	);

	request.org = {
		id: org.id,
		slug: org.slug,
		name: org.name,
		userPermissions: [...new Set(orgPermissions)],
		membershipStatus: membership.status,
	};
}
