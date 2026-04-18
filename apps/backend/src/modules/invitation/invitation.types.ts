export type CreateInviteBody = {
  email: string;
  roleIds: string[];
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
  roleIds?: string[];
  kind: InviteKind;
  organizationId: string;
  invitedByUserId: string;
};
