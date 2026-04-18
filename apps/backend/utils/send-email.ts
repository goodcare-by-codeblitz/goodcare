const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

function getRequiredEnv(name: 'SENDGRID_API_KEY' | 'SENDGRID_FROM_EMAIL') {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

export async function sendEmail(
	to: string,
	subject: string,
	body: string,
): Promise<void> {
	const apiKey = getRequiredEnv('SENDGRID_API_KEY');
	const fromEmail = getRequiredEnv('SENDGRID_FROM_EMAIL');

	const response = await fetch(SENDGRID_API_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			personalizations: [
				{
					to: [{ email: to }],
					subject,
				},
			],
			from: { email: fromEmail },
			content: [
				{
					type: 'text/plain',
					value: body,
				},
			],
		}),
	});

	if (response.ok) {
		return;
	}

	const errorText = await response.text();
	throw new Error(
		`SendGrid email failed with status ${response.status}: ${errorText || 'Unknown error'}`,
	);
}
