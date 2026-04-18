// apps/web/middleware.ts
import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const encoder = new TextEncoder();
const secret = encoder.encode(process.env.JWT_SECRET ?? '');

async function isValidAccessToken(token: string | undefined) {
	if (!token || !process.env.JWT_SECRET) return false;
	try {
		await jwtVerify(token, secret);
		return true;
	} catch {
		return false;
	}
}

function getBackendBaseUrl() {
	return process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.replace(/\/+$/, '') ?? null;
}

async function tryRefreshSession(req: NextRequest) {
	const refreshToken = req.cookies.get('refresh_token')?.value;
	const backendBaseUrl = getBackendBaseUrl();
	if (!refreshToken || !backendBaseUrl) {
		return { valid: false, setCookie: null as string | null };
	}

	try {
		const response = await fetch(`${backendBaseUrl}/v1/auth/refresh`, {
			method: 'POST',
			headers: {
				cookie: req.headers.get('cookie') ?? '',
			},
			cache: 'no-store',
		});

		if (!response.ok) {
			return { valid: false, setCookie: null as string | null };
		}

		return {
			valid: true,
			setCookie: response.headers.get('set-cookie'),
		};
	} catch {
		return { valid: false, setCookie: null as string | null };
	}
}

function applyRefreshCookie(
	response: NextResponse,
	refreshSetCookie: string | null,
) {
	if (refreshSetCookie) {
		response.headers.append('set-cookie', refreshSetCookie);
	}

	return response;
}

function getHost(req: NextRequest) {
	return req.headers.get('host') ?? '';
}

function getBaseDomain() {
	const raw = process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ?? '';
	return raw.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function hasSubdomain(host: string, baseDomain: string) {
	if (!host || !baseDomain) return false;
	if (host === baseDomain) return false;
	return host.endsWith(`.${baseDomain}`);
}

export async function middleware(req: NextRequest) {
	const accessToken = req.cookies.get('access_token')?.value;
	let valid = await isValidAccessToken(accessToken);
	let refreshSetCookie: string | null = null;

	if (!valid) {
		const refreshResult = await tryRefreshSession(req);
		valid = refreshResult.valid;
		refreshSetCookie = refreshResult.setCookie;
	}

	const host = getHost(req);
	const baseDomain = getBaseDomain();
	const orgSubdomainPresent = hasSubdomain(host, baseDomain);

	const pathname = req.nextUrl.pathname;
	const isLoginRoute = pathname.startsWith('/login');
	const isDashboardRoute = pathname.startsWith('/dashboard');
	const isSelectOrgRoute = pathname.startsWith('/select-org');

	// If no subdomain, force users away from org-only routes
	if (!orgSubdomainPresent && isDashboardRoute) {
		const url = req.nextUrl.clone();
		url.pathname = valid ? '/select-org' : '/login';
		return applyRefreshCookie(NextResponse.redirect(url), refreshSetCookie);
	}

	// If subdomain exists, skip org selection
	if (orgSubdomainPresent && isSelectOrgRoute) {
		const url = req.nextUrl.clone();
		url.pathname = '/dashboard';
		return applyRefreshCookie(NextResponse.redirect(url), refreshSetCookie);
	}

	// Standard auth gating
	if (isLoginRoute && valid) {
		const url = req.nextUrl.clone();
		url.pathname = '/dashboard';
		return applyRefreshCookie(NextResponse.redirect(url), refreshSetCookie);
	}

	if (isSelectOrgRoute && !orgSubdomainPresent && !valid) {
		const url = req.nextUrl.clone();
		url.pathname = '/login';
		return applyRefreshCookie(NextResponse.redirect(url), refreshSetCookie);
	}

	if (isDashboardRoute && !valid) {
		const url = req.nextUrl.clone();
		url.pathname = '/login';
		return applyRefreshCookie(NextResponse.redirect(url), refreshSetCookie);
	}

	return applyRefreshCookie(NextResponse.next(), refreshSetCookie);
}

export const config = {
	matcher: ['/login', '/dashboard/:path*', '/select-org'],
};
