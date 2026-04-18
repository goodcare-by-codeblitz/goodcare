import '@fastify/cookie';
import type { FastifyReply } from 'fastify';

export const ACCESS_TTL = '10m';
export const REFRESH_DAYS = 30;
export const ACCESS_COOKIE_NAME = 'access_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';
export const ACCESS_COOKIE_PATH = '/';
export const REFRESH_COOKIE_PATH = '/';

interface IAuthTokens {
	accessToken: string;
	refreshToken: string;
}

export function getCookieDomain() {
	return process.env.COOKIE_DOMAIN;
}

export function refreshExpiryDate() {
	const d = new Date();
	d.setDate(d.getDate() + REFRESH_DAYS);
	return d;
}

function getBaseCookieOptions() {
	return {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax' as const,
	};
}

export function getAccessCookieOptions() {
	const cookieDomain = getCookieDomain();

	return {
		...getBaseCookieOptions(),
		path: ACCESS_COOKIE_PATH,
		...(cookieDomain ? { domain: cookieDomain } : {}),
	};
}

export function getRefreshCookieOptions() {
	const cookieDomain = getCookieDomain();

	return {
		...getBaseCookieOptions(),
		path: REFRESH_COOKIE_PATH,
		...(cookieDomain ? { domain: cookieDomain } : {}),
	};
}

export function setAccessTokenCookie(reply: FastifyReply, accessToken: string) {
	reply.setCookie(ACCESS_COOKIE_NAME, accessToken, getAccessCookieOptions());
}

export function setRefreshTokenCookie(
	reply: FastifyReply,
	refreshToken: string,
) {
	reply.setCookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

export function setAuthCookies(
	reply: FastifyReply,
	{ accessToken, refreshToken }: IAuthTokens,
) {
	setAccessTokenCookie(reply, accessToken);
	setRefreshTokenCookie(reply, refreshToken);
}

export function clearAuthCookies(reply: FastifyReply) {
	reply.clearCookie(ACCESS_COOKIE_NAME, getAccessCookieOptions());
	reply.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
}
