'use client';

import { BoundingBox } from '@/components/dashboard/bounding-box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	fetchCarerInvites,
	fetchCarers,
	getCurrentOrgContext,
	getOrgManagementError,
	getOrgManagementStatusCode,
	revokeCarerInvite,
	type CarerInvite,
	type CarerListItem,
	type CarerStatus,
} from '@/lib/org-management';
import { cn } from '@/lib/utils';
import {
	Clock,
	Mail,
	Search,
	UserPlus,
	Users,
	X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type FilterStatus = 'ALL' | Exclude<CarerStatus, 'TERMINATED'>;

function formatDate(date: string) {
	return new Date(date).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

function getAvatarColor(seed: string) {
	const palette = [
		'bg-care-blue text-white',
		'bg-emerald-500 text-white',
		'bg-amber-500 text-white',
		'bg-pink-500 text-white',
		'bg-slate-500 text-white',
	];

	const hash = seed.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
	return palette[hash % palette.length];
}

function CarerStatusBadge({ status }: { status: FilterStatus }) {
	const styles: Record<FilterStatus, string> = {
		ACTIVE: 'bg-success/10 text-success border border-success/20',
		ON_LEAVE: 'bg-care-blue-light text-care-blue border border-care-blue/20',
		SUSPENDED: 'bg-warning/10 text-warning border border-warning/20',
		ALL: '',
	};
	const labels: Record<FilterStatus, string> = {
		ACTIVE: 'Active',
		ON_LEAVE: 'On Leave',
		SUSPENDED: 'Suspended',
		ALL: 'All',
	};

	if (status === 'ALL') {
		return null;
	}

	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
				styles[status],
			)}>
			{labels[status]}
		</span>
	);
}

function CarerRow({ carer }: { carer: CarerListItem }) {
	const initials = `${carer.firstName[0] ?? ''}${carer.lastName[0] ?? ''}`.toUpperCase();
	const avatarClassName = getAvatarColor(`${carer.firstName}${carer.lastName}`);

	return (
		<Link
			href={`/dashboard/staff/${carer.id}`}
			className='flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50'>
			<span
				className={cn(
					'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
					avatarClassName,
				)}>
				{initials}
			</span>

			<div className='min-w-0 flex-1'>
				<p className='truncate text-sm font-semibold text-foreground'>
					{carer.firstName} {carer.lastName}
				</p>
				<p className='truncate text-xs text-slate-500'>{carer.email}</p>
			</div>

			<p className='hidden w-24 shrink-0 text-xs font-medium text-slate-600 sm:block'>
				{carer.employmentType}
			</p>

			<p className='hidden w-20 shrink-0 text-xs font-medium text-slate-600 md:block'>
				{carer.experienceYears} yr{carer.experienceYears === 1 ? '' : 's'}
			</p>

			<div className='hidden sm:block'>
				<CarerStatusBadge status={carer.status as FilterStatus} />
			</div>

			<p className='hidden w-24 shrink-0 text-xs text-slate-400 xl:block'>
				{formatDate(carer.hireDate)}
			</p>
		</Link>
	);
}

