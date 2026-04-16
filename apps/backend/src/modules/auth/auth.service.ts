import '@fastify/jwt';
import { prisma } from '@repo/db';
import { hashPassword, verifyPassword } from '@repo/helpers';
import crypto from 'crypto';
import { generateSlug } from '../../../utils/generate-slug';
import { hashToken, verifyTokenHash } from '../../../utils/token-hash';
import { BadRequestError, ConflictError } from '../../lib/errors';
import type {
	AcceptInviteInput,
	AcceptInviteResult,
	ChangePasswordInput,
	ForgotPasswordInput,
	ForgotPasswordResult,
	LoginInput,
	LoginResult,
	RefreshResult,
	RegisterInput,
	RegisterResult,
} from './auth.types';

export async function registerService(
	input: RegisterInput,
): Promise<RegisterResult> {
	const email = input.email.toLowerCase().trim();

	const baseSlug = generateSlug(input.organizationName);
	const chosenSlug = generateSlug(input.slug ?? baseSlug);

	const superUserEnv = process.env.PLATFORM_SUPERUSER_EMAIL;

	if (!superUserEnv) {
		throw new Error('PLATFORM_SUPERUSER_EMAIL environment variable is not set');
	}
	const superUserEmail = superUserEnv.toLowerCase().trim();

	const superUser = await prisma.user.findFirst({
		where: { email: superUserEmail },
		select: { id: true },
	});

	if (!superUser) {
		throw new Error(
			`Super user with email ${superUserEmail} not found. Please ensure the super user is created before allowing registrations.`,
		);
	}

	try {
		const result = await prisma.$transaction(async (tx) => {
			//TODO: consider using the Debounced Effect to check slug availability on the client side and then relying on the DB unique constraint to handle race conditions
			const existingOrg = await tx.organization.findUnique({
				where: { slug: chosenSlug },
				select: { id: true },
			});

			if (existingOrg) {
				throw new ConflictError('Organization slug is already in use.', {
					reason: 'SLUG_IN_USE',
					code: 'SLUG_IN_USE',
					statusCode: 409,
				});
			}
			// create org first - rely on DB unique constraint on slug
			const organization = await tx.organization.create({
				data: { name: input.organizationName, slug: chosenSlug },
				select: { id: true, slug: true },
			});

			const hashedPassword = await hashPassword(input.password);

			const user = await tx.user.upsert({
				where: { email },
				update: { passwordHash: hashedPassword },
				create: {
					email,
					passwordHash: hashedPassword,
					firstName: input.firstName,
					lastName: input.lastName,
				},
				select: { id: true, email: true },
			});

			const adminRole = await tx.role.findFirst({
				where: { name: 'Admin', scope: 'ORGANIZATION' },
				select: { id: true },
			});

			if (!adminRole) throw new Error('Admin role not found');

			await tx.roleAssignment.create({
				data: {
					userId: user.id,
					roleId: adminRole.id,
					organizationId: organization.id,
				},
			});

			await tx.organizationUser.create({
				data: {
					organizationId: organization.id,
					userId: user.id,
					status: 'ACTIVE',
					invitedById: superUser.id!,
					joinedAt: new Date(),
				},
			});

			await tx.session.create({
				data: {
					sessionId: input.session.sessionId,
					userId: user.id,
					refreshTokenHash: input.session.tokenHash,
					expiresAt: input.session.expiresAt,
					userAgent: input.session.userAgent,
					ip: input.session.ip,
				},
			});

			return {
				organizationId: organization.id,
				userId: user.id,
				email: user.email,
				chosenSlug: organization.slug,
			};
		});

		return result;
	} catch (e) {
		return Promise.reject(e);
	}
}

export async function loginService(input: LoginInput): Promise<LoginResult> {
	const email = input.email.toLowerCase().trim();

	const user = await prisma.user.findUnique({
		where: { email },
		select: {
			id: true,
			email: true,
			passwordHash: true,
			organizationUsers: {
				where: { status: 'ACTIVE' },
				select: {
					organization: {
						select: { id: true, slug: true, name: true },
					},
				},
			},
		},
	});

	if (!user || !user.passwordHash) {
		throw new Error('Invalid email or password');
	}

	const isValid = await verifyPassword(input.password, user.passwordHash);

	if (!isValid) {
		throw new BadRequestError('Invalid email or password!', {
			reason: 'INVALID_CREDENTIALS',
			code: 'INVALID_CREDENTIALS',
			statusCode: 401,
		});
	}

	await prisma.session.create({
		data: {
			sessionId: input.session.sessionId,
			userId: user.id,
			refreshTokenHash: input.session.tokenHash,
			expiresAt: input.session.expiresAt,
			userAgent: input.session.userAgent,
			ip: input.session.ip,
		},
	});

	const organizations = user.organizationUsers.map((ou) => ou.organization);

	// TODO: consider returning only the "current" org (e.g. the one they last logged into) and loading others on demand, to reduce token size and improve security and return the organization slug and id, use the id for audit logs.
	return {
		userId: user.id,
		email: user.email,
		organizations,
	};
}

