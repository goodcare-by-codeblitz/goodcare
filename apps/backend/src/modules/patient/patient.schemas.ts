import type { FastifySchema } from 'fastify';

const orgPatientParams = {
  type: 'object' as const,
  required: ['organizationId'],
  properties: {
    organizationId: { type: 'string', format: 'uuid' },
  },
};

const orgPatientIdParams = {
  type: 'object' as const,
  required: ['organizationId', 'patientId'],
  properties: {
    organizationId: { type: 'string', format: 'uuid' },
    patientId: { type: 'string', format: 'uuid' },
  },
};

export const createPatientSchema: FastifySchema = {
  tags: ['Patients'],
  body: {
    type: 'object',
    required: ['firstName', 'lastName', 'dateOfBirth'],
    properties: {
      firstName: { type: 'string', minLength: 1 },
      lastName: { type: 'string', minLength: 1 },
      dateOfBirth: { type: 'string', format: 'date' },
      gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER', 'NOT_SPECIFIED'] },
      genderDescription: { type: 'string', maxLength: 255 },
    },
    additionalProperties: false,
  },
  params: orgPatientParams,
};

export const updatePatientSchema: FastifySchema = {
  tags: ['Patients'],
  body: {
    type: 'object',
    properties: {
      firstName: { type: 'string', minLength: 1 },
      lastName: { type: 'string', minLength: 1 },
      dateOfBirth: { type: 'string', format: 'date' },
      gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER', 'NOT_SPECIFIED'] },
      genderDescription: { type: 'string', maxLength: 255 },
      status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
    },
    additionalProperties: false,
  },
  params: orgPatientIdParams,
};

export const listPatientsSchema: FastifySchema = {
  tags: ['Patients'],
  params: orgPatientParams,
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'string' },
      limit: { type: 'string' },
      search: { type: 'string' },
    },
  },
};

export const getPatientSchema: FastifySchema = {
  tags: ['Patients'],
  params: orgPatientIdParams,
};

export const createPatientOpts = { schema: createPatientSchema };
export const updatePatientOpts = { schema: updatePatientSchema };
export const listPatientsOpts = { schema: listPatientsSchema };
export const getPatientOpts = { schema: getPatientSchema };
export const deletePatientOpts = { schema: { tags: ['Patients'], params: orgPatientIdParams } };
