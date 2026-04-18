import type { FastifySchema } from 'fastify';
import { errorResponse, messageResponse } from '../../schemas/common';

export const registerSchema: FastifySchema = {
	tags: ['Auth'],
	body: {
		type: 'object',
		required: [
			'firstName',
			'lastName',
			'email',
			'password',
			'organizationName',
		],
		properties: {
			firstName: { type: 'string', minLength: 1 },
			lastName: { type: 'string', minLength: 1 },
			email: { type: 'string', format: 'email' },
			password: { type: 'string', minLength: 8 },
			organizationName: { type: 'string', minLength: 2 },
			slug: {
				type: 'string',
				minLength: 2,
				maxLength: 63,
				pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
			},
		},
		additionalProperties: false,
	},
	response: {
		201: {
			type: 'object',
			properties: {
				user: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						email: { type: 'string' },
						firstName: { type: 'string' },
						lastName: { type: 'string' },
					},
				},
				organization: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						name: { type: 'string' },
						slug: { type: 'string' },
					},
				},
			},
		},
		400: errorResponse,
		409: errorResponse,
	},
};

export const loginSchema: FastifySchema = {
	tags: ['Auth'],
	body: {
		type: 'object',
		required: ['email', 'password'],
		properties: {
			email: { type: 'string' },
			password: { type: 'string' },
		},
		additionalProperties: false,
	},
	response: {
		200: {
			type: 'object',
			properties: {
				message: { type: 'string' },
				email: { type: 'string' },
				refreshToken: { type: 'string' },
				organizations: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							name: { type: 'string' },
							slug: { type: 'string' },
						},
					},
				},
			},
		},
		400: errorResponse,
	},
};

export const orgSlugCheckSchema: FastifySchema = {
	tags: ['Auth'],
	body: {
		type: 'object',
		properties: {
			organizationName: { type: 'string', minLength: 2 },
			slug: {
				type: 'string',
				minLength: 2,
				maxLength: 63,
				pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
			},
		},
		additionalProperties: false,
		anyOf: [{ required: ['organizationName'] }, { required: ['slug'] }],
	},
	response: {
		200: {
			type: 'object',
			properties: {
				available: { type: 'boolean' },
				suggestedSlug: { type: 'string' },
				suggestions: {
					type: 'array',
					items: { type: 'string' },
				},
			},
		},
		400: errorResponse,
	},
};

export const forgotPasswordSchema: FastifySchema = {
	tags: ['Auth'],
	body: {
		type: 'object',
		required: ['email'],
		properties: {
			email: { type: 'string', format: 'email' },
			nextPath: { type: 'string', minLength: 1 },
		},
		additionalProperties: false,
	},
	response: {
		200: messageResponse,
	},
};

export const resetPasswordSchema: FastifySchema = {
	tags: ['Auth'],
	body: {
		type: 'object',
		required: ['newPassword'],
		properties: {
			token: { type: 'string', minLength: 1 },
			newPassword: { type: 'string', minLength: 8 },
		},
		additionalProperties: false,
	},
	response: {
		200: {
			type: 'object',
			properties: {
				message: { type: 'string' },
				email: { type: 'string' },
				organization: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						slug: { type: 'string' },
						name: { type: 'string' },
					},
				},
				inviteKind: { type: 'string', enum: ['TEAM', 'CARER'] },
				nextStep: {
					type: 'string',
					enum: ['dashboard', 'carer_app_download'],
				},
			},
		},
		400: errorResponse,
	},
};

export const acceptInviteSchema: FastifySchema = {
	tags: ['Auth'],
	body: {
		type: 'object',
		required: ['token'],
		properties: {
			token: { type: 'string', minLength: 1 },
			password: { type: 'string', minLength: 8 },
			firstName: { type: 'string', minLength: 1 },
			lastName: { type: 'string', minLength: 1 },
		},
		additionalProperties: false,
	},
	response: {
		200: {
			type: 'object',
			properties: {
				message: { type: 'string' },
				email: { type: 'string' },
				organization: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						slug: { type: 'string' },
						name: { type: 'string' },
					},
				},
				inviteKind: { type: 'string', enum: ['TEAM', 'CARER'] },
				nextStep: {
					type: 'string',
					enum: ['dashboard', 'carer_app_download'],
				},
				inviteState: {
					type: 'string',
					enum: ['pending', 'accepted'],
				},
			},
		},
		400: errorResponse,
	},
};

