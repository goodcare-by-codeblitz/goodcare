import '../../test/setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	inviteTokenFindUnique: vi.fn(),
	transaction: vi.fn(),
}));

const txMocks = vi.hoisted(() => ({
	userUpdate: vi.fn(),
	roleAssignmentDeleteMany: vi.fn(),
	roleAssignmentCreateMany: vi.fn(),
	organizationUserUpdate: vi.fn(),
	carerFindUnique: vi.fn(),
	carerCreate: vi.fn(),
	carerUpdate: vi.fn(),
	inviteTokenUpdateMany: vi.fn(),
	inviteTokenUpdate: vi.fn(),
	sessionCreate: vi.fn(),
}));

vi.mock('@repo/db', () => ({
	prisma: {
		inviteToken: {
			findUnique: mocks.inviteTokenFindUnique,
		},
		$transaction: mocks.transaction,
	},
}));

vi.mock('@repo/helpers', () => ({
	hashPassword: vi.fn(),
	verifyPassword: vi.fn(),
}));

import { acceptInviteService } from './auth.service';

function createInviteToken(overrides?: Record<string, unknown>) {
	return {
		id: 'invite-1',
		email: 'carer@example.com',
		kind: 'CARER',
		inviteeFirstName: 'Carer',
		inviteeLastName: 'Member',
		expiresAt: new Date(Date.now() + 60_000),
		usedAt: null,
		revokedAt: null,
		organization: {
			id: 'org-1',
			slug: 'great-care',
			name: 'Great Care',
		},
		organizationUser: {
			id: 'org-user-1',
			userId: 'user-1',
			status: 'INVITED',
			leftAt: null,
			carer: null,
			user: {
				id: 'user-1',
				email: 'carer@example.com',
				passwordHash: 'existing-password',
			},
		},
		roles: [
			{
				role: {
					id: 'role-carer',
					key: 'org_caregiver',
					name: 'Caregiver',
					description: null,
					isSystem: true,
					organizationId: null,
					permissions: [],
				},
			},
		],
		...overrides,
	};
}

function createTransactionContext() {
	return {
		user: {
			update: txMocks.userUpdate,
		},
		roleAssignment: {
			deleteMany: txMocks.roleAssignmentDeleteMany,
			createMany: txMocks.roleAssignmentCreateMany,
		},
		organizationUser: {
			update: txMocks.organizationUserUpdate,
		},
		carer: {
			findUnique: txMocks.carerFindUnique,
			create: txMocks.carerCreate,
			update: txMocks.carerUpdate,
		},
		inviteToken: {
			updateMany: txMocks.inviteTokenUpdateMany,
			update: txMocks.inviteTokenUpdate,
		},
		session: {
			create: txMocks.sessionCreate,
		},
	};
}

describe('carer invite acceptance', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) =>
			callback(createTransactionContext()),
		);
		txMocks.userUpdate.mockResolvedValue({
			id: 'user-1',
			email: 'carer@example.com',
		});
		txMocks.carerFindUnique.mockResolvedValue(null);
	});

	it('creates a minimal carer record when a carer invite is accepted', async () => {
		mocks.inviteTokenFindUnique.mockResolvedValue(createInviteToken());

		await expect(
			acceptInviteService({
				token: 'raw-token',
				session: {
					sessionId: 'session-1',
					tokenHash: 'token-hash',
					expiresAt: new Date(Date.now() + 60_000),
					userAgent: null,
					ip: '127.0.0.1',
				},
			}),
		).resolves.toMatchObject({
			userId: 'user-1',
			email: 'carer@example.com',
			inviteKind: 'CARER',
			setAuthSession: false,
			nextStep: 'carer_app_download',
			inviteState: 'accepted',
		});

		expect(txMocks.carerCreate).toHaveBeenCalledWith({
			data: expect.objectContaining({
				organizationId: 'org-1',
				organizationUserId: 'org-user-1',
				employmentType: 'Pending',
				experienceYears: 0,
			}),
		});
		expect(txMocks.inviteTokenUpdate).toHaveBeenCalled();
		expect(txMocks.sessionCreate).not.toHaveBeenCalled();
	});

	it('reuses an existing carer record instead of creating a duplicate', async () => {
		mocks.inviteTokenFindUnique.mockResolvedValue(createInviteToken());
		txMocks.carerFindUnique.mockResolvedValue({
			id: 'carer-1',
			status: 'TERMINATED',
		});

		await acceptInviteService({
			token: 'raw-token',
			session: {
				sessionId: 'session-1',
				tokenHash: 'token-hash',
				expiresAt: new Date(Date.now() + 60_000),
				userAgent: null,
				ip: '127.0.0.1',
			},
		});

		expect(txMocks.carerCreate).not.toHaveBeenCalled();
		expect(txMocks.carerUpdate).toHaveBeenCalledWith({
			where: { id: 'carer-1' },
			data: { status: 'ACTIVE' },
		});
		expect(txMocks.sessionCreate).not.toHaveBeenCalled();
	});

	it('returns terminal success for an already accepted carer invite', async () => {
		mocks.inviteTokenFindUnique.mockResolvedValue(
			createInviteToken({
				usedAt: new Date('2026-04-18T09:00:00.000Z'),
				organizationUser: {
					id: 'org-user-1',
					userId: 'user-1',
					status: 'ACTIVE',
					leftAt: null,
					carer: { id: 'carer-1' },
					user: {
						id: 'user-1',
						email: 'carer@example.com',
						passwordHash: 'existing-password',
					},
				},
			}),
		);

		await expect(
			acceptInviteService({
				token: 'raw-token',
				session: {
					sessionId: 'session-1',
					tokenHash: 'token-hash',
					expiresAt: new Date(Date.now() + 60_000),
					userAgent: null,
					ip: '127.0.0.1',
				},
			}),
		).resolves.toMatchObject({
			userId: 'user-1',
			email: 'carer@example.com',
			inviteKind: 'CARER',
			setAuthSession: false,
			nextStep: 'carer_app_download',
			inviteState: 'accepted',
		});

		expect(mocks.transaction).not.toHaveBeenCalled();
		expect(txMocks.carerCreate).not.toHaveBeenCalled();
		expect(txMocks.carerUpdate).not.toHaveBeenCalled();
	});
});
