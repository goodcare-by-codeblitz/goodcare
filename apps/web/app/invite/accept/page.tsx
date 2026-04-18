'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { broadcastAuthEvent, buildOrgAppUrl } from '@/lib/auth-session';
import { acceptInvite, getInviteErrorMessage, previewInvite } from '@/lib/invite';
import type { InvitePreview } from '@/lib/org-management';
import { ArrowRight, CheckCircle2, Lock, Mail, Shield } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';

function roleSummary(preview: InvitePreview) {
	return preview.roles.map((role) => role.name).join(', ');
}

export default function AcceptInvitePage() {
	const searchParams = useSearchParams();
	const token = searchParams.get('token')?.trim() ?? '';
	const nextLoginPath = useMemo(
		() =>
			token ? `/invite/accept?token=${encodeURIComponent(token)}` : '/invite/accept',
		[token],
	);
	const [preview, setPreview] = useState<InvitePreview | null>(null);
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			if (!token) {
				setErrorMessage('This invitation link is missing its token.');
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);
				setErrorMessage('');
				const result = await previewInvite(token);
				if (!isMounted) {
					return;
				}

				setPreview(result);
				setFirstName(result.firstName);
				setLastName(result.lastName);
			} catch (error) {
				if (!isMounted) {
					return;
				}

				setErrorMessage(
					getInviteErrorMessage(error, 'Unable to load this invitation.'),
				);
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		void load();

		return () => {
			isMounted = false;
		};
	}, [token]);

	const requiresPassword = preview?.acceptanceMode === 'new_user';

	const handleAccept = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!preview || !token) {
			return;
		}

		if (requiresPassword) {
			if (password.length < 8) {
				setErrorMessage('Please choose a password with at least 8 characters.');
				return;
			}

			if (password !== confirmPassword) {
				setErrorMessage('Password confirmation does not match.');
				return;
			}
		}

		try {
			setIsSubmitting(true);
			setErrorMessage('');
			const result = await acceptInvite({
				token,
				password: requiresPassword ? password : undefined,
				firstName: firstName.trim() || undefined,
				lastName: lastName.trim() || undefined,
			});

			broadcastAuthEvent('login');
			const destination =
				buildOrgAppUrl(result.organization.slug, '/dashboard') ?? '/dashboard';
			window.location.replace(destination);
		} catch (error) {
			setErrorMessage(
				getInviteErrorMessage(error, 'Unable to accept this invitation.'),
			);
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10'>
				<div className='w-full max-w-xl rounded-3xl border border-border bg-white p-8 shadow-sm'>
					<p className='text-sm text-slate-500'>Loading invitation...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10'>
			<div className='w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-white shadow-sm'>
				<div className='border-b border-border bg-care-blue px-8 py-8 text-white'>
					<div className='flex items-center gap-3'>
						<div className='flex size-12 items-center justify-center rounded-2xl bg-white/15'>
							<Shield className='size-6' aria-hidden='true' />
						</div>
						<div>
							<p className='text-sm font-semibold uppercase tracking-[0.2em] text-white/75'>
								Invitation
							</p>
							<h1 className='mt-1 text-2xl font-bold'>
								Join {preview?.organization.name ?? 'Good Care'}
							</h1>
						</div>
					</div>
				</div>

				<div className='space-y-6 px-8 py-8'>
					{errorMessage ? (
						<div className='rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'>
							{errorMessage}
						</div>
					) : null}

					{preview ? (
						<div className='grid gap-4 rounded-2xl border border-border bg-slate-50 px-5 py-5 sm:grid-cols-2'>
							<div>
								<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
									Invitee
								</p>
								<p className='mt-1 text-sm font-semibold text-foreground'>
									{preview.firstName} {preview.lastName}
								</p>
								<p className='mt-1 inline-flex items-center gap-2 text-sm text-slate-600'>
									<Mail className='size-4' aria-hidden='true' />
									{preview.email}
								</p>
							</div>
							<div>
								<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
									Access
								</p>
								<p className='mt-1 text-sm font-semibold text-foreground'>
									{preview.kind === 'TEAM' ? 'Team access' : 'Carer access'}
								</p>
								<p className='mt-1 text-sm text-slate-600'>{roleSummary(preview)}</p>
							</div>
						</div>
					) : null}

					{preview?.acceptanceMode === 'existing_user_login_required' ? (
						<div className='rounded-2xl border border-care-blue/20 bg-care-blue-light/40 px-5 py-5'>
							<div className='flex items-start gap-3'>
								<CheckCircle2 className='mt-0.5 size-5 shrink-0 text-care-blue' />
								<div>
									<p className='text-sm font-semibold text-foreground'>
										This invite belongs to an existing account.
									</p>
									<p className='mt-2 text-sm leading-relaxed text-slate-700'>
										Sign in as <span className='font-semibold'>{preview.email}</span> and
										then continue the acceptance flow. Your existing password stays the
										same.
									</p>
									<div className='mt-4 flex flex-wrap gap-3'>
										<Link href={`/login?next=${encodeURIComponent(nextLoginPath)}`}>
											<Button className='gap-2'>
												<Lock className='size-4' aria-hidden='true' />
												Sign in to continue
											</Button>
										</Link>
										<button
											type='button'
											onClick={() => window.location.reload()}
											className='inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted'>
											I already signed in
										</button>
									</div>
								</div>
							</div>
						</div>
					) : (
						<form className='space-y-6' onSubmit={handleAccept}>
							<div className='grid gap-5 sm:grid-cols-2'>
								<div className='space-y-2'>
									<Label htmlFor='invite-firstName'>First name</Label>
									<Input
										id='invite-firstName'
										value={firstName}
										onChange={(event) => setFirstName(event.target.value)}
										autoComplete='given-name'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='invite-lastName'>Last name</Label>
									<Input
										id='invite-lastName'
										value={lastName}
										onChange={(event) => setLastName(event.target.value)}
										autoComplete='family-name'
									/>
								</div>
							</div>

							{requiresPassword ? (
								<div className='grid gap-5 sm:grid-cols-2'>
									<div className='space-y-2'>
										<Label htmlFor='invite-password'>Password</Label>
										<Input
											id='invite-password'
											type='password'
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											autoComplete='new-password'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='invite-confirmPassword'>Confirm password</Label>
										<Input
											id='invite-confirmPassword'
											type='password'
											value={confirmPassword}
											onChange={(event) => setConfirmPassword(event.target.value)}
											autoComplete='new-password'
										/>
									</div>
								</div>
							) : (
								<div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800'>
									You are already signed in as the invited account, so we only need your
									confirmation to join this organization.
								</div>
							)}

							<div className='flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end'>
								<Link
									href='/login'
									className='inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted'>
									Back to login
								</Link>
								<Button type='submit' disabled={isSubmitting} className='h-11 gap-2 px-5'>
									{isSubmitting ? 'Joining...' : 'Accept invitation'}
									<ArrowRight className='size-4' aria-hidden='true' />
								</Button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