export const invitePreviewSchema: FastifySchema = {
	tags: ['Auth'],
	querystring: {
		type: 'object',
		required: ['token'],
		properties: {
			token: { type: 'string', minLength: 1 },
		},
		additionalProperties: false,
	},
	response: {
		200: {
			type: 'object',
			properties: {
				organization: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						slug: { type: 'string' },
						name: { type: 'string' },
					},
				},
				kind: { type: 'string', enum: ['TEAM', 'CARER'] },
				email: { type: 'string' },
				firstName: { type: 'string' },
				lastName: { type: 'string' },
				membershipStatus: {
					type: 'string',
					enum: ['INVITED', 'ACTIVE', 'SUSPENDED', 'LEFT'],
				},
				hasExistingAccount: { type: 'boolean' },
				wasFormerMember: { type: 'boolean' },
				currentSessionUser: {
					anyOf: [
						{
							type: 'object',
							properties: {
								id: { type: 'string' },
								email: { type: 'string' },
							},
						},
						{ type: 'null' },
					],
				},
				acceptanceMode: {
					type: 'string',
					enum: [
						'new_user',
						'existing_user_login_required',
						'signed_in_match',
						'signed_in_mismatch',
					],
				},
				inviteState: {
					type: 'string',
					enum: ['pending', 'accepted'],
				},
				roles: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							key: { type: 'string' },
							name: { type: 'string' },
							description: { type: ['string', 'null'] },
							isSystem: { type: 'boolean' },
							organizationId: { type: ['string', 'null'] },
							permissions: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										key: { type: 'string' },
										description: { type: 'string' },
									},
								},
							},
						},
					},
				},
			},
		},
		400: errorResponse,
		403: errorResponse,
	},
};

export const changePasswordSchema: FastifySchema = {
	tags: ['Auth'],
	body: {
		type: 'object',
		required: ['currentPassword', 'newPassword'],
		properties: {
			currentPassword: { type: 'string', minLength: 1 },
			newPassword: { type: 'string', minLength: 8 },
		},
		additionalProperties: false,
	},
	response: {
		200: messageResponse,
		400: errorResponse,
		401: errorResponse,
	},
};

export const meSchema: FastifySchema = {
	tags: ['Auth'],
	response: {
		200: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				email: { type: 'string' },
			},
		},
		401: errorResponse,
	},
};

export const currentOrgAccessSchema: FastifySchema = {
	tags: ['Auth'],
	response: {
		200: {
			type: 'object',
			properties: {
				authorized: { type: 'boolean' },
				organizationId: { type: ['string', 'null'] },
				organizationSlug: { type: ['string', 'null'] },
				organizationName: { type: ['string', 'null'] },
				reason: {
					type: ['string', 'null'],
					enum: ['CARER_ONLY_ACCOUNT', null],
				},
				permissions: {
					type: 'array',
					items: { type: 'string' },
				},
			},
		},
		401: errorResponse,
	},
};

export const meOpts = { schema: meSchema };
export const currentOrgAccessOpts = { schema: currentOrgAccessSchema };

export const changePasswordOpts = { schema: changePasswordSchema };
export const loginOpts = { schema: loginSchema };
export const registerOpts = { schema: registerSchema };
export const orgSlugCheckOpts = { schema: orgSlugCheckSchema };
export const forgotPasswordOpts = { schema: forgotPasswordSchema };
export const resetPasswordOpts = { schema: resetPasswordSchema };
export const acceptInviteOpts = { schema: acceptInviteSchema };
export const invitePreviewOpts = { schema: invitePreviewSchema };
