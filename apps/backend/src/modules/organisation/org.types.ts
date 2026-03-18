export type UpdateOrgBody = {
  name?: string | undefined;
};

export type UpdateMemberBody = {
  roleId?: string | undefined;
  status?: 'ACTIVE' | 'SUSPENDED' | undefined;
};

export type OrgMember = {
  id: string;
  userId: string;
  status: string;
  invitedAt: Date;
  joinedAt: Date | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  roles: Array<{ id: string; name: string }>;
};
