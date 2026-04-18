function normalizeBaseDomain(rawBaseDomain: string | undefined) {
	const trimmed = rawBaseDomain?.trim();
	if (!trimmed) {
		throw new Error('APP_BASE_DOMAIN environment variable is not set!');
	}

	return trimmed.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function normalizeProtocol(rawProtocol: string | undefined) {
	const trimmed = rawProtocol?.trim().toLowerCase();
	if (!trimmed) {
		return 'https';
	}

	if (trimmed !== 'http' && trimmed !== 'https') {
		throw new Error('APP_PROTOCOL must be either "http" or "https"');
	}

	return trimmed;
}

function normalizePath(pathname: string) {
	return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function addOrgSubdomain(slug: string, baseDomain: string) {
	const trimmedSlug = slug.trim();
	if (!trimmedSlug) {
		throw new Error('Organization slug is required to build an org app URL');
	}

	const [host, ...portParts] = baseDomain.split(':');
	const portSuffix = portParts.length > 0 ? `:${portParts.join(':')}` : '';
	return `${trimmedSlug}.${host}${portSuffix}`;
}

export function getAppUrlConfig() {
	return {
		baseDomain: normalizeBaseDomain(process.env.APP_BASE_DOMAIN),
		protocol: normalizeProtocol(process.env.APP_PROTOCOL),
	};
}

export function buildBaseAppUrl(pathname: string) {
	const { baseDomain, protocol } = getAppUrlConfig();
	return `${protocol}://${baseDomain}${normalizePath(pathname)}`;
}

export function buildOrgAppUrl(slug: string, pathname: string) {
	const { baseDomain, protocol } = getAppUrlConfig();
	return `${protocol}://${addOrgSubdomain(slug, baseDomain)}${normalizePath(pathname)}`;
}
