import '../../test/setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_TTL } from '../../../utils/cookies';

const mocks = vi.hoisted(() => ({
	acceptInviteService: vi.fn(),
	loginService: vi.fn(),
	refreshService: vi.fn(),
	logoutService: vi.fn(),
	changePasswordService: vi.fn(),
	resetPasswordService: vi.fn(),
	resolveOrganizationFromRequest: vi.fn(),
}));

vi.mock('@repo/db', () => ({
	prisma: {
		roleAssignment: {
			findMany: vi.fn(),
		},
	},
}));

vi.mock('../../jobs/email-queue', () => ({
	enqueuePasswordResetEmail: vi.fn(),
	enqueueWelcomeEmail: vi.fn(),
}));

vi.mock('../../lib/audit', () => ({
	logAudit: vi.fn(),
}));

vi.mock('../../../utils/org-resolver', () => ({
	resolveOrganizationFromRequest: mocks.resolveOrganizationFromRequest,
}));

vi.mock('./auth.service', () => ({
	acceptInviteService: mocks.acceptInviteService,
	changePasswordService: mocks.changePasswordService,
	forgotPasswordService: vi.fn(),
	loginService: mocks.loginService,
	logoutService: mocks.logoutService,
	myOrganizationsService: vi.fn(),
	resetPasswordService: mocks.resetPasswordService,
	refreshService: mocks.refreshService,
	registerService: vi.fn(),
}));

import {
	acceptInviteController,
	changePasswordController,
	currentOrgAccessController,
	loginController,
	logoutController,
	resetPasswordController,
	refreshController,
} from './auth.controller';

function createReply() {
	const reply = {
		setCookie: vi.fn(),
		clearCookie: vi.fn(),
		status: vi.fn(),
		send: vi.fn(),
	};

	reply.status.mockReturnValue(reply);
	reply.send.mockReturnValue(reply);

	return reply;
}

function createApp() {
	return {
		jwt: {
			sign: vi.fn((payload: { type: string }) =>
				payload.type === 'refresh' ? 'refresh-token' : 'access-token',
			),
			verify: vi.fn(),
		},
		log: {
			error: vi.fn(),
		},
	} as any;
}

