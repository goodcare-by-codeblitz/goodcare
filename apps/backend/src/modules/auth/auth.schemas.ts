import type { FastifySchema } from "fastify";

export const registerSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["firstName", "lastName", "email", "password", "organizationName"],
    properties: {
      firstName: { type: "string", minLength: 1 },
      lastName: { type: "string", minLength: 1 },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
      organizationName: { type: "string", minLength: 2 },
      slug: { type: "string", minLength: 2 },
    },
    additionalProperties: false,
  },
};

export const loginSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
    },
    additionalProperties: false,
  },
};

export const loginOpts = { schema: loginSchema };
export const registerOpts = { schema: registerSchema };
