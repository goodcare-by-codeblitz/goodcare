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

export type CurrentOrgAccessReason = 'CARER_ONLY_ACCOUNT' | null;

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
	nextPath?: string | undefined;
};

export type ForgotPasswordInput = {
	email: string;
};

export type ForgotPasswordResult = {
	resetToken: string;
	expiresAt: Date;
} | null;

export type ResetPasswordBody = {
	token: string;
	newPassword: string;
};

export type ResetPasswordInput = ResetPasswordBody & {
	session: ISessionInput;
};

export type ResetPasswordResult = {
	userId: string;
	email: string;
};

export type AcceptInviteBody = {
	token: string;
	password?: string | undefined;
	firstName?: string | undefined;
	lastName?: string | undefined;
};

export type InviteAcceptanceMode =
	| 'new_user'
	| 'existing_user_login_required'
	| 'signed_in_match'
	| 'signed_in_mismatch';

export type InviteState = 'pending' | 'accepted';

export type InvitePreviewResult = {
	organization: { id: string; slug: string; name: string };
	kind: 'TEAM' | 'CARER';
	email: string;
	firstName: string;
	lastName: string;
	membershipStatus: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'LEFT';
	hasExistingAccount: boolean;
	wasFormerMember: boolean;
	currentSessionUser: {
		id: string;
		email: string;
	} | null;
	roles: Array<{
		id: string;
		key: string;
		name: string;
		description: string | null;
		isSystem: boolean;
		organizationId: string | null;
		permissions: Array<{
			id: string;
			key: string;
			description: string;
		}>;
	}>;
	acceptanceMode: InviteAcceptanceMode;
	inviteState: InviteState;
};

export type AcceptInviteInput = AcceptInviteBody & {
	session: ISessionInput;
	currentUserId?: string | null;
};

export type AcceptInviteResult = {
	userId: string;
	email: string;
	organization: { id: string; slug: string; name: string };
	inviteKind: 'TEAM' | 'CARER';
	setAuthSession: boolean;
	nextStep: 'dashboard' | 'carer_app_download';
	inviteState: InviteState;
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
