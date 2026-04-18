'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	fetchTeamInvites,
	fetchTeamMembers,
	getCurrentOrgContext,
	getOrgManagementError,
	revokeTeamInvite,
	type TeamInvite,
	type TeamMember,
} from '@/lib/org-management';
import {
	ChevronRight,
	Clock,
	Mail,
	Search,
	Shield,
	UserPlus,
	Users,
	X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type MemberStatus = 'ACTIVE' | 'SUSPENDED';

function formatDate(date: string | null) {
	if (!date) {
		return 'N/A';
	}

	return new Date(date).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

function MemberStatusBadge({ status }: { status: MemberStatus }) {
	const styles: Record<MemberStatus, string> = {
		ACTIVE: 'bg-success/10 text-success border border-success/20',
		SUSPENDED: 'bg-warning/10 text-warning border border-warning/20',
	};

	return (
		<span
			className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
			{status === 'ACTIVE' ? 'Active' : 'Suspended'}
		</span>
	);
}

function RolePill({ name }: { name: string }) {
	return (
		<span className='inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700'>
			<Shield className='size-3 text-slate-400' aria-hidden='true' />
			{name}
		</span>
	);
}

function RolePillList({ roles }: { roles: Array<{ id: string; name: string }> }) {
	if (roles.length === 0) {
		return <RolePill name='Unassigned' />;
	}

	return (
		<div className='flex flex-wrap gap-1.5'>
			{roles.map((role) => (
				<RolePill key={role.id} name={role.name} />
			))}
		</div>
	);
}

function MemberRow({ member }: { member: TeamMember }) {
	const initials = `${member.user.firstName[0] ?? ''}${member.user.lastName[0] ?? ''}`.toUpperCase();

	return (
		<Link
			href={`/dashboard/settings/team/${member.userId}`}
			className='group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none'
			aria-label={`View profile of ${member.user.firstName} ${member.user.lastName}`}>
			<span className='inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-care-blue/10 text-sm font-bold text-care-blue'>
				{initials}
			</span>

			<div className='min-w-0 flex-1'>
				<p className='truncate text-sm font-semibold text-foreground'>
					{member.user.firstName} {member.user.lastName}
				</p>
				<p className='truncate text-xs text-slate-500'>{member.user.email}</p>
			</div>

			<div className='hidden w-72 flex-wrap gap-1.5 lg:flex'>
				<RolePillList roles={member.roles} />
			</div>

			<div className='hidden sm:block'>
				<MemberStatusBadge status={member.status} />
			</div>

			<p className='hidden w-24 shrink-0 text-xs text-slate-400 xl:block'>
				{formatDate(member.joinedAt)}
			</p>

			<ChevronRight className='size-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500' />
		</Link>
	);
}

function PendingInviteRow({
	invite,
	onRevoke,
}: {
	invite: TeamInvite;
	onRevoke: (inviteId: string) => void;
}) {
	const expires = new Date(invite.expiresAt);
	const now = new Date();
	const daysLeft = Math.ceil(
		(expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
	);

	return (
		<div className='flex items-center gap-4 px-6 py-4'>
			<span className='inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-200 bg-slate-50 text-xs font-bold text-slate-400'>
				{invite.firstName[0]}
				{invite.lastName[0]}
			</span>

			<div className='min-w-0 flex-1'>
				<p className='truncate text-sm font-semibold text-foreground'>
					{invite.firstName} {invite.lastName}
				</p>
				<p className='truncate text-xs text-slate-500'>{invite.email}</p>
			</div>

			<div className='hidden lg:block'>
				<RolePillList roles={invite.roles} />
			</div>

			<div className='hidden sm:block'>
				<span className='inline-flex items-center gap-1 rounded-full border border-care-blue/20 bg-care-blue-light px-2.5 py-0.5 text-xs font-semibold text-care-blue'>
					Invited
				</span>
			</div>

			<div className='hidden items-center gap-1 text-xs text-slate-400 xl:flex'>
				<Clock className='size-3' aria-hidden='true' />
				<span>{daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}</span>
			</div>

			<button
				type='button'
				onClick={() => onRevoke(invite.id)}
				className='flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-error/10 hover:text-error focus-visible:ring-2 focus-visible:ring-error/50 focus-visible:outline-none'
				aria-label={`Revoke invitation for ${invite.firstName} ${invite.lastName}`}>
				<X className='size-4' />
			</button>
		</div>
	);
}

export default function TeamSettingsPage() {
	const [search, setSearch] = useState('');
	const [members, setMembers] = useState<TeamMember[]>([]);
	const [invites, setInvites] = useState<TeamInvite[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const [actionMessage, setActionMessage] = useState('');

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				setIsLoading(true);
				setErrorMessage('');
				const org = await getCurrentOrgContext();
				const [nextMembers, nextInvites] = await Promise.all([
					fetchTeamMembers(org.organizationId),
					fetchTeamInvites(org.organizationId),
				]);

				if (!isMounted) {
					return;
				}

				setMembers(nextMembers);
				setInvites(nextInvites);
			} catch (error) {
				if (!isMounted) {
					return;
				}

				setErrorMessage(
					getOrgManagementError(error, 'Unable to load team settings.'),
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
	}, []);

	const filteredMembers = members.filter((member) => {
		const query = search.trim().toLowerCase();
		if (!query) {
			return true;
		}

		const fullName = `${member.user.firstName} ${member.user.lastName}`.toLowerCase();
		return (
			fullName.includes(query) ||
			member.user.email.toLowerCase().includes(query) ||
			member.roles.some((role) => role.name.toLowerCase().includes(query))
		);
	});

	const activeCount = members.filter((member) => member.status === 'ACTIVE').length;

	const handleRevokeInvite = async (inviteId: string) => {
		try {
			setErrorMessage('');
			setActionMessage('');
			const org = await getCurrentOrgContext();
			await revokeTeamInvite(org.organizationId, inviteId);
			setInvites((current) => current.filter((invite) => invite.id !== inviteId));
			setActionMessage('Invitation revoked successfully.');
		} catch (error) {
			setErrorMessage(
				getOrgManagementError(error, 'Unable to revoke invitation.'),
			);
		}
	};

	return (
		<div className='mx-auto max-w-6/12 p-4 lg:p-8'>
			<nav aria-label='Breadcrumb' className='mb-6'>
				<ol className='flex items-center gap-1.5 text-sm'>
					<li>
						<Link
							href='/dashboard/settings'
							className='font-medium text-slate-500 transition-colors hover:text-care-blue'>
							Settings
						</Link>
					</li>
					<li aria-hidden='true'>
						<ChevronRight className='size-3.5 text-slate-400' />
					</li>
					<li>
						<span className='font-semibold text-foreground' aria-current='page'>
							Team
						</span>
					</li>
				</ol>
			</nav>

			<div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
				<div>
					<div className='flex items-center gap-3'>
						<div className='flex size-10 items-center justify-center rounded-xl bg-care-blue-light'>
							<Users className='size-5 text-care-blue' aria-hidden='true' />
						</div>
						<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
							Team Members
						</h1>
					</div>
					<p className='mt-3 max-w-xl text-sm leading-relaxed text-slate-600'>
						Manage organization admins, managers, and viewers. Carers are onboarded
						separately through the Staff area.
					</p>
				</div>

				<div className='flex shrink-0 flex-wrap gap-3'>
					<Link href='/dashboard/settings/team/roles'>
						<Button variant='outline' className='h-10 text-sm font-semibold'>
							<Shield className='size-4' aria-hidden='true' />
							Manage Roles
						</Button>
					</Link>
					<Link href='/dashboard/settings/team/invite'>
						<Button className='h-10 gap-2 bg-care-blue text-sm font-semibold shadow-md hover:bg-care-blue-hover'>
							<UserPlus className='size-4' aria-hidden='true' />
							Invite Team Member
						</Button>
					</Link>
				</div>
			</div>

			<div className='mb-4 min-h-5'>
				{errorMessage ? (
					<p className='text-sm font-medium text-red-600'>{errorMessage}</p>
				) : null}
				{actionMessage ? (
					<p className='text-sm font-medium text-green-600'>{actionMessage}</p>
				) : null}
			</div>

			<div className='mb-6 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-white shadow-sm'>
				<div className='px-5 py-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
						Total Members
					</p>
					<p className='mt-1 text-2xl font-bold text-foreground'>{members.length}</p>
				</div>
				<div className='px-5 py-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
						Active
					</p>
					<p className='mt-1 text-2xl font-bold text-success'>{activeCount}</p>
				</div>
				<div className='px-5 py-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
						Pending Invites
					</p>
					<p className='mt-1 text-2xl font-bold text-care-blue'>{invites.length}</p>
				</div>
			</div>

			<section aria-labelledby='members-heading' className='mb-6'>
				<div className='rounded-xl border border-border bg-white shadow-sm'>
					<div className='flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between'>
						<h2
							id='members-heading'
							className='font-heading text-base font-bold text-foreground'>
							Members
							<span className='ml-2 text-sm font-normal text-slate-400'>
								({members.length})
							</span>
						</h2>
						<div className='relative w-full sm:w-64'>
							<Search
								className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400'
								aria-hidden='true'
							/>
							<Input
								type='search'
								placeholder='Search name, email, or role...'
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className='h-9 pl-9 text-sm'
								aria-label='Search team members'
							/>
						</div>
					</div>

					<div className='hidden grid-cols-[auto_1fr_18rem_7rem_6rem_1.5rem] items-center gap-4 border-b border-border px-6 py-2.5 lg:grid'>
						<span className='w-10' />
						<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
							Member
						</span>
						<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
							Role
						</span>
						<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
							Status
						</span>
						<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
							Joined
						</span>
						<span />
					</div>

					{isLoading ? (
						<div className='px-6 py-12 text-sm text-slate-500'>Loading team members...</div>
					) : filteredMembers.length > 0 ? (
						<ul role='list' className='divide-y divide-border'>
							{filteredMembers.map((member) => (
								<li key={member.id}>
									<MemberRow member={member} />
								</li>
							))}
						</ul>
					) : (
						<div className='flex flex-col items-center gap-2 px-6 py-12 text-center'>
							<Search className='size-8 text-slate-300' aria-hidden='true' />
							<p className='text-sm font-semibold text-foreground'>No members found</p>
							<p className='text-xs text-slate-500'>
								Try a different name, email, or role.
							</p>
						</div>
					)}
				</div>
			</section>

			{invites.length > 0 && (
				<section aria-labelledby='invites-heading'>
					<div className='rounded-xl border border-border bg-white shadow-sm'>
						<div className='flex items-center justify-between border-b border-border px-6 py-4'>
							<div>
								<h2
									id='invites-heading'
									className='font-heading text-base font-bold text-foreground'>
									Pending Invitations
									<span className='ml-2 text-sm font-normal text-slate-400'>
										({invites.length})
									</span>
								</h2>
								<p className='mt-0.5 text-xs text-slate-500'>
									These invitations are awaiting acceptance and expire after 7 days.
								</p>
							</div>
							<Link
								href='/dashboard/settings/team/invite'
								className='hidden items-center gap-1.5 text-xs font-semibold text-care-blue hover:underline sm:flex'>
								<Mail className='size-3.5' aria-hidden='true' />
								Send another invite
							</Link>
						</div>

						<ul role='list' className='divide-y divide-border'>
							{invites.map((invite) => (
								<li key={invite.id}>
									<PendingInviteRow invite={invite} onRevoke={handleRevokeInvite} />
								</li>
							))}
						</ul>
					</div>
				</section>
			)}
		</div>
	);
}
