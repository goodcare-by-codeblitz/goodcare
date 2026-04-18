'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildOrgAppUrl } from '@/lib/auth-session';
import {
	acceptInvite,
	getInviteErrorCode,
	getInviteErrorMessage,
	previewInvite,
} from '@/lib/invite';
import type { InvitePreview } from '@/lib/org-management';
import {
	ArrowRight,
	CheckCircle2,
	KeyRound,
	Lock,
	Mail,
	Shield,
	UserRoundCheck,
	UserX2,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
	FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

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
	const [statusMessage, setStatusMessage] = useState('');
	const autoAcceptAttemptedRef = useRef(false);
	const isSubmittingRef = useRef(false);
	const redirectingRef = useRef(false);

	const redirectToCarerAccepted = useCallback(
		(details: { organizationName: string; email: string; name: string }) => {
			if (redirectingRef.current) {
				return;
			}

			redirectingRef.current = true;
			setErrorMessage('');
			setStatusMessage('Opening mobile app setup...');

			const params = new URLSearchParams({
				org: details.organizationName,
				email: details.email,
				name: details.name,
			});
			window.location.replace(`/invite/accepted/carer?${params.toString()}`);
		},
		[],
	);

	const loadPreview = useCallback(async () => {
		if (redirectingRef.current) {
			return;
		}

		if (!token) {
			setErrorMessage('This invitation link is missing its token.');
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			setErrorMessage('');
			const result = await previewInvite(token);
			if (result.kind === 'CARER' && result.inviteState === 'accepted') {
				redirectToCarerAccepted({
					organizationName: result.organization.name,
					email: result.email,
					name: `${result.firstName} ${result.lastName}`.trim() || result.email,
				});
				return;
			}
			setPreview(result);
			setFirstName(result.firstName);
			setLastName(result.lastName);
		} catch (error) {
			if (redirectingRef.current) {
				return;
			}
			setErrorMessage(
				getInviteErrorMessage(error, 'Unable to load this invitation.'),
			);
		} finally {
			if (!redirectingRef.current) {
				setIsLoading(false);
			}
		}
	}, [redirectToCarerAccepted, token]);

	useEffect(() => {
		autoAcceptAttemptedRef.current = false;
		void loadPreview();
	}, [loadPreview]);

	const forgotPasswordPath = useMemo(() => {
		if (!preview) {
			return '/forgot-password';
		}

		const params = new URLSearchParams({
			email: preview.email,
			next: nextLoginPath,
		});

		return `/forgot-password?${params.toString()}`;
	}, [nextLoginPath, preview]);

	const loginHref = useMemo(() => {
		const params = new URLSearchParams({
			next: nextLoginPath,
		});

		if (preview?.email) {
			params.set('email', preview.email);
		}

		return `/login?${params.toString()}`;
	}, [nextLoginPath, preview?.email]);

	const performAcceptance = useCallback(
		async (input?: {
			password?: string;
			firstName?: string;
			lastName?: string;
		}) => {
			if (!token || !preview || isSubmittingRef.current || redirectingRef.current) {
				return;
			}

			isSubmittingRef.current = true;
			setIsSubmitting(true);
			setErrorMessage('');
			setStatusMessage('Joining organization...');

			try {
				const result = await acceptInvite({
					token,
					password: input?.password,
					firstName: input?.firstName,
					lastName: input?.lastName,
				});

				if (result.inviteKind === 'CARER') {
					redirectToCarerAccepted({
						organizationName: result.organization.name,
						email: result.email,
						name: `${firstName.trim()} ${lastName.trim()}`.trim() || result.email,
					});
					return;
				}

				const destination =
					buildOrgAppUrl(result.organization.slug, '/dashboard') ?? '/dashboard';
				redirectingRef.current = true;
				window.location.replace(destination);
			} catch (error) {
				const reason = getInviteErrorCode(error);
				setStatusMessage('');
				if (preview.kind === 'CARER' && reason === 'INVALID_INVITE_TOKEN') {
					await loadPreview();
					if (redirectingRef.current) {
						return;
					}

					setErrorMessage(
						getInviteErrorMessage(error, 'Unable to accept this invitation.'),
					);
				} else if (
					reason === 'INVITED_ACCOUNT_SIGN_IN_REQUIRED' ||
					reason === 'SIGNED_IN_AS_DIFFERENT_USER'
				) {
					await loadPreview();
					setErrorMessage(
						reason === 'SIGNED_IN_AS_DIFFERENT_USER'
							? 'You are signed in as a different GoodCare account. Switch accounts and try again.'
							: 'This invitation belongs to an existing account. Sign in or reset that account password before continuing.',
					);
				} else {
					setErrorMessage(
						getInviteErrorMessage(error, 'Unable to accept this invitation.'),
					);
				}
				isSubmittingRef.current = false;
				setIsSubmitting(false);
			}
		},
		[firstName, lastName, loadPreview, preview, redirectToCarerAccepted, token],
	);

	useEffect(() => {
		if (!preview || preview.kind === 'CARER') {
			return;
		}

		if (preview.acceptanceMode !== 'signed_in_match') {
			return;
		}

		if (autoAcceptAttemptedRef.current) {
			return;
		}

		autoAcceptAttemptedRef.current = true;
		void performAcceptance();
	}, [performAcceptance, preview]);

	const isCarerInvite = preview?.kind === 'CARER';
	const requiresPassword = preview?.acceptanceMode === 'new_user';
	const isExistingAccount = preview?.hasExistingAccount ?? false;
	const isFormerMember = preview?.wasFormerMember ?? false;
	const isSignedInMismatch = !isCarerInvite && preview?.acceptanceMode === 'signed_in_mismatch';
	const isSignedInMatch = !isCarerInvite && preview?.acceptanceMode === 'signed_in_match';
	const requiresExistingTeamLogin =
		!isCarerInvite && preview?.acceptanceMode === 'existing_user_login_required';

	const handleAccept = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!preview || !token || isSubmittingRef.current || redirectingRef.current) {
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

		await performAcceptance({
			password: requiresPassword ? password : undefined,
			firstName: firstName.trim() || undefined,
			lastName: lastName.trim() || undefined,
		});
	};

	const handleCheckAgain = async () => {
		if (redirectingRef.current) {
			return;
		}

		autoAcceptAttemptedRef.current = false;
		setStatusMessage('Checking sign-in status...');
		await loadPreview();
		if (!redirectingRef.current) {
			setStatusMessage('');
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
					{statusMessage ? (
						<div className='rounded-2xl border border-care-blue/20 bg-care-blue-light/40 px-4 py-3 text-sm font-medium text-care-blue'>
							{statusMessage}
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

					{preview && isExistingAccount ? (
						<div className='rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5'>
							<div className='flex items-start gap-3'>
								<UserRoundCheck className='mt-0.5 size-5 shrink-0 text-slate-600' />
								<div>
									<p className='text-sm font-semibold text-foreground'>
										{isFormerMember
											? 'This person previously belonged to this organization.'
											: 'This email already belongs to a GoodCare account.'}
									</p>
									<p className='mt-2 text-sm leading-relaxed text-slate-700'>
										{isCarerInvite
											? isFormerMember
												? 'The earlier membership ended, but the carer account was preserved. You can accept this invite directly and continue to the mobile app setup screen.'
												: 'This carer already has a GoodCare account, but you can still accept this invite directly from this page.'
											: isFormerMember
												? 'The organization membership ended earlier, but the underlying GoodCare account was preserved for history and audit records. Rejoining uses that same account.'
												: 'This invite must be accepted by signing in as the existing account rather than creating a second user.'}
									</p>
								</div>
							</div>
						</div>
					) : null}

					{isCarerInvite && preview?.currentSessionUser ? (
						<div className='rounded-2xl border border-care-blue/20 bg-care-blue-light/40 px-5 py-5'>
							<div className='flex items-start gap-3'>
								<CheckCircle2 className='mt-0.5 size-5 shrink-0 text-care-blue' />
								<div>
									<p className='text-sm font-semibold text-foreground'>
										This invite can be accepted directly.
									</p>
									<p className='mt-2 text-sm leading-relaxed text-slate-700'>
										This browser is currently signed in as{' '}
										<span className='font-semibold'>
											{preview.currentSessionUser.email}
										</span>
										, but accepting this carer invite will not sign that user out or
										change the current dashboard session.
									</p>
								</div>
							</div>
						</div>
					) : null}

					{isSignedInMismatch ? (
						<div className='rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5'>
							<div className='flex items-start gap-3'>
								<UserX2 className='mt-0.5 size-5 shrink-0 text-amber-700' />
								<div>
									<p className='text-sm font-semibold text-foreground'>
										You are signed in as a different account.
									</p>
									<p className='mt-2 text-sm leading-relaxed text-slate-700'>
										This invitation is for{' '}
										<span className='font-semibold'>{preview?.email}</span>, but this
										browser is currently signed in as{' '}
										<span className='font-semibold'>
											{preview?.currentSessionUser?.email}
										</span>
										. Sign in as the invited user to continue.
									</p>
									<div className='mt-4 flex flex-wrap gap-3'>
										<Link href={loginHref}>
											<Button className='gap-2'>
												<Lock className='size-4' aria-hidden='true' />
												Sign in as invited user
											</Button>
										</Link>
										<Link href={forgotPasswordPath}>
											<Button variant='outline' className='gap-2'>
												<KeyRound className='size-4' aria-hidden='true' />
												Reset invited account password
											</Button>
										</Link>
									</div>
								</div>
							</div>
						</div>
					) : requiresExistingTeamLogin ? (
						<div className='rounded-2xl border border-care-blue/20 bg-care-blue-light/40 px-5 py-5'>
							<div className='flex items-start gap-3'>
								<CheckCircle2 className='mt-0.5 size-5 shrink-0 text-care-blue' />
								<div>
									<p className='text-sm font-semibold text-foreground'>
										This invite belongs to an existing account.
									</p>
									<p className='mt-2 text-sm leading-relaxed text-slate-700'>
										Sign in as <span className='font-semibold'>{preview.email}</span> and
										we&apos;ll accept the invitation automatically as soon as the correct
										account returns here. If you no longer remember the password, reset
										it without creating a duplicate account.
									</p>
									<div className='mt-4 flex flex-wrap gap-3'>
										<Link href={loginHref}>
											<Button className='gap-2'>
												<Lock className='size-4' aria-hidden='true' />
												Sign in to continue
											</Button>
										</Link>
										<Link href={forgotPasswordPath}>
											<Button variant='outline' className='gap-2'>
												<KeyRound className='size-4' aria-hidden='true' />
												Reset password
											</Button>
										</Link>
										<Button
											type='button'
											variant='outline'
											onClick={() => void handleCheckAgain()}
											disabled={isSubmitting}>
											Check again
										</Button>
									</div>
								</div>
							</div>
						</div>
					) : isSignedInMatch ? (
						<div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800'>
							You are signed in as the invited account. We are accepting the
							invitation now and moving you into this organization.
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
											onChange={(event) =>
												setConfirmPassword(event.target.value)
											}
											autoComplete='new-password'
										/>
									</div>
								</div>
							) : null}

							{isCarerInvite ? (
								<div className='rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-sm leading-relaxed text-slate-700'>
									Accepting this invitation will link the carer to staff records and
									then take them to the mobile app download screen.
								</div>
							) : null}

							<div className='flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end'>
								<Link
									href={isCarerInvite ? '/' : '/login'}
									className='inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted'>
									{isCarerInvite ? 'Back home' : 'Back to login'}
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
