import zod from 'zod';

export const loginSchema = zod.object({
	email: zod.email('Please enter a valid email address'),
	// password: zod
	// 	.string()
	// 	.min(6, 'Password must be at least 6 characters long')
	// 	.regex(
	// 		/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
	// 		'Must include at least 1 uppercase letter, 1 number, and 1 special character',
	// 	),
	password: zod.string().min(1, 'Password is required'),
});
