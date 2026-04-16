'use client';

import { AUTH_EVENT_KEY, buildBaseAppUrl } from '@/lib/auth-session';
import { useSessionStore } from '@/lib/stores/session-store';
import { useEffect } from 'react';

type AuthEventPayload = {
	type?: 'login' | 'logout';
	timestamp?: number;
};

export function AuthSync() {
	const clearSession = useSessionStore((state) => state.clear);

	useEffect(() => {
		const onStorage = (event: StorageEvent) => {
			if (event.key !== AUTH_EVENT_KEY || !event.newValue) {
				return;
			}

			let payload: AuthEventPayload | null = null;
			try {
				payload = JSON.parse(event.newValue) as AuthEventPayload;
			} catch {
				payload = null;
			}

			if (!payload?.type) {
				return;
			}

			clearSession();

			if (payload.type === 'logout') {
				const loginUrl = buildBaseAppUrl('/login');
				if (loginUrl) {
					window.location.replace(loginUrl);
					return;
				}
			}

			window.location.reload();
		};

		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, [clearSession]);

	return null;
}
