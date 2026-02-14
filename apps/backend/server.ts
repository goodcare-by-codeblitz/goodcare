import 'dotenv/config';
import Fastify from 'fastify';
import { registerRoutes } from './routes/auth/register.js';


export const app = Fastify({
	logger: true,
});

app.get('/health', async () => {
	return { status: 'okay', timestamp: new Date().toISOString() };
});

app.register(registerRoutes, { prefix: '/auth' });

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

start();
