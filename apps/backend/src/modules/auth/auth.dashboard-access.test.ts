import '../../test/setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	userFindUnique: vi.fn(),
	organizationUserFindMany: vi.fn(),
	roleAssignmentFindMany: vi.fn(),
	sessionCreate: vi.fn(),
}));

vi.mock('@repo/db', () => ({
	prisma: {
		user: {
			findUnique: mocks.userFindUnique,
		},
		organizationUser: {
			findMany: mocks.organizationUserFindMany,
		},
		roleAssignment: {
			findMany: mocks.roleAssignmentFindMany,
		},
		session: {
			create: mocks.sessionCreate,
		},
	},
}));

vi.mock('@repo/helpers', () => ({
	hashPassword: vi.fn(),
	verifyPassword: vi.fn().mockResolvedValue(true),
}));

import { myOrganizationsService, loginService } from './auth.service';

describe('dashboard access filtering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('blocks carer-only accounts from logging into the dashboard', async () => {
		mocks.userFindUnique.mockResolvedValue({
			id: 'user-1',
			email: 'carer@example.com',
			passwordHash: 'hashed-password',
			organizationUsers: [{ id: 'org-user-1' }],
		});
		mocks.organizationUserFindMany.mockResolvedValue([
			{
				organizationId: 'org-1',
				organization: {
					id: 'org-1',
					slug: 'great-care',
					name: 'Great Care',
				},
			},
		]);
		mocks.roleAssignmentFindMany.mockResolvedValue([]);

		await expect(
			loginService({
				email: 'carer@example.com',
				password: 'password123',
				session: {
					sessionId: 'session-1',
					tokenHash: 'token-hash',
					expiresAt: new Date(Date.now() + 60_000),
					userAgent: null,
					ip: '127.0.0.1',
				},
			}),
		).rejects.toMatchObject({
			details: {
				reason: 'CARER_DASHBOARD_ACCESS_NOT_ALLOWED',
			},
		});

		expect(mocks.sessionCreate).not.toHaveBeenCalled();
	});

	it('returns only team-capable organizations for dashboard selection', async () => {
		mocks.organizationUserFindMany.mockResolvedValue([
			{
				organizationId: 'org-1',
				organization: {
					id: 'org-1',
					slug: 'great-care',
					name: 'Great Care',
				},
			},
			{
				organizationId: 'org-2',
				organization: {
					id: 'org-2',
					slug: 'carer-only-care',
					name: 'Carer Only Care',
				},
			},
		]);
		mocks.roleAssignmentFindMany.mockResolvedValue([
			{ organizationId: 'org-1' },
		]);

		await expect(myOrganizationsService('user-1')).resolves.toEqual([
			{
				organization: {
					id: 'org-1',
					slug: 'great-care',
					name: 'Great Care',
				},
			},
		]);
	});
});
