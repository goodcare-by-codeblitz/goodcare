import crypto from 'crypto';

const TOKEN_SECRET = process.env.TOKEN_HASH_SECRET!;

export function hashToken(token: string) {
	return crypto.createHmac('sha256', TOKEN_SECRET).update(token).digest('hex');
}

export function verifyTokenHash(hash: string, token: string) {
	const tokenHash = hashToken(token);
	return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(tokenHash));
}