function PendingInviteRow({
	invite,
	onRevoke,
	isRevoking,
}: {
	invite: CarerInvite;
	onRevoke: (inviteId: string) => void;
	isRevoking: boolean;
}) {
	const initials = `${invite.firstName[0] ?? ''}${invite.lastName[0] ?? ''}`.toUpperCase();
	const avatarClassName = getAvatarColor(`${invite.firstName}${invite.lastName}`);
	const expires = new Date(invite.expiresAt);
	const daysLeft = Math.ceil(
		(expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
	);

	return (
		<div className='flex items-center gap-4 px-6 py-4'>
			<span
				className={cn(
					'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
					avatarClassName,
				)}>
				{initials}
			</span>

			<div className='min-w-0 flex-1'>
				<p className='truncate text-sm font-semibold text-foreground'>
					{invite.firstName} {invite.lastName}
				</p>
				<p className='truncate text-xs text-slate-500'>{invite.email}</p>
			</div>

			<div className='hidden lg:block'>
				<p className='text-xs font-medium text-slate-600'>
					Invited by {invite.invitedBy.firstName} {invite.invitedBy.lastName}
				</p>
			</div>

			<div className='hidden items-center gap-1 text-xs text-slate-400 xl:flex'>
				<Clock className='size-3' aria-hidden='true' />
				<span>{daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}</span>
			</div>

			<button
				type='button'
				onClick={() => onRevoke(invite.id)}
				disabled={isRevoking}
				className='flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-error/10 hover:text-error focus-visible:ring-2 focus-visible:ring-error/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
				aria-label={`Revoke invitation for ${invite.firstName} ${invite.lastName}`}>
				<X className='size-4' />
			</button>
		</div>
	);
}

export default function StaffPage() {
	const [organizationId, setOrganizationId] = useState<string | null>(null);
	const [search, setSearch] = useState('');
	const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
	const [carers, setCarers] = useState<CarerListItem[]>([]);
	const [pendingInvites, setPendingInvites] = useState<CarerInvite[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRevokingInviteId, setIsRevokingInviteId] = useState<string | null>(null);
	const [canManageCarers, setCanManageCarers] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const [inviteErrorMessage, setInviteErrorMessage] = useState('');
	const [actionMessage, setActionMessage] = useState('');

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				setIsLoading(true);
				setErrorMessage('');
				setInviteErrorMessage('');

				const org = await getCurrentOrgContext();
				if (!isMounted) {
					return;
				}

				setOrganizationId(org.organizationId);

				const [carersResult, invitesResult] = await Promise.allSettled([
					fetchCarers(org.organizationId, { limit: 100 }),
					fetchCarerInvites(org.organizationId),
				]);

				if (!isMounted) {
					return;
				}

				if (carersResult.status === 'fulfilled') {
					setCarers(
						carersResult.value.filter((carer) => carer.status !== 'TERMINATED'),
					);
				} else {
					setErrorMessage(
						getOrgManagementError(
							carersResult.reason,
							'Unable to load carers.',
						),
					);
				}

				if (invitesResult.status === 'fulfilled') {
					setPendingInvites(invitesResult.value);
					setCanManageCarers(true);
				} else {
					const statusCode = getOrgManagementStatusCode(invitesResult.reason);
					if (statusCode === 403) {
						setCanManageCarers(false);
						setPendingInvites([]);
					} else {
						setInviteErrorMessage(
							getOrgManagementError(
								invitesResult.reason,
								'Unable to load pending carer invitations.',
							),
						);
					}
				}
			} catch (error) {
				if (isMounted) {
					setErrorMessage(
						getOrgManagementError(
							error,
							'Unable to load the staff management page.',
						),
					);
				}
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
	}, []);

	const filteredCarers = carers.filter((carer) => {
		const query = search.trim().toLowerCase();
		const matchesSearch =
			query.length === 0 ||
			`${carer.firstName} ${carer.lastName}`.toLowerCase().includes(query) ||
			carer.email.toLowerCase().includes(query) ||
			carer.employmentType.toLowerCase().includes(query);
		const matchesStatus =
			filterStatus === 'ALL' || carer.status === filterStatus;

		return matchesSearch && matchesStatus;
	});

	const counts = {
		total: carers.length,
		active: carers.filter((carer) => carer.status === 'ACTIVE').length,
		onLeave: carers.filter((carer) => carer.status === 'ON_LEAVE').length,
		suspended: carers.filter((carer) => carer.status === 'SUSPENDED').length,
	};

	const handleRevokeInvite = async (inviteId: string) => {
		if (!organizationId) {
			return;
		}

		try {
			setIsRevokingInviteId(inviteId);
			setActionMessage('');
			setInviteErrorMessage('');
			await revokeCarerInvite(organizationId, inviteId);
			setPendingInvites((current) =>
				current.filter((invite) => invite.id !== inviteId),
			);
			setActionMessage('Invitation revoked successfully.');
		} catch (error) {
			setInviteErrorMessage(
				getOrgManagementError(error, 'Unable to revoke invitation.'),
			);
		} finally {
			setIsRevokingInviteId(null);
		}
	};

	return (
		<BoundingBox>
			<div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
				<div>
					<div className='flex items-center gap-3'>
						<div className='flex size-10 items-center justify-center rounded-xl bg-care-blue-light'>
							<Users className='size-5 text-care-blue' aria-hidden='true' />
						</div>
						<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
							Staff Management
						</h1>
					</div>
					<p className='mt-3 max-w-xl text-sm leading-relaxed text-slate-600'>
						Manage carers, track employment status, and review pending carer
						invitations from one place.
					</p>
				</div>

				{canManageCarers ? (
					<Link href='/dashboard/staff/new' className='shrink-0'>
						<Button className='h-10 gap-2 bg-care-blue text-sm font-semibold shadow-md hover:bg-care-blue-hover'>
							<UserPlus className='size-4' aria-hidden='true' />
							Add Carer
						</Button>
					</Link>
				) : null}
			</div>

			<div className='mb-4 min-h-5'>
				{errorMessage ? (
					<p className='text-sm font-medium text-red-600'>{errorMessage}</p>
				) : null}
				{inviteErrorMessage ? (
					<p className='text-sm font-medium text-red-600'>{inviteErrorMessage}</p>
				) : null}
				{actionMessage ? (
					<p className='text-sm font-medium text-green-600'>{actionMessage}</p>
				) : null}
			</div>

			<div className='mb-6 grid grid-cols-2 divide-x divide-border rounded-xl border border-border bg-white shadow-sm sm:grid-cols-4'>
				<div className='px-5 py-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
						Total Carers
					</p>
					<p className='mt-1 text-2xl font-bold text-foreground'>{counts.total}</p>
				</div>
				<div className='px-5 py-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
						Active
					</p>
					<p className='mt-1 text-2xl font-bold text-success'>{counts.active}</p>
				</div>
				<div className='border-t border-border px-5 py-4 sm:border-t-0'>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
						On Leave
					</p>
					<p className='mt-1 text-2xl font-bold text-care-blue'>{counts.onLeave}</p>
				</div>
				<div className='border-t border-border px-5 py-4 sm:border-t-0'>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
						Pending Invites
					</p>
					<p className='mt-1 text-2xl font-bold text-warning'>
						{canManageCarers ? pendingInvites.length : 0}
					</p>
				</div>
			</div>

			<div className='rounded-xl border border-border bg-white shadow-sm'>
				<div className='flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between'>
					<div className='flex flex-wrap gap-2'>
						{(['ALL', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED'] as const).map((status) => (
							<button
								key={status}
								type='button'
								onClick={() => setFilterStatus(status)}
								className={cn(
									'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
									filterStatus === status
										? 'bg-care-blue text-white shadow-sm'
										: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
								)}>
								{status === 'ALL'
									? 'All'
									: status === 'ON_LEAVE'
										? 'On Leave'
										: status.charAt(0) + status.slice(1).toLowerCase()}
							</button>
						))}
					</div>
					<div className='relative w-full sm:w-64'>
						<Search
							className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400'
							aria-hidden='true'
						/>
						<Input
							type='search'
							placeholder='Search name or email...'
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className='h-9 pl-9 text-sm'
							aria-label='Search carers'
						/>
					</div>
				</div>

				<div className='hidden grid-cols-[auto_1fr_6rem_5rem_6rem_6rem] items-center gap-4 border-b border-border px-6 py-2.5 lg:grid'>
					<span className='w-10' />
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Carer
					</span>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Type
					</span>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Experience
					</span>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Status
					</span>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Hired
					</span>
				</div>

				{isLoading ? (
					<div className='px-6 py-12 text-sm text-slate-500'>Loading carers...</div>
				) : filteredCarers.length > 0 ? (
					<ul role='list' className='divide-y divide-border'>
						{filteredCarers.map((carer) => (
							<li key={carer.id}>
								<CarerRow carer={carer} />
							</li>
						))}
					</ul>
				) : (
					<div className='flex flex-col items-center gap-2 px-6 py-12 text-center'>
						<Search className='size-8 text-slate-300' aria-hidden='true' />
						<p className='text-sm font-semibold text-foreground'>No carers found</p>
						<p className='text-xs text-slate-500'>
							Try a different name or adjust the filter.
						</p>
					</div>
				)}
			</div>

			{canManageCarers ? (
				<section aria-labelledby='pending-invites-heading' className='mt-6'>
					<div className='rounded-xl border border-border bg-white shadow-sm'>
						<div className='flex items-center justify-between border-b border-border px-6 py-4'>
							<div>
								<h2
									id='pending-invites-heading'
									className='font-heading text-base font-bold text-foreground'>
									Pending Invitations
									<span className='ml-2 text-sm font-normal text-slate-400'>
										({pendingInvites.length})
									</span>
								</h2>
								<p className='mt-0.5 text-xs text-slate-500'>
									Invited carers appear here until they accept their invitation.
								</p>
							</div>
							{pendingInvites.length > 0 ? (
								<div className='hidden items-center gap-1.5 text-xs font-semibold text-slate-500 sm:flex'>
									<Mail className='size-3.5' aria-hidden='true' />
									Caregiver access
								</div>
							) : null}
						</div>

						{pendingInvites.length > 0 ? (
							<ul role='list' className='divide-y divide-border'>
								{pendingInvites.map((invite) => (
									<li key={invite.id}>
										<PendingInviteRow
											invite={invite}
											onRevoke={handleRevokeInvite}
											isRevoking={isRevokingInviteId === invite.id}
										/>
									</li>
								))}
							</ul>
						) : (
							<div className='px-6 py-10 text-center'>
								<p className='text-sm font-semibold text-foreground'>
									No pending carer invites
								</p>
								<p className='mt-1 text-xs text-slate-500'>
									New carer invitations will appear here after they are sent.
								</p>
							</div>
						)}
					</div>
				</section>
			) : null}
		</BoundingBox>
	);
}
