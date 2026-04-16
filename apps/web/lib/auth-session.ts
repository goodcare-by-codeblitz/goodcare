export const AUTH_EVENT_KEY = 'goodcare:auth-event';

export type AuthEventType = 'login' | 'logout';

function getAppBaseDomain() {
	return process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ?? null;
}

export function buildBaseAppUrl(pathname: string) {
	const baseDomain = getAppBaseDomain();
	if (!baseDomain || typeof window === 'undefined') {
		return null;
	}

	return `${window.location.protocol}//${baseDomain}${pathname}`;
}

export function buildOrgAppUrl(slug: string, pathname: string) {
	const baseDomain = getAppBaseDomain();
	if (!baseDomain || typeof window === 'undefined') {
		return null;
	}

	return `${window.location.protocol}//${slug}.${baseDomain}${pathname}`;
}

export function getCurrentOrgSlug() {
	const baseDomain = getAppBaseDomain();
	if (!baseDomain || typeof window === 'undefined') {
		return null;
	}

	const baseHost = baseDomain.split(':')[0];
	const currentHost = window.location.hostname;

	if (!baseHost || currentHost === baseHost) {
		return null;
	}

	const suffix = `.${baseHost}`;
	if (!currentHost.endsWith(suffix)) {
		return null;
	}

	return currentHost.slice(0, -suffix.length) || null;
}

export function broadcastAuthEvent(type: AuthEventType) {
	if (typeof window === 'undefined') {
		return;
	}

	window.localStorage.setItem(
		AUTH_EVENT_KEY,
		JSON.stringify({ type, timestamp: Date.now() }),
	);
}
