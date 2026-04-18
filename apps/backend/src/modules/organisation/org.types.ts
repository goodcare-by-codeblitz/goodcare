export type UpdateOrgBody = {
  name?: string | undefined;
};

export type UpdateMemberBody = {
  roleIds?: string[] | undefined;
  status?: 'ACTIVE' | 'SUSPENDED' | undefined;
};

export type RoleKind = 'team' | 'carer';

export type OrgRole = {
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
};

export type OrgPermissionCatalogEntry = {
  id: string;
  key: string;
  description: string;
};

export type CreateOrgRoleBody = {
  kind: RoleKind;
  name: string;
  description?: string | undefined;
  permissionKeys: string[];
  cloneRoleId?: string | undefined;
};

export type UpdateOrgRoleBody = {
  name?: string | undefined;
  description?: string | null | undefined;
  permissionKeys?: string[] | undefined;
};

export type OrgMember = {
  id: string;
  userId: string;
  status: string;
  invitedAt: Date;
  joinedAt: Date | null;
  leftAt: Date | null;
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
  roles: OrgRole[];
};