describe('auth controllers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.resolveOrganizationFromRequest.mockResolvedValue(null);
	});

	it('loginController sets both auth cookies on successful login', async () => {
		const app = createApp();
		const reply = createReply();
		mocks.loginService.mockResolvedValue({
			userId: 'user-1',
			email: 'carer@example.com',
			organizations: [],
		});

		await loginController(app)(
			{
				body: { email: 'carer@example.com', password: 'password123' },
				ip: '127.0.0.1',
				headers: {},
			} as any,
			reply as any,
		);

		expect(app.jwt.sign).toHaveBeenCalledWith(
			{ sub: 'user-1', email: 'carer@example.com', type: 'access' },
			{ expiresIn: ACCESS_TTL },
		);
		expect(reply.setCookie).toHaveBeenCalledTimes(2);
		expect(reply.setCookie).toHaveBeenNthCalledWith(
			1,
			'access_token',
			'access-token',
			expect.objectContaining({ path: '/' }),
		);
		expect(reply.setCookie).toHaveBeenNthCalledWith(
			2,
			'refresh_token',
			'refresh-token',
			expect.objectContaining({ path: '/' }),
		);
	});

	it('refreshController rewrites the access cookie with the shared options', async () => {
		const app = createApp();
		const reply = createReply();
		app.jwt.verify.mockReturnValue({ sid: 'session-1', type: 'refresh' });
		mocks.refreshService.mockResolvedValue({
			userId: 'user-1',
			email: 'carer@example.com',
		});

		await refreshController(app)(
			{
				cookies: { refresh_token: 'refresh-token' },
			} as any,
			reply as any,
		);

		expect(reply.setCookie).toHaveBeenCalledTimes(1);
		expect(reply.setCookie).toHaveBeenCalledWith(
			'access_token',
			'access-token',
			expect.objectContaining({ path: '/' }),
		);
	});

	it('logoutController clears both auth cookies with the shared path', async () => {
		const app = createApp();
		const reply = createReply();
		app.jwt.verify.mockReturnValue({
			sub: 'user-1',
			email: 'carer@example.com',
			type: 'access',
		});

		await logoutController(app)(
			{
				cookies: { access_token: 'access-token' },
				headers: {},
				ip: '127.0.0.1',
			} as any,
			reply as any,
		);

		expect(mocks.logoutService).toHaveBeenCalledWith('user-1');
		expect(reply.clearCookie).toHaveBeenCalledTimes(2);
		expect(reply.clearCookie).toHaveBeenNthCalledWith(
			1,
			'access_token',
			expect.objectContaining({ path: '/' }),
		);
		expect(reply.clearCookie).toHaveBeenNthCalledWith(
			2,
			'refresh_token',
			expect.objectContaining({ path: '/' }),
		);
	});

	it('changePasswordController clears both cookies after a successful password change', async () => {
		const app = createApp();
		const reply = createReply();

		await changePasswordController(app)(
			{
				body: {
					currentPassword: 'old-password',
					newPassword: 'new-password',
				},
				user: { id: 'user-1' },
				headers: {},
				ip: '127.0.0.1',
			} as any,
			reply as any,
		);

		expect(mocks.changePasswordService).toHaveBeenCalledWith({
			userId: 'user-1',
			currentPassword: 'old-password',
			newPassword: 'new-password',
		});
		expect(reply.clearCookie).toHaveBeenCalledTimes(2);
		expect(reply.clearCookie).toHaveBeenNthCalledWith(
			1,
			'access_token',
			expect.objectContaining({ path: '/' }),
		);
		expect(reply.clearCookie).toHaveBeenNthCalledWith(
			2,
			'refresh_token',
			expect.objectContaining({ path: '/' }),
		);
	});

	it('resetPasswordController signs the user in after a successful password reset', async () => {
		const app = createApp();
		const reply = createReply();
		mocks.resetPasswordService.mockResolvedValue({
			userId: 'user-1',
			email: 'carer@example.com',
		});

		await resetPasswordController(app)(
			{
				body: {
					token: 'reset-token',
					newPassword: 'new-password-123',
				},
				headers: {},
				ip: '127.0.0.1',
			} as any,
			reply as any,
		);

		expect(mocks.resetPasswordService).toHaveBeenCalledWith(
			expect.objectContaining({
				token: 'reset-token',
				newPassword: 'new-password-123',
			}),
		);
		expect(reply.setCookie).toHaveBeenCalledTimes(2);
		expect(reply.send).toHaveBeenCalledWith({
			message: 'Password reset successfully',
			email: 'carer@example.com',
		});
	});

	it('currentOrgAccessController marks carer-only memberships as unauthorized', async () => {
		const reply = createReply();
		mocks.resolveOrganizationFromRequest.mockResolvedValue({
			id: 'org-1',
			slug: 'great-care',
			name: 'Great Care',
			organizationUser: {
				status: 'ACTIVE',
			},
		});

		const { prisma } = await import('@repo/db');
		(prisma.roleAssignment.findMany as any).mockResolvedValue([
			{
				role: {
					name: 'Caregiver',
					scope: 'ORGANIZATION',
					organizationRoleKind: 'CARER',
					permissions: [],
				},
			},
		]);

		await currentOrgAccessController()(
			{
				user: { id: 'user-1' },
				headers: {
					'x-org-slug': 'great-care',
				},
			} as any,
			reply as any,
		);

		expect(reply.send).toHaveBeenCalledWith({
			authorized: false,
			organizationId: null,
			organizationSlug: null,
			organizationName: null,
			permissions: [],
			reason: 'CARER_ONLY_ACCOUNT',
		});
	});

	it('acceptInviteController does not rewrite auth cookies for carer invite acceptance', async () => {
		const app = createApp();
		const reply = createReply();
		mocks.acceptInviteService.mockResolvedValue({
			userId: 'user-1',
			email: 'carer@example.com',
			organization: {
				id: 'org-1',
				slug: 'great-care',
				name: 'Great Care',
			},
			inviteKind: 'CARER',
			setAuthSession: false,
			nextStep: 'carer_app_download',
			inviteState: 'accepted',
		});

		await acceptInviteController(app)(
			{
				body: { token: 'invite-token' },
				cookies: {},
				headers: {},
				ip: '127.0.0.1',
			} as any,
			reply as any,
		);

		expect(reply.setCookie).not.toHaveBeenCalled();
		expect(reply.send).toHaveBeenCalledWith({
			message: 'Invitation accepted successfully',
			email: 'carer@example.com',
			organization: {
				id: 'org-1',
				slug: 'great-care',
				name: 'Great Care',
			},
			inviteKind: 'CARER',
			nextStep: 'carer_app_download',
			inviteState: 'accepted',
		});
	});
});
