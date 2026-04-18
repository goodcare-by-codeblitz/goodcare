import '../test/setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	sendEmail: vi.fn(),
}));

vi.mock('../../utils/send-email.js', () => ({
	sendEmail: mocks.sendEmail,
}));

import { processEmailJob } from './email-worker';

describe('processEmailJob', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.APP_BASE_DOMAIN = 'goodcare.local:3000';
		process.env.APP_PROTOCOL = 'http';
	});

	it('sends invitation emails to the env-driven org app host', async () => {
		await processEmailJob({
			data: {
				type: 'invitation',
				to: 'invitee@example.com',
				firstName: 'Alex',
				organizationName: 'Acme Care',
				slug: 'acme-care',
				inviteToken: 'token-123',
			},
		} as any);

		expect(mocks.sendEmail).toHaveBeenCalledWith(
			'invitee@example.com',
			"You've been invited to Acme Care on GoodCare",
			expect.stringContaining(
				'http://acme-care.goodcare.local:3000/invite/accept?token=token-123',
			),
		);
		expect(mocks.sendEmail.mock.calls[0]?.[2]).not.toContain('goodcarepro.co.uk');
	});

	it('sends password reset emails from the env-driven base host', async () => {
		const expiresAt = new Date('2026-04-18T12:00:00.000Z');

		await processEmailJob({
			data: {
				type: 'password_reset',
				to: 'invitee@example.com',
				resetToken: 'reset-123',
				expiresAt,
			},
		} as any);

		expect(mocks.sendEmail).toHaveBeenCalledWith(
			'invitee@example.com',
			'Reset your GoodCare password',
			expect.stringContaining(
				'http://goodcare.local:3000/reset-password?token=reset-123',
			),
		);
		expect(mocks.sendEmail.mock.calls[0]?.[2]).not.toContain('app.goodcarepro.co.uk');
	});
});

