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
      roleId: { type: 'string', format: 'uuid' },
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
export const orgIdParamsOpts = { schema: orgIdParamsSchema };
export const memberParamsOpts = { schema: memberParamsSchema };
