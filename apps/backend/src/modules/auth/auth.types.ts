export type RegisterBody = {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	organizationName: string;
	slug?: string;
};

export type LoginBody = {
	email: string;
	password: string;
};

export type LoginResult = {
	userId: string;
	email: string;
	organizations: Array<{
		id: string;
		slug: string;
		name: string;
	}>;
};

export type RegisterResult = {
	organizationId: string;
	email: string;
	userId: string;
	chosenSlug: string;
};

export interface ISessionInput {
	sessionId: string;
	tokenHash: string;
	expiresAt: Date;
	userAgent: string | null;
	ip: string;
}

export type RegisterInput = RegisterBody & { session: ISessionInput };
export type LoginInput = LoginBody & { session: ISessionInput };

export type ForgotPasswordBody = {
	email: string;
};

export type ForgotPasswordInput = {
	email: string;
};

export type ForgotPasswordResult = {
	resetToken: string;
	expiresAt: Date;
} | null;

export type ResetPasswordBody = {
	newPassword: string;
};

export type ResetPasswordInput = ResetPasswordBody;

export type AcceptInviteBody = {
	token: string;
	password: string;
	firstName?: string | undefined;
	lastName?: string | undefined;
};

export type AcceptInviteInput = AcceptInviteBody & { session: ISessionInput };

export type AcceptInviteResult = {
	userId: string;
	email: string;
	organization: { id: string; slug: string; name: string };
};

export type RefreshResult = {
	userId: string;
	email: string;
};

export type ChangePasswordBody = {
	currentPassword: string;
	newPassword: string;
};

export type ChangePasswordInput = ChangePasswordBody & {
	userId: string;
};
