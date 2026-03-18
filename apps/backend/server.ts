import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import 'dotenv/config';
import Fastify from 'fastify';
import emailWorkerPlugin from './src/jobs/email-worker.plugin';
import { AppError } from './src/lib/errors';
import { auditRoutes } from './src/modules/audit/audit.routes';
import { authRoutes } from './src/modules/auth/auth.routes';
import { carePlanRoutes } from './src/modules/care-plan/care-plan.routes';
import { dailyNoteRoutes } from './src/modules/daily-note/daily-note.routes';
import { incidentReportRoutes } from './src/modules/incident-report/incident-report.routes';
// import { carerRoutes } from './src/modules/carer/carer.routes';
// import { orgRoutes } from './src/modules/organisation/org.routes';
import { patientRoutes } from './src/modules/patient/patient.routes';
import { visitRoutes } from './src/modules/visit/visit.routes';
import { swaggerPlugin } from './src/plugins/swagger';
// import type { RequestOrg } from './src/types/fastify.js';

export const app = Fastify({
	logger: true,
});

// Decorate request with user and org (typed via fastify.d.ts)
// app.decorateRequest('user', null as unknown as RequestUser);
// app.decorateRequest('org', null as unknown as RequestOrg);

await app.register(swaggerPlugin);

app.register(cookie, {
	secret: process.env.COOKIE_SECRET!,
});

app.register(jwt, {
	secret: process.env.JWT_SECRET!,
});

// Global error handler for typed errors
app.setErrorHandler(
	(
		error: Error & { statusCode?: number; validation?: unknown },
		_request,
		reply,
	) => {
		if (error instanceof AppError) {
			return reply.status(error.statusCode).send({
				error: error.message,
				code: error.code,
				details: error.details,
			});
		}

		// Fastify validation errors
		if (error.validation) {
			return reply.status(400).send({ error: error.message });
		}

		app.log.error(error);
		return reply
			.status(error.statusCode ?? 500)
			.send({ error: error.message ?? 'Internal server error' });
	},
);

app.get(
	'/v1/health',
	{
		schema: {
			tags: ['Health'],
			response: {
				200: {
					type: 'object',
					properties: {
						status: { type: 'string' },
						timestamp: { type: 'string', format: 'date-time' },
					},
				},
			},
		},
	},
	async () => {
		return { status: 'okay', timestamp: new Date().toISOString() };
	},
);

app.register(emailWorkerPlugin);
app.register(authRoutes, { prefix: '/v1/auth' });
app.register(patientRoutes, { prefix: '/v1/orgs' });
// app.register(orgRoutes, { prefix: '/v1/orgs' });
// app.register(carerRoutes, { prefix: '/v1/orgs' });
app.register(visitRoutes, { prefix: '/v1/orgs' });
app.register(carePlanRoutes, { prefix: '/v1/orgs' });
app.register(dailyNoteRoutes, { prefix: '/v1/orgs' });
app.register(incidentReportRoutes, { prefix: '/v1/orgs' });
app.register(auditRoutes, { prefix: '/v1/orgs' });

// start the server
const start = async () => {
	try {
		await app.listen({
			port: Number(process.env.PORT) || 3000,
			host: '0.0.0.0',
		});
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

// Only auto-start when run directly (not when imported by scripts)
const isDirectRun =
	import.meta.url === `file://${process.argv[1]}` ||
	process.argv[1]?.endsWith('server.ts');
if (isDirectRun) {
	start();
}
