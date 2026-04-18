import '../../test/setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hashToken } from '../../../utils/token-hash';

const mocks = vi.hoisted(() => ({
	findUnique: vi.fn(),
}));

vi.mock('@repo/db', () => ({
	prisma: {
		session: {
			findUnique: mocks.findUnique,
		},
	},
}));

import { refreshService } from './auth.service';

describe('refreshService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns the user when the refresh token matches an active session', async () => {
		const rawRefreshToken = 'refresh-token';
		mocks.findUnique.mockResolvedValue({
			id: 'session-record',
			userId: 'user-1',
			refreshTokenHash: hashToken(rawRefreshToken),
			expiresAt: new Date(Date.now() + 60_000),
			revokedAt: null,
			user: {
				id: 'user-1',
				email: 'carer@example.com',
				status: 'ACTIVE',
			},
		});

		await expect(refreshService('session-1', rawRefreshToken)).resolves.toEqual({
			userId: 'user-1',
			email: 'carer@example.com',
		});
	});

	it('rejects revoked or expired sessions', async () => {
		mocks.findUnique.mockResolvedValue({
			id: 'session-record',
			userId: 'user-1',
			refreshTokenHash: hashToken('refresh-token'),
			expiresAt: new Date(Date.now() - 1_000),
			revokedAt: null,
			user: {
				id: 'user-1',
				email: 'carer@example.com',
				status: 'ACTIVE',
			},
		});

		await expect(refreshService('session-1', 'refresh-token')).rejects.toThrow(
			'Invalid or expired session',
		);
	});

	it('rejects invalid refresh tokens', async () => {
		mocks.findUnique.mockResolvedValue({
			id: 'session-record',
			userId: 'user-1',
			refreshTokenHash: hashToken('expected-token'),
			expiresAt: new Date(Date.now() + 60_000),
			revokedAt: null,
			user: {
				id: 'user-1',
				email: 'carer@example.com',
				status: 'ACTIVE',
			},
		});

		await expect(refreshService('session-1', 'wrong-token')).rejects.toThrow(
			'Invalid refresh token',
		);
	});

	it('rejects inactive users', async () => {
		mocks.findUnique.mockResolvedValue({
			id: 'session-record',
			userId: 'user-1',
			refreshTokenHash: hashToken('refresh-token'),
			expiresAt: new Date(Date.now() + 60_000),
			revokedAt: null,
			user: {
				id: 'user-1',
				email: 'carer@example.com',
				status: 'SUSPENDED',
			},
		});

		await expect(refreshService('session-1', 'refresh-token')).rejects.toThrow(
			'User account is not active',
		);
	});
});
