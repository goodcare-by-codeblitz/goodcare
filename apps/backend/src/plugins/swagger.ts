import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

async function swaggerPluginInner(app: FastifyInstance) {
	await app.register(swagger, {
		openapi: {
			info: {
				title: 'Goodcare API',
				description:
					'REST API for the Goodcare domiciliary care management platform.',
				version: '1.0.0',
			},
			components: {
				securitySchemes: {
					cookieAuth: {
						type: 'apiKey',
						in: 'cookie',
						name: 'access_token',
					},
				},
			},
			tags: [
				{ name: 'Auth', description: 'Authentication and session management' },
				{ name: 'Organizations', description: 'Organization CRUD and settings' },
				{ name: 'Members', description: 'Organization member management' },
				{ name: 'Invitations', description: 'Invite users to an organization' },
				{ name: 'Patients', description: 'Patient records' },
				{ name: 'Carers', description: 'Carer profiles and status' },
				{ name: 'Visits', description: 'Scheduled and completed visits' },
				{ name: 'Care Plans', description: 'Versioned care plans per patient' },
				{ name: 'Daily Notes', description: 'Daily notes linked to visits' },
				{
					name: 'Incident Reports',
					description: 'Incident reporting and tracking',
				},
				{ name: 'Audit', description: 'Read-only audit log' },
			],
		},
	});

	if (process.env.NODE_ENV !== 'production') {
		await app.register(swaggerUi, {
			routePrefix: '/docs',
		});
	}
}

export const swaggerPlugin = fp(swaggerPluginInner, {
	name: 'swagger',
});
