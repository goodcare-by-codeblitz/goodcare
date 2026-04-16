import slug from 'slug';
import zod from 'zod';

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugValidationSchema = zod
	.string()
	.min(2, 'Slug must be at least 2 characters long')
	.max(63, 'Slug must be at most 63 characters long')
	.regex(
		slugPattern,
		'Slug can only include lowercase letters, numbers, and hyphens',
	);

const normalizedSlugSchema = zod
	.string()
	.transform((value) => slug(value, { lower: true }))
	.pipe(slugValidationSchema);

export const registerValidation = zod.object({
	email: zod.string().email('Invalid email address'),
	password: zod
		.string()
		.min(8, 'Password must be at least 8 characters long')
		.regex(
			/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
			'Must include at least 1 uppercase letter, 1 number, and 1 special character',
		),
	organizationName: zod.string().min(2, 'Organization name is required'),
	slug: normalizedSlugSchema,
});
