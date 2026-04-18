import '../src/test/setup';
import { afterEach, describe, expect, it } from 'vitest';
import { buildBaseAppUrl, buildOrgAppUrl } from './app-url';

describe('app URL helpers', () => {
	afterEach(() => {
		process.env.APP_BASE_DOMAIN = 'goodcare.local:3000';
		process.env.APP_PROTOCOL = 'http';
	});

	it('builds local org invite URLs from env config', () => {
		process.env.APP_BASE_DOMAIN = 'goodcare.local:3000';
		process.env.APP_PROTOCOL = 'http';

		expect(
			buildOrgAppUrl('acme-care', '/invite/accept?token=test-token'),
		).toBe(
			'http://acme-care.goodcare.local:3000/invite/accept?token=test-token',
		);
	});

	it('builds production org URLs with https', () => {
		process.env.APP_BASE_DOMAIN = 'goodcarepro.co.uk';
		process.env.APP_PROTOCOL = 'https';

		expect(buildOrgAppUrl('orchard', '/dashboard')).toBe(
			'https://orchard.goodcarepro.co.uk/dashboard',
		);
	});

	it('builds base app URLs from the same config source', () => {
		process.env.APP_BASE_DOMAIN = 'goodcare.local:3000';
		process.env.APP_PROTOCOL = 'http';

		expect(buildBaseAppUrl('/reset-password?token=abc123')).toBe(
			'http://goodcare.local:3000/reset-password?token=abc123',
		);
	});
});