export async function logoutService(userId: string) {
	await prisma.session.deleteMany({
		where: {
			userId,
		},
	});
}

export async function forgotPasswordService(
	input: ForgotPasswordInput,
): Promise<ForgotPasswordResult> {
	const email = input.email.toLowerCase().trim();
	const user = await prisma.user.findUnique({
		where: { email },
		select: { id: true },
	});

	if (!user) return null; // null → controller responds 200 silently (enumeration-safe)

	const rawToken = crypto.randomBytes(32).toString('hex');
	const tokenHash = hashToken(rawToken);
	const expiresAt = new Date(Date.now() + 60 * 60_000); // 1 hour

	await prisma.passwordResetToken.create({
		data: { userId: user.id, tokenHash, expiresAt },
	});

	return { resetToken: rawToken, expiresAt };
}

export async function changePasswordService(
	input: ChangePasswordInput,
): Promise<void> {
	const user = await prisma.user.findUnique({
		where: { id: input.userId },
		select: { id: true, passwordHash: true },
	});

	if (!user || !user.passwordHash) throw new Error('User not found');

	const isValid = await verifyPassword(
		input.currentPassword,
		user.passwordHash,
	);
	if (!isValid) throw new Error('Current password is incorrect');

	const newHash = await hashPassword(input.newPassword);

	await prisma.$transaction(async (tx) => {
		await tx.user.update({
			where: { id: input.userId },
			data: { passwordHash: newHash },
		});
		await tx.session.deleteMany({ where: { userId: input.userId } });
	});
}

export async function acceptInviteService(
	input: AcceptInviteInput,
): Promise<AcceptInviteResult> {
	const tokenHash = hashToken(input.token);

	const inviteToken = await prisma.inviteToken.findUnique({
		where: { tokenHash },
		include: {
			organization: { select: { id: true, slug: true, name: true } },
			organizationUser: { select: { id: true, userId: true } },
		},
	});

	if (
		!inviteToken ||
		inviteToken.usedAt ||
		inviteToken.revokedAt ||
		inviteToken.expiresAt < new Date() ||
		!inviteToken.organizationUser
	) {
		throw new Error('Invalid or expired invite token');
	}

	const newHash = await hashPassword(input.password);

	const result = await prisma.$transaction(async (tx) => {
		const updateData: Record<string, string> = { passwordHash: newHash };
		if (input.firstName) updateData.firstName = input.firstName;
		if (input.lastName) updateData.lastName = input.lastName;

		const user = await tx.user.update({
			where: { id: inviteToken.organizationUser!.userId },
			data: updateData,
			select: { id: true, email: true },
		});

		await tx.organizationUser.update({
			where: { id: inviteToken.organizationUser!.id },
			data: { status: 'ACTIVE', joinedAt: new Date() },
		});

		await tx.inviteToken.update({
			where: { id: inviteToken.id },
			data: { usedAt: new Date() },
		});

		await tx.session.create({
			data: {
				sessionId: input.session.sessionId,
				userId: user.id,
				refreshTokenHash: input.session.tokenHash,
				expiresAt: input.session.expiresAt,
				userAgent: input.session.userAgent,
				ip: input.session.ip,
			},
		});

		return { userId: user.id, email: user.email };
	});

	return {
		userId: result.userId,
		email: result.email,
		organization: inviteToken.organization,
	};
}

export async function refreshService(
	sessionId: string,
	rawRefreshToken: string,
): Promise<RefreshResult> {
	const session = await prisma.session.findUnique({
		where: { sessionId },
		select: {
			id: true,
			userId: true,
			refreshTokenHash: true,
			expiresAt: true,
			revokedAt: true,
			user: { select: { id: true, email: true, status: true } },
		},
	});

	if (!session || session.revokedAt || session.expiresAt < new Date()) {
		throw new Error('Invalid or expired session');
	}

	if (!verifyTokenHash(session.refreshTokenHash, rawRefreshToken)) {
		throw new Error('Invalid refresh token');
	}

	if (session.user.status !== 'ACTIVE') {
		throw new Error('User account is not active');
	}

	return { userId: session.user.id, email: session.user.email };
}

export async function myOrganizationsService(userId: string) {
	const orgs = await prisma.organizationUser.findMany({
		where: { userId, status: 'ACTIVE' },
		select: {
			organization: { select: { id: true, name: true, slug: true } },
		},
	});

	return orgs;
}
