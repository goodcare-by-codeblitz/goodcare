'use client';

import { buildBaseAppUrl, getCurrentOrgSlug } from '@/lib/auth-session';
import { authApi } from '@/lib/api-client';
import { useSessionStore } from '@/lib/stores/session-store';
import axios from 'axios';
import { useEffect, useState } from 'react';

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

type GuardState = 'checking' | 'allowed';
const CARER_ONLY_ACCESS_REASON = 'CARER_ONLY_ACCOUNT';

export function DashboardOrgGuard({
	children,
}: {
	children: React.ReactNode;
}) {
	const clearSession = useSessionStore((state) => state.clear);
	const [guardState, setGuardState] = useState<GuardState>('checking');

	useEffect(() => {
		const checkOrgAccess = async () => {
			const currentOrgSlug = getCurrentOrgSlug();

			if (!currentOrgSlug) {
				setGuardState('allowed');
				return;
			}

			if (!backendBaseUrl) {
				const loginUrl = buildBaseAppUrl('/login');
				if (loginUrl) {
					window.location.replace(loginUrl);
				}
				return;
			}

			try {
				const baseUrl = backendBaseUrl.replace(/\/+$/, '');
				const response = await authApi.get(
					`${baseUrl}/v1/auth/current-org-access`,
					{
						withCredentials: true,
						headers: {
							'x-org-slug': currentOrgSlug,
						},
					},
				);

				if (response.data?.authorized) {
					setGuardState('allowed');
					return;
				}

				if (response.data?.reason === CARER_ONLY_ACCESS_REASON) {
					clearSession();
					const blockedUrl = buildBaseAppUrl('/carer-access');
					if (blockedUrl) {
						window.location.replace(blockedUrl);
						return;
					}

					window.location.replace('/carer-access');
					return;
				}

				clearSession();
				const selectOrgUrl = buildBaseAppUrl('/select-org');
				if (selectOrgUrl) {
					window.location.replace(selectOrgUrl);
					return;
				}

				window.location.replace('/select-org');
			} catch (error) {
				clearSession();

				if (axios.isAxiosError(error) && error.response?.status === 401) {
					const loginUrl = buildBaseAppUrl('/login');
					if (loginUrl) {
						window.location.replace(loginUrl);
						return;
					}
				}

				const selectOrgUrl = buildBaseAppUrl('/select-org');
				if (selectOrgUrl) {
					window.location.replace(selectOrgUrl);
					return;
				}

				window.location.replace('/select-org');
			}
		};

		void checkOrgAccess();
	}, [clearSession]);

	if (guardState === 'allowed') {
		return <>{children}</>;
	}

	return (
		<div className='flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground'>
			Checking organization access...
		</div>
	);
}
