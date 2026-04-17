export type UpdateOrgBody = {
  name?: string | undefined;
};

export type UpdateMemberBody = {
  roleId?: string | null | undefined;
  status?: 'ACTIVE' | 'SUSPENDED' | undefined;
};

export type RoleKind = 'team' | 'carer';

export type OrgRole = {
  id: string;
  name: string;
};

export type OrgMember = {
  id: string;
  userId: string;
  status: string;
  invitedAt: Date;
  joinedAt: Date | null;
  invitedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  role: OrgRole | null;
};
