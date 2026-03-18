export class AppError extends Error {
	statusCode: number;
	code: string;
	details?: unknown;

	constructor(
		message: string,
		statusCode: number,
		code: string,
		details?: unknown,
	) {
		super(message);
		this.statusCode = statusCode;
		this.code = code;
		this.details = details;

		Error.captureStackTrace(this, this.constructor);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = 'Unauthorized', details?: unknown) {
		super(message, 401, 'UNAUTHORIZED', details);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = 'Forbidden', details?: unknown) {
		super(message, 403, 'FORBIDDEN', details);
	}
}

export class NotFoundError extends AppError {
	constructor(message = 'Not found', details?: unknown) {
		super(message, 404, 'NOT_FOUND', details);
	}
}

export class ConflictError extends AppError {
	constructor(message = 'Conflict', details?: unknown) {
		super(message, 409, 'CONFLICT', details);
	}
}

export class ValidationError extends AppError {
	constructor(message = 'Validation error', details?: unknown) {
		super(message, 400, 'VALIDATION_ERROR', details);
	}
}

export class InternalServerError extends AppError {
	constructor(message = 'Internal server error', details?: unknown) {
		super(message, 500, 'INTERNAL_SERVER_ERROR', details);
	}
}

export class BadRequestError extends AppError {
	constructor(message = 'Bad request', details?: unknown) {
		super(message, 401, 'BAD_REQUEST', details);
	}
}
