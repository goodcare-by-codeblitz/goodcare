import '../src/test/setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	clearAuthCookies,
	getAccessCookieOptions,
	getRefreshCookieOptions,
	setAuthCookies,
} from './cookies';

describe('auth cookies', () => {
	beforeEach(() => {
		delete process.env.COOKIE_DOMAIN;
	});

	it('sets access and refresh cookies with the shared options', () => {
		const reply = {
			setCookie: vi.fn(),
		} as any;

		setAuthCookies(reply, {
			accessToken: 'access-token',
			refreshToken: 'refresh-token',
		});

		expect(reply.setCookie).toHaveBeenCalledTimes(2);
		expect(reply.setCookie).toHaveBeenNthCalledWith(
			1,
			'access_token',
			'access-token',
			getAccessCookieOptions(),
		);
		expect(reply.setCookie).toHaveBeenNthCalledWith(
			2,
			'refresh_token',
			'refresh-token',
			getRefreshCookieOptions(),
		);
		expect(getRefreshCookieOptions().path).toBe('/');
	});

	it('clears both cookies with matching path and domain options', () => {
		process.env.COOKIE_DOMAIN = '.goodcare.local';

		const reply = {
			clearCookie: vi.fn(),
		} as any;

		clearAuthCookies(reply);

		expect(reply.clearCookie).toHaveBeenCalledTimes(2);
		expect(reply.clearCookie).toHaveBeenNthCalledWith(
			1,
			'access_token',
			getAccessCookieOptions(),
		);
		expect(reply.clearCookie).toHaveBeenNthCalledWith(
			2,
			'refresh_token',
			getRefreshCookieOptions(),
		);
		expect(getAccessCookieOptions().domain).toBe('.goodcare.local');
		expect(getRefreshCookieOptions().domain).toBe('.goodcare.local');
	});
});
