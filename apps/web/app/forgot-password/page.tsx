'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

function getBackendBaseUrl() {
	const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.replace(/\/+$/, '');
	if (!baseUrl) {
		throw new Error('Missing NEXT_PUBLIC_BACKEND_BASE_URL in apps/web/.env');
	}

	return baseUrl;
}

export default function ForgotPasswordPage() {
	const searchParams = useSearchParams();
	const initialEmail = searchParams.get('email') ?? '';
	const nextPath = searchParams.get('next') ?? '';
	const loginHref = useMemo(() => {
		if (!nextPath.startsWith('/')) {
			return '/login';
		}

		return `/login?next=${encodeURIComponent(nextPath)}`;
	}, [nextPath]);
	const [email, setEmail] = useState(initialEmail);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		try {
			setIsSubmitting(true);
			setErrorMessage('');
			setSuccessMessage('');

			await axios.post(
				`${getBackendBaseUrl()}/v1/auth/forgot-password`,
				{
					email: email.trim(),
					nextPath: nextPath.startsWith('/') ? nextPath : undefined,
				},
				{
					withCredentials: true,
				},
			);

			setSuccessMessage(
				'If that account exists, we have emailed a password reset link.',
			);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const serverError = error.response?.data?.error;
				setErrorMessage(
					typeof serverError === 'string'
						? serverError
						: 'Unable to send reset instructions right now.',
				);
				return;
			}

			setErrorMessage('Unable to send reset instructions right now.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10'>
			<div className='w-full max-w-xl rounded-3xl border border-border bg-white p-8 shadow-sm'>
				<div className='mb-8'>
					<p className='text-sm font-semibold uppercase tracking-[0.2em] text-care-blue'>
						Account Recovery
					</p>
					<h1 className='mt-2 text-2xl font-bold text-foreground'>
						Reset your password
					</h1>
					<p className='mt-3 text-sm leading-relaxed text-slate-600'>
						Use this if the invite belongs to an existing GoodCare account and you
						no longer remember the password.
					</p>
				</div>

				<form className='space-y-6' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='forgot-email'>Email address</Label>
						<Input
							id='forgot-email'
							type='email'
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							autoComplete='email'
							placeholder='name@example.com'
						/>
					</div>

					<div className='min-h-5'>
						{errorMessage ? (
							<p className='text-sm font-medium text-red-600'>{errorMessage}</p>
						) : null}
						{successMessage ? (
							<p className='text-sm font-medium text-green-600'>{successMessage}</p>
						) : null}
					</div>

					<div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
						<Link
							href={loginHref}
							className='inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted'>
							Back to login
						</Link>
						<Button
							type='submit'
							disabled={isSubmitting || !email.trim()}
							className='h-11 px-5 text-sm font-semibold'>
							{isSubmitting ? 'Sending...' : 'Send reset link'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
