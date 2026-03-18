import { prisma } from '@repo/db';
import type { FastifyRequest } from 'fastify/types/request';

type TenantContext = {
	id: string;
	slug: string;
	name: string;
	organizationUser?: {
		id: string;
		status: string;
		joinedAt: Date | null;
		invitedAt: Date;
	} | null;
};

function getOrgSlugFromHost(host: string): string | null {
	const hostname = host.split(':')[0]; // remove port
	if (!hostname) return null;
	const parts = hostname.split('.');

	// acme.localhost => ['acme', 'localhost']
	if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
		return parts[0] ?? null;
	}

	return null;
}

export async function resolveOrganizationFromRequest(
	request: FastifyRequest,
	userId?: string,
): Promise<TenantContext | null> {
	const host = request.headers.host ?? '';
	const queryOrg = (request.query as Record<string, unknown>)?.org;
	const headerOrg = request.headers['x-org-slug'];

	try {
		let slug: string | null = null;

		// 1. Prefer host/subdomain
		slug = getOrgSlugFromHost(host);

		// 2. Dev fallback
		if (!slug && typeof queryOrg === 'string') {
			slug = queryOrg;
		}

		if (!slug && typeof headerOrg === 'string') {
			slug = headerOrg;
		}

		if (!slug) return null;

		const org = await prisma.organization.findUnique({
			where: { slug },
			select: {
				id: true,
				slug: true,
				name: true,
				status: true,
				...(userId && {
					users: {
						where: { userId },
						select: {
							id: true,
							status: true,
							joinedAt: true,
							invitedAt: true,
						},
						take: 1,
					},
				}),
			},
		});

		if (!org || org.status !== 'ACTIVE') return null;

		return {
			id: org.id,
			slug: org.slug,
			name: org.name,
			...(userId && {
				organizationUser:
					(
						org as {
							users?: {
								id: string;
								status: string;
								joinedAt: Date | null;
								invitedAt: Date;
							}[];
						}
					).users?.[0] ?? null,
			}),
		};
	} catch (error) {
		request.log.error({ error }, 'Error resolving organization from request');
		console.error('Error resolving organization from request', error);
		return null;
	}
}
