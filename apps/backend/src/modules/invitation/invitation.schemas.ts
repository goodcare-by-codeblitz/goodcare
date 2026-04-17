import type { FastifySchema } from 'fastify';

export const createInviteSchema: FastifySchema = {
  tags: ['Invitations'],
  body: {
    type: 'object',
    required: ['email', 'roleId', 'firstName', 'lastName'],
    properties: {
      email: { type: 'string', format: 'email' },
      roleId: { type: 'string', format: 'uuid' },
      firstName: { type: 'string', minLength: 1 },
      lastName: { type: 'string', minLength: 1 },
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

export const createCarerInviteSchema: FastifySchema = {
  tags: ['Invitations'],
  body: {
    type: 'object',
    required: ['email', 'firstName', 'lastName'],
    properties: {
      email: { type: 'string', format: 'email' },
      firstName: { type: 'string', minLength: 1 },
      lastName: { type: 'string', minLength: 1 },
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

export const inviteListSchema: FastifySchema = {
  tags: ['Invitations'],
  params: {
    type: 'object',
    required: ['organizationId'],
    properties: {
      organizationId: { type: 'string', format: 'uuid' },
    },
  },
};

export const revokeInviteSchema: FastifySchema = {
  tags: ['Invitations'],
  params: {
    type: 'object',
    required: ['organizationId', 'inviteId'],
    properties: {
      organizationId: { type: 'string', format: 'uuid' },
      inviteId: { type: 'string', format: 'uuid' },
    },
  },
};

export const createInviteOpts = { schema: createInviteSchema };
export const createCarerInviteOpts = { schema: createCarerInviteSchema };
export const inviteListOpts = { schema: inviteListSchema };
export const revokeInviteOpts = { schema: revokeInviteSchema };
