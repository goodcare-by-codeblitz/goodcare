import '@fastify/jwt';
import crypto from "crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ACCESS_TTL, REFRESH_DAYS, refreshExpiryDate, setAuthCookies } from '../../../utils/cookies';
import { hashToken } from '../../../utils/token-hash';
import { loginService, logoutService, registerService } from "./auth.service";
import type { LoginBody, RegisterBody } from "./auth.types";

export function registerController(app: FastifyInstance) {
  return async function handler(
    request: FastifyRequest<{ Body: RegisterBody }>,
    reply: FastifyReply
  ) {
    const body = request.body;

    try {
      const sessionId = crypto.randomUUID();
      const refreshToken = app.jwt.sign(
        { sid: sessionId, type: 'refresh' },
        { expiresIn: `${REFRESH_DAYS}d` }
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
        slug: body.slug,
        session: { sessionId, tokenHash, expiresAt, userAgent, ip },
      });
      
      if (!result) {
        return reply.status(400).send({
          error: "Registration failed",
        });
      }

      const accessToken = app.jwt.sign(
          { sub: result.userId, email: result.email, type: 'access' },
          { expiresIn: ACCESS_TTL }
        )

      setAuthCookies(reply, { accessToken, refreshToken })
      
      return reply.send({
        message: "Registration successful",
        email: body.email.toLowerCase().trim(),
        organizationName: body.organizationName,
        slug: result.chosenSlug,
        refreshToken,
      });
    } catch (err: any) {
      app.log.error({ err }, "register failed");

      // keep it simple; upgrade later to typed errors
      return reply.status(400).send({
        error: err?.message ?? "Registration failed",
      });
    }
  };
}

export function loginController(app: FastifyInstance) {
  return async function handler(
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply
  ) {
    const body = request.body;
    try {
      const sessionId = crypto.randomUUID();
      const refreshToken = app.jwt.sign(
        { sid: sessionId, type: 'refresh' },
        { expiresIn: `${REFRESH_DAYS}d` }
      );
      const tokenHash = hashToken(refreshToken);

      const expiresAt = refreshExpiryDate();
      const ip = request.ip;
      const userAgent = request.headers['user-agent'] ?? null;

      const result = await loginService({
        email: body.email,
        password: body.password,
        session: { sessionId, tokenHash, expiresAt, userAgent, ip },
      });
      
      const accessToken = app.jwt.sign(
          { sub: result.userId, email: result.email, type: 'access' },
          { expiresIn: ACCESS_TTL }
        )

      setAuthCookies(reply, { accessToken, refreshToken })
      
      return reply.send({
        message: "Login successful",
        email: body.email.toLowerCase().trim(),
        organization: result.organization,
        refreshToken,
      });
    } catch (error) {
      app.log.error({ error }, "login failed");
      return reply.status(400).send({
        error: error ?? "Login failed",
      }); 
    }
  };
}

export function logoutController(app: FastifyInstance) {
  return async function handler(
    request: FastifyRequest,
    reply: FastifyReply
  ) {

    const token = request.cookies.access_token;
    if (!token) {
      return reply.status(401).send({ error: "No access token provided" });
    }

    const decoded = app.jwt.decode<{ sub: string; email: string; type: string }>(token);
    if (!decoded || decoded.type !== 'access' || !decoded.sub) {
      return reply.status(401).send({ error: "Invalid token" });
    }

    await logoutService(decoded.sub);

    reply.clearCookie('access_token', { path: '/' });
    reply.clearCookie('refresh_token', { path: '/auth/refresh' });

    return reply.send({ message: "Logged out successfully" });
  };
}
