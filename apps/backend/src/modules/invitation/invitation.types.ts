export type CreateInviteBody = {
  email: string;
  roleId: string;
  firstName: string;
  lastName: string;
};

export type CreateCarerInviteBody = {
  email: string;
  firstName: string;
  lastName: string;
};

export type InviteKind = 'TEAM' | 'CARER';

export type InviteSummary = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
  };
  invitedAt: Date;
  expiresAt: Date;
  invitedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  kind: InviteKind;
};

export type CreateInviteInput = {
  email: string;
  firstName: string;
  lastName: string;
  roleId?: string;
  kind: InviteKind;
  organizationId: string;
  invitedByUserId: string;
};
