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
      status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
    },
    additionalProperties: false,
  },
};

const patientAddressSchema = {
  type: 'object',
  required: ['line1', 'city', 'postcode', 'country'],
  properties: {
    line1: { type: 'string', minLength: 1 },
    line2: { type: ['string', 'null'] },
    city: { type: 'string', minLength: 1 },
    postcode: { type: 'string', minLength: 1 },
    country: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
};

const patientEmergencyContactSchema = {
  type: 'object',
  required: ['name', 'relationship', 'phone'],
  properties: {
    name: { type: 'string', minLength: 1 },
    relationship: { type: 'string', minLength: 1 },
    phone: { type: 'string', minLength: 1 },
    email: { type: ['string', 'null'], format: 'email' },
    isPrimary: { type: 'boolean' },
  },
  additionalProperties: false,
};

const patientAllergySchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 1 },
    notes: { type: ['string', 'null'] },
  },
  additionalProperties: false,
};

export const getPatientSchema: FastifySchema = {
  tags: ['Patients'],
  params: orgPatientIdParams,
};

export const patientProfileSchema: FastifySchema = {
  tags: ['Patients'],
  params: orgPatientIdParams,
};

export const updatePatientProfileSchema: FastifySchema = {
  tags: ['Patients'],
  params: orgPatientIdParams,
  body: {
    type: 'object',
    properties: {
      address: {
        anyOf: [patientAddressSchema, { type: 'null' }],
      },
      emergencyContacts: {
        type: 'array',
        items: patientEmergencyContactSchema,
      },
      allergies: {
        type: 'array',
        items: patientAllergySchema,
      },
      medicalSummary: { type: ['string', 'null'] },
      careRequirements: { type: ['string', 'null'] },
    },
    additionalProperties: false,
  },
};

export const createPatientOpts = { schema: createPatientSchema };
export const updatePatientOpts = { schema: updatePatientSchema };
export const listPatientsOpts = { schema: listPatientsSchema };
export const getPatientOpts = { schema: getPatientSchema };
export const getPatientProfileOpts = { schema: patientProfileSchema };
export const updatePatientProfileOpts = { schema: updatePatientProfileSchema };
export const deletePatientOpts = { schema: { tags: ['Patients'], params: orgPatientIdParams } };
