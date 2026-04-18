export const EMAIL_QUEUE_NAME = 'email' as const;

export type WelcomeEmailPayload = {
  type: 'welcome';
  to: string;
  firstName: string;
  organizationName: string;
  slug: string;
};

export type PasswordResetEmailPayload = {
  type: 'password_reset';
  to: string;
  resetToken: string;
  expiresAt: Date;
  nextPath?: string;
};

export type InvitationEmailPayload = {
  type: 'invitation';
  to: string;
  firstName: string;
  organizationName: string;
  slug: string;
  inviteToken: string;
};

export type EmailJobPayload = WelcomeEmailPayload | PasswordResetEmailPayload | InvitationEmailPayload;
