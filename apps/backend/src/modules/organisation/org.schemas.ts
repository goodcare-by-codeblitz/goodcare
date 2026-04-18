import type { FastifySchema } from 'fastify';

export const updateOrgSchema: FastifySchema = {
  tags: ['Organizations'],
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2 },
    },
    additionalProperties: false,
  },
  params: {
    type: 'object',
    required: ['organizationId'],
    properties: {
      organizationId: { type: 'string', format: 'uuid' },
    },
  },
};

export const updateMemberSchema: FastifySchema = {
  tags: ['Members'],
  body: {
    type: 'object',
    properties: {
      roleIds: {
        type: 'array',
        items: { type: 'string', format: 'uuid' },
        uniqueItems: true,
      },
      status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED'] },
    },
    additionalProperties: false,
  },
  params: {
    type: 'object',
    required: ['organizationId', 'userId'],
    properties: {
      organizationId: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
    },
  },
};

export const listRolesSchema: FastifySchema = {
  tags: ['Organizations'],
  params: {
    type: 'object',
    required: ['organizationId'],
    properties: {
      organizationId: { type: 'string', format: 'uuid' },
    },
  },
  querystring: {
    type: 'object',
    required: ['kind'],
    properties: {
      kind: { type: 'string', enum: ['team', 'carer'] },
    },
  },
};

export const createRoleSchema: FastifySchema = {
  tags: ['Organizations'],
  body: {
    type: 'object',
    required: ['kind', 'name', 'permissionKeys'],
    properties: {
      kind: { type: 'string', enum: ['team', 'carer'] },
      name: { type: 'string', minLength: 2 },
      description: { type: 'string' },
      permissionKeys: {
        type: 'array',
        minItems: 1,
        uniqueItems: true,
        items: { type: 'string', minLength: 1 },
      },
      cloneRoleId: { type: 'string', format: 'uuid' },
    },
    additionalProperties: false,
  },
  params: {
    type: 'object',
    required: ['organizationId'],
    properties: {
      organizationId: { type: 'string', format: 'uuid' },
    },
  },
};

export const updateRoleSchema: FastifySchema = {
  tags: ['Organizations'],
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2 },
      description: {
        anyOf: [{ type: 'string' }, { type: 'null' }],
      },
      permissionKeys: {
        type: 'array',
        minItems: 1,
        uniqueItems: true,
        items: { type: 'string', minLength: 1 },
      },
    },
    additionalProperties: false,
  },
  params: {
    type: 'object',
    required: ['organizationId', 'roleId'],
    properties: {
      organizationId: { type: 'string', format: 'uuid' },
      roleId: { type: 'string', format: 'uuid' },
    },
  },
};

export const roleParamsSchema: FastifySchema = {
  tags: ['Organizations'],
  params: {
    type: 'object',
    required: ['organizationId', 'roleId'],
    properties: {
      organizationId: { type: 'string', format: 'uuid' },
      roleId: { type: 'string', format: 'uuid' },
    },
  },
};

export const orgIdParamsSchema: FastifySchema = {
  tags: ['Organizations'],
  params: {
    type: 'object',
    required: ['organizationId'],
    properties: {
      organizationId: { type: 'string', format: 'uuid' },
    },
  },
};

export const memberParamsSchema: FastifySchema = {
  tags: ['Members'],
  params: {
    type: 'object',
    required: ['organizationId', 'userId'],
    properties: {
      organizationId: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
    },
  },
};

export const updateOrgOpts = { schema: updateOrgSchema };
export const updateMemberOpts = { schema: updateMemberSchema };
export const listRolesOpts = { schema: listRolesSchema };
export const createRoleOpts = { schema: createRoleSchema };
export const updateRoleOpts = { schema: updateRoleSchema };
export const roleParamsOpts = { schema: roleParamsSchema };
export const orgIdParamsOpts = { schema: orgIdParamsSchema };
export const memberParamsOpts = { schema: memberParamsSchema };
