// apps/web/middleware.ts
import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const encoder = new TextEncoder();
const secret = encoder.encode(process.env.JWT_SECRET ?? '');

async function isValidAccessToken(token: string | undefined) {
	if (!token || !process.env.JWT_SECRET) return false;
	try {
		await jwtVerify(token, secret); // HS256 by default from fastify-jwt
		return true;
	} catch {
		return false;
	}
}

export async function middleware(req: NextRequest) {
	const accessToken = req.cookies.get('access_token')?.value;
	const isLoginRoute = req.nextUrl.pathname.startsWith('/login');
	const isDashboardRoute = req.nextUrl.pathname.startsWith('/dashboard');

	const valid = await isValidAccessToken(accessToken);
	if (isLoginRoute && valid) {
		const url = req.nextUrl.clone();
		url.pathname = '/dashboard';
		return NextResponse.redirect(url);
	}

	if (isDashboardRoute && !valid) {
		const url = req.nextUrl.clone();
		url.pathname = '/login';
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/login', '/dashboard/:path*'],
};
