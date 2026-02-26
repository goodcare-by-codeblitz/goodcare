import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import 'dotenv/config';
import Fastify from 'fastify';
import { authRoutes } from './src/modules/auth/auth.routes';

export const app = Fastify({
	logger: true,
});



app.register(cookie, {
  secret: process.env.COOKIE_SECRET!, 
})

app.register(jwt, {
  secret: process.env.JWT_SECRET!,
})

app.get('/health', async () => {
	return { status: 'okay', timestamp: new Date().toISOString() };
});

app.register(authRoutes, { prefix: '/auth' });

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
