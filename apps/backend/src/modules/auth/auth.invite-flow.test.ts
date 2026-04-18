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

import {
	acceptInviteService,
	getInvitePreviewService,
} from './auth.service';

function createInviteToken(overrides?: Record<string, unknown>) {
	return {
		id: 'invite-1',
		email: 'invitee@example.com',
		kind: 'TEAM',
		inviteeFirstName: 'Invitee',
		inviteeLastName: 'Person',
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
			leftAt: new Date('2026-04-17T10:00:00.000Z'),
			carer: null,
			user: {
				id: 'user-1',
				email: 'invitee@example.com',
				passwordHash: 'existing-hash',
			},
		},
		roles: [],
		...overrides,
	};
}

describe('invite flow auth state', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) =>
			callback({
				user: { update: txMocks.userUpdate },
				roleAssignment: {
					deleteMany: txMocks.roleAssignmentDeleteMany,
					createMany: txMocks.roleAssignmentCreateMany,
				},
				organizationUser: { update: txMocks.organizationUserUpdate },
				carer: {
					findUnique: txMocks.carerFindUnique,
					create: txMocks.carerCreate,
					update: txMocks.carerUpdate,
				},
				inviteToken: {
					updateMany: txMocks.inviteTokenUpdateMany,
					update: txMocks.inviteTokenUpdate,
				},
				session: { create: txMocks.sessionCreate },
			}),
		);
		txMocks.userUpdate.mockResolvedValue({
			id: 'user-1',
			email: 'invitee@example.com',
		});
		txMocks.carerFindUnique.mockResolvedValue(null);
	});

	it('marks preview as signed_in_match when the invited user is already signed in', async () => {
		mocks.inviteTokenFindUnique.mockResolvedValue(createInviteToken());

		await expect(
			getInvitePreviewService('raw-token', {
				id: 'user-1',
				email: 'invitee@example.com',
			}),
		).resolves.toMatchObject({
			acceptanceMode: 'signed_in_match',
			inviteState: 'pending',
			currentSessionUser: {
				id: 'user-1',
				email: 'invitee@example.com',
			},
			wasFormerMember: true,
		});
	});

	it('marks preview as signed_in_mismatch when a different user is signed in', async () => {
		mocks.inviteTokenFindUnique.mockResolvedValue(createInviteToken());

		await expect(
			getInvitePreviewService('raw-token', {
				id: 'user-2',
				email: 'other@example.com',
			}),
		).resolves.toMatchObject({
			acceptanceMode: 'signed_in_mismatch',
			inviteState: 'pending',
			currentSessionUser: {
				id: 'user-2',
				email: 'other@example.com',
			},
		});
	});

	it('rejects invite acceptance when a different user is signed in', async () => {
		mocks.inviteTokenFindUnique.mockResolvedValue(createInviteToken());

		await expect(
			acceptInviteService({
				token: 'raw-token',
				currentUserId: 'user-2',
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
				reason: 'SIGNED_IN_AS_DIFFERENT_USER',
			},
		});
	});

	it('keeps carer preview session-neutral even when another user is signed in', async () => {
		mocks.inviteTokenFindUnique.mockResolvedValue(
			createInviteToken({
				kind: 'CARER',
				email: 'carer@example.com',
			}),
		);

		await expect(
			getInvitePreviewService('raw-token', {
				id: 'user-2',
				email: 'other@example.com',
			}),
		).resolves.toMatchObject({
			kind: 'CARER',
			acceptanceMode: 'existing_user_login_required',
			inviteState: 'pending',
			currentSessionUser: {
				id: 'user-2',
				email: 'other@example.com',
			},
		});
	});

	it('allows a carer invite to be accepted without a matching signed-in user', async () => {
		mocks.inviteTokenFindUnique.mockResolvedValue(
			createInviteToken({
				kind: 'CARER',
				email: 'carer@example.com',
			}),
		);

		await expect(
			acceptInviteService({
				token: 'raw-token',
				currentUserId: 'user-2',
				session: {
					sessionId: 'session-1',
					tokenHash: 'token-hash',
					expiresAt: new Date(Date.now() + 60_000),
					userAgent: null,
					ip: '127.0.0.1',
				},
			}),
		).resolves.toMatchObject({
			inviteKind: 'CARER',
			setAuthSession: false,
			nextStep: 'carer_app_download',
			inviteState: 'accepted',
		});
	});

	it('treats an already accepted carer invite as a terminal accepted preview state', async () => {
		mocks.inviteTokenFindUnique.mockResolvedValue(
			createInviteToken({
				kind: 'CARER',
				email: 'carer@example.com',
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
						passwordHash: 'existing-hash',
					},
				},
			}),
		);

		await expect(getInvitePreviewService('raw-token')).resolves.toMatchObject({
			kind: 'CARER',
			inviteState: 'accepted',
			membershipStatus: 'ACTIVE',
		});
	});

	it('treats an already accepted carer invite as a successful accept result', async () => {
		mocks.inviteTokenFindUnique.mockResolvedValue(
			createInviteToken({
				kind: 'CARER',
				email: 'carer@example.com',
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
						passwordHash: 'existing-hash',
					},
				},
			}),
		);

		await expect(
			acceptInviteService({
				token: 'raw-token',
				currentUserId: 'user-2',
				session: {
					sessionId: 'session-1',
					tokenHash: 'token-hash',
					expiresAt: new Date(Date.now() + 60_000),
					userAgent: null,
					ip: '127.0.0.1',
				},
			}),
		).resolves.toMatchObject({
			inviteKind: 'CARER',
			nextStep: 'carer_app_download',
			inviteState: 'accepted',
			setAuthSession: false,
		});

		expect(mocks.transaction).not.toHaveBeenCalled();
	});
});
