import zod from 'zod';

export const loginSchema = zod.object({
	email: zod.email('Please enter a valid email address'),
	password: zod.string().min(1, 'Password is required'),
});
