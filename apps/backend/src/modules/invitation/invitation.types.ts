export type CreateInviteBody = {
  email: string;
  roleId: string;
  firstName: string;
  lastName: string;
};

export type CreateInviteInput = CreateInviteBody & {
  organizationId: string;
  invitedByUserId: string;
};
