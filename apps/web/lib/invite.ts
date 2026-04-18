import axios from 'axios';
import { authApi } from '@/lib/api-client';
import type { InvitePreview } from '@/lib/org-management';

function getBackendBaseUrl() {
	const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.replace(/\/+$/, '');
	if (!baseUrl) {
		throw new Error('Missing NEXT_PUBLIC_BACKEND_BASE_URL in apps/web/.env');
	}

	return baseUrl;
}

export function getInviteErrorMessage(error: unknown, fallback: string) {
	if (axios.isAxiosError(error)) {
		const message = error.response?.data?.error;
		if (typeof message === 'string' && message.length > 0) {
			return message;
		}
	}

	return fallback;
}

export function getInviteErrorCode(error: unknown) {
	if (axios.isAxiosError(error)) {
		const detailsReason = error.response?.data?.details?.reason;
		if (typeof detailsReason === 'string' && detailsReason.length > 0) {
			return detailsReason;
		}

		const code = error.response?.data?.code;
		if (typeof code === 'string' && code.length > 0) {
			return code;
		}
	}

	return null;
}

export async function previewInvite(token: string) {
	const response = await axios.get(`${getBackendBaseUrl()}/v1/auth/invite-preview`, {
		params: { token },
		withCredentials: true,
	});

	return response.data as InvitePreview;
}

export async function acceptInvite(input: {
	token: string;
	password?: string;
	firstName?: string;
	lastName?: string;
}) {
	const response = await axios.post(
		`${getBackendBaseUrl()}/v1/auth/accept-invite`,
		input,
		{
			withCredentials: true,
		},
	);

	return response.data as {
		message: string;
		email: string;
		organization: {
			id: string;
			slug: string;
			name: string;
		};
		inviteKind: 'TEAM' | 'CARER';
		nextStep: 'dashboard' | 'carer_app_download';
		inviteState: 'pending' | 'accepted';
	};
}

export async function logoutForInviteFlow() {
	try {
		await authApi.delete('/v1/auth/logout', {
			withCredentials: true,
		});
	} catch {
		// Ignore logout failures here so users can still continue to sign in.
	}
}
