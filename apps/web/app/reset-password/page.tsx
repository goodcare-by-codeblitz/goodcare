'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { broadcastAuthEvent } from '@/lib/auth-session';
import axios from 'axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';

function getBackendBaseUrl() {
	const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.replace(/\/+$/, '');
	if (!baseUrl) {
		throw new Error('Missing NEXT_PUBLIC_BACKEND_BASE_URL in apps/web/.env');
	}

	return baseUrl;
}

export default function ResetPasswordPage() {
	const searchParams = useSearchParams();
	const token = searchParams.get('token')?.trim() ?? '';
	const nextPath = searchParams.get('next') ?? '';
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!token) {
			setErrorMessage('This reset link is missing its token.');
			return;
		}

		if (password.length < 8) {
			setErrorMessage('Please choose a password with at least 8 characters.');
			return;
		}

		if (password !== confirmPassword) {
			setErrorMessage('Password confirmation does not match.');
			return;
		}

		try {
			setIsSubmitting(true);
			setErrorMessage('');

			await axios.post(
				`${getBackendBaseUrl()}/v1/auth/reset-password`,
				{
					token,
					newPassword: password,
				},
				{
					withCredentials: true,
				},
			);

			broadcastAuthEvent('login');
			window.location.replace(
				nextPath.startsWith('/') ? nextPath : '/',
			);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const serverError = error.response?.data?.error;
				setErrorMessage(
					typeof serverError === 'string'
						? serverError
						: 'Unable to reset your password.',
				);
				return;
			}

			setErrorMessage('Unable to reset your password.');
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
						Choose a new password
					</h1>
					<p className='mt-3 text-sm leading-relaxed text-slate-600'>
						Once you reset your password, we&apos;ll sign you back in and return you to
						your invitation flow if one was waiting.
					</p>
				</div>

				<form className='space-y-6' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='reset-password'>New password</Label>
						<Input
							id='reset-password'
							type='password'
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							autoComplete='new-password'
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='reset-confirmPassword'>Confirm password</Label>
						<Input
							id='reset-confirmPassword'
							type='password'
							value={confirmPassword}
							onChange={(event) => setConfirmPassword(event.target.value)}
							autoComplete='new-password'
						/>
					</div>

					<div className='min-h-5'>
						{errorMessage ? (
							<p className='text-sm font-medium text-red-600'>{errorMessage}</p>
						) : null}
					</div>

					<div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
						<Link
							href='/login'
							className='inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted'>
							Back to login
						</Link>
						<Button
							type='submit'
							disabled={isSubmitting || !token}
							className='h-11 px-5 text-sm font-semibold'>
							{isSubmitting ? 'Updating...' : 'Reset password'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
