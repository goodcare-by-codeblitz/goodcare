import axios, {
	AxiosError,
	type InternalAxiosRequestConfig,
} from 'axios';
import { useSessionStore } from '@/lib/stores/session-store';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
	_retry?: boolean;
};

function getBackendBaseUrl() {
	const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.replace(/\/+$/, '');
	if (!baseUrl) {
		throw new Error('Missing NEXT_PUBLIC_BACKEND_BASE_URL in apps/web/.env');
	}

	return baseUrl;
}

function isRefreshRequest(url?: string) {
	return typeof url === 'string' && url.endsWith('/v1/auth/refresh');
}

function clearClientSession() {
	if (typeof window === 'undefined') {
		return;
	}

	useSessionStore.getState().clear();
}

let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken() {
	await axios.post(`${getBackendBaseUrl()}/v1/auth/refresh`, undefined, {
		withCredentials: true,
	});
}

function getRefreshPromise() {
	if (!refreshPromise) {
		refreshPromise = refreshAccessToken().finally(() => {
			refreshPromise = null;
		});
	}

	return refreshPromise;
}

export const authApi = axios.create({
	baseURL: getBackendBaseUrl(),
	withCredentials: true,
});

authApi.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const status = error.response?.status;
		const originalRequest = error.config as RetryableRequestConfig | undefined;

		if (
			status !== 401 ||
			!originalRequest ||
			originalRequest._retry ||
			isRefreshRequest(originalRequest.url)
		) {
			return Promise.reject(error);
		}

		originalRequest._retry = true;

		try {
			await getRefreshPromise();
			return authApi.request(originalRequest);
		} catch (refreshError) {
			clearClientSession();
			return Promise.reject(refreshError);
		}
	},
);
