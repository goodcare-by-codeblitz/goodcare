import '@fastify/jwt';

type AuthenticatedUser = {
	id: string;
	email: string;
	permissions: string[];
	organizationMemberships: Array<{
		orgId: string;
		orgSlug: string;
		role: string;
		status: string;
	}>;
};

type RequestOrganizationScope = {
	id: string;
	slug: string;
	name: string;
	userPermissions: string[];
	membershipStatus: string;
};

declare module '@fastify/jwt' {
	interface FastifyJWT {
		user: AuthenticatedUser;
	}
}

declare module 'fastify' {
	interface FastifyRequest {
		org: RequestOrganizationScope;
	}
}

export {};
