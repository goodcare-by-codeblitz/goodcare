'use client';

import { buildBaseAppUrl, buildOrgAppUrl } from '@/lib/auth-session';
import { Header } from '@/components/dashboard';
import {
	NativeSelect,
	NativeSelectOption,
} from '@/components/ui/native-select';
import { useSessionStore } from '@/lib/stores/session-store';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

function SelectOrg() {
	const organisations = useSessionStore((state) => state.organisations);
	const setOrganisations = useSessionStore((state) => state.setOrganisations);
	const clearSession = useSessionStore((state) => state.clear);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');

	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		if (isLoading) {
			return;
		}

		const selectedOrgId = e.target.value;
		const selectedOrg = organisations.find((org) => org.id === selectedOrgId);
		if (!selectedOrg) {
			return;
		}

		const dashboardUrl = buildOrgAppUrl(selectedOrg.slug, '/dashboard');
		if (!dashboardUrl) {
			setErrorMessage('Missing NEXT_PUBLIC_APP_BASE_DOMAIN in apps/web/.env');
			return;
		}

		window.open(dashboardUrl, '_blank', 'noopener,noreferrer');
	};

	const loadOrgs = useCallback(async () => {
		const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.replace(/\/+$/, '');
		if (!baseUrl) {
			setErrorMessage('Missing NEXT_PUBLIC_BACKEND_BASE_URL in apps/web/.env');
			setOrganisations([]);
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			setErrorMessage('');
			setOrganisations([]);

			const res = await axios.get(`${baseUrl}/v1/auth/my-organizations`, {
				withCredentials: true,
			});

			setOrganisations(res.data.organizations ?? []);
		} catch (error) {
			setOrganisations([]);

			if (axios.isAxiosError(error) && error.response?.status === 401) {
				clearSession();
				const loginUrl = buildBaseAppUrl('/login');
				if (loginUrl) {
					window.location.replace(loginUrl);
					return;
				}
			}

			setErrorMessage('Unable to load organizations. Please refresh and try again.');
		} finally {
			setIsLoading(false);
		}
	}, [clearSession, setOrganisations]);

	useEffect(() => {
		void loadOrgs();

		const onFocus = () => {
			void loadOrgs();
		};

		const onVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				void loadOrgs();
			}
		};

		window.addEventListener('focus', onFocus);
		document.addEventListener('visibilitychange', onVisibilityChange);

		return () => {
			window.removeEventListener('focus', onFocus);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	}, [loadOrgs]);

	return (
		<div className='min-h-screen bg-gray-200'>
			<div className='sticky top-0 z-10'>
				<Header />
			</div>
			<div className='absolute flex items-center justify-center inset-0 h-screen z-0 bg-gray-100'>
				<div className='mx-auto mt-20 w-full max-w-md rounded-lg bg-white p-6 shadow'>
					<h1 className='text-2xl font-semibold'>Select Your Organization</h1>
					<p className='text-gray-600 mb-4'>
						Please select the organization you want to manage:
					</p>
					<NativeSelect
						className='w-full'
						onChange={handleChange}
						disabled={isLoading || organisations.length === 0}>
						<NativeSelectOption value=''>
							{isLoading ? 'Loading organizations...' : 'Select an organization'}
						</NativeSelectOption>
						{!isLoading &&
							organisations.map((org) => (
								<NativeSelectOption key={org.id} value={org.id}>
									{org.slug}
								</NativeSelectOption>
							))}
					</NativeSelect>
					{errorMessage && (
						<p className='mt-3 text-sm text-red-600'>{errorMessage}</p>
					)}
					{!isLoading && !errorMessage && organisations.length === 0 && (
						<p className='mt-3 text-sm text-gray-600'>
							No organizations are available for the current account.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

export default SelectOrg;
