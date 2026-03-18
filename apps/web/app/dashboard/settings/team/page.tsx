'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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
import { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type MemberStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

interface TeamMember {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	status: MemberStatus;
	roles: string[];
	joinedAt: string | null;
	invitedAt: string;
	avatarColor: string;
}

interface PendingInvite {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	invitedAt: string;
	expiresAt: string;
	invitedBy: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_MEMBERS: TeamMember[] = [
	{
		id: 'u1',
		firstName: 'Priya',
		lastName: 'Sharma',
		email: 'priya.sharma@sunrisecare.co.uk',
		status: 'ACTIVE',
		roles: ['Organisation Admin'],
		joinedAt: '2024-09-01',
		invitedAt: '2024-08-25',
		avatarColor: '#6366f1',
	},
	{
		id: 'u2',
		firstName: 'James',
		lastName: 'Porter',
		email: 'james.porter@sunrisecare.co.uk',
		status: 'ACTIVE',
		roles: ['Care Manager', 'Compliance Officer'],
		joinedAt: '2024-10-14',
		invitedAt: '2024-10-08',
		avatarColor: '#0ea5e9',
	},
	{
		id: 'u3',
		firstName: 'Fatima',
		lastName: 'Al-Rashid',
		email: 'f.alrashid@sunrisecare.co.uk',
		status: 'ACTIVE',
		roles: ['Scheduling Manager'],
		joinedAt: '2025-01-06',
		invitedAt: '2024-12-20',
		avatarColor: '#f59e0b',
	},
	{
		id: 'u4',
		firstName: 'Thomas',
		lastName: 'Wade',
		email: 'thomas.wade@sunrisecare.co.uk',
		status: 'SUSPENDED',
		roles: ['Read-Only Viewer'],
		joinedAt: '2025-02-10',
		invitedAt: '2025-02-03',
		avatarColor: '#64748b',
	},
];

const MOCK_INVITES: PendingInvite[] = [
	{
		id: 'i1',
		email: 'sarah.whitmore@sunrisecare.co.uk',
		firstName: 'Sarah',
		lastName: 'Whitmore',
		role: 'Care Manager',
		invitedAt: '2026-03-10',
		expiresAt: '2026-03-17',
		invitedBy: 'Priya Sharma',
	},
	{
		id: 'i2',
		email: 'compliance@sunrisecare.co.uk',
		firstName: 'Marcus',
		lastName: 'Bell',
		role: 'Compliance Officer',
		invitedAt: '2026-03-11',
		expiresAt: '2026-03-18',
		invitedBy: 'Priya Sharma',
	},
];

/* ------------------------------------------------------------------ */
/*  MemberStatusBadge                                                  */
/* ------------------------------------------------------------------ */

function MemberStatusBadge({ status }: { status: MemberStatus }) {
	const styles: Record<MemberStatus, string> = {
		ACTIVE: 'bg-success/10 text-success border border-success/20',
		INVITED: 'bg-care-blue-light text-care-blue border border-care-blue/20',
		SUSPENDED: 'bg-warning/10 text-warning border border-warning/20',
	};
	const labels: Record<MemberStatus, string> = {
		ACTIVE: 'Active',
		INVITED: 'Invited',
		SUSPENDED: 'Suspended',
	};
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

/* ------------------------------------------------------------------ */
/*  RolePill                                                           */
/* ------------------------------------------------------------------ */

function RolePill({ name }: { name: string }) {
	return (
		<span className='inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700'>
			<Shield className='size-3 text-slate-400' aria-hidden='true' />
			{name}
		</span>
	);
}

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */

function Avatar({
	firstName,
	lastName,
	color,
	size = 'md',
}: {
	firstName: string;
	lastName: string;
	color: string;
	size?: 'sm' | 'md';
}) {
	const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
	const sizeClass = size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm';
	return (
		<span
			className={cn(
				'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white',
				sizeClass,
			)}
			style={{ backgroundColor: color }}
			aria-hidden='true'>
			{initials}
		</span>
	);
}

/* ------------------------------------------------------------------ */
/*  MemberRow                                                          */
/* ------------------------------------------------------------------ */

function MemberRow({ member }: { member: TeamMember }) {
	return (
		<Link
			href={`/dashboard/settings/team/${member.id}`}
			className='group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none'
			aria-label={`View profile of ${member.firstName} ${member.lastName}`}>
			<Avatar
				firstName={member.firstName}
				lastName={member.lastName}
				color={member.avatarColor}
			/>

			{/* Name + email */}
			<div className='min-w-0 flex-1'>
				<p className='truncate text-sm font-semibold text-foreground'>
					{member.firstName} {member.lastName}
				</p>
				<p className='truncate text-xs text-slate-500'>{member.email}</p>
			</div>

			{/* Roles — hidden on small screens */}
			<div className='hidden w-56 flex-wrap gap-1.5 lg:flex'>
				{member.roles.map((role) => (
					<RolePill key={role} name={role} />
				))}
			</div>

			{/* Status */}
			<div className='hidden sm:block'>
				<MemberStatusBadge status={member.status} />
			</div>

			{/* Joined */}
			<p className='hidden w-24 shrink-0 text-xs text-slate-400 xl:block'>
				{member.joinedAt
					? new Date(member.joinedAt).toLocaleDateString('en-GB', {
							day: 'numeric',
							month: 'short',
							year: 'numeric',
						})
					: '—'}
			</p>

			<ChevronRight className='size-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500' />
		</Link>
	);
}

/* ------------------------------------------------------------------ */
/*  PendingInviteRow                                                   */
/* ------------------------------------------------------------------ */

function PendingInviteRow({
	invite,
	onRevoke,
}: {
	invite: PendingInvite;
	onRevoke: (id: string) => void;
}) {
	const expires = new Date(invite.expiresAt);
	const now = new Date();
	const daysLeft = Math.ceil(
		(expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
	);

	return (
		<div className='flex items-center gap-4 px-6 py-4'>
			{/* Avatar placeholder */}
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
				<RolePill name={invite.role} />
			</div>

			<div className='hidden sm:block'>
				<span className='inline-flex items-center gap-1 rounded-full bg-care-blue-light px-2.5 py-0.5 text-xs font-semibold text-care-blue border border-care-blue/20'>
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

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TeamSettingsPage() {
	const [search, setSearch] = useState('');
	const [invites, setInvites] = useState<PendingInvite[]>(MOCK_INVITES);

	const filtered = MOCK_MEMBERS.filter((m) => {
		const q = search.toLowerCase();
		return (
			`${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
			m.email.toLowerCase().includes(q) ||
			m.roles.some((r) => r.toLowerCase().includes(q))
		);
	});

	const activeCount = MOCK_MEMBERS.filter((m) => m.status === 'ACTIVE').length;

	function revokeInvite(id: string) {
		setInvites((prev) => prev.filter((i) => i.id !== id));
	}

	return (
		<div className='mx-auto max-w-6/12 p-4 lg:p-8'>
			{/* Breadcrumb */}
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

			{/* Page header */}
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
						Manage who has access to your organisation. You can update roles,
						suspend accounts, and invite new members. Only admins and those with
						the{' '}
						<span className='font-semibold text-foreground'>
							Manage Members
						</span>{' '}
						permission can make changes.
					</p>
				</div>

				<Link href='/dashboard/settings/team/invite' className='shrink-0'>
					<Button className='h-10 gap-2 bg-care-blue text-sm font-semibold shadow-md hover:bg-care-blue-hover'>
						<UserPlus className='size-4' aria-hidden='true' />
						Invite Member
					</Button>
				</Link>
			</div>

			{/* Summary strip */}
			<div className='mb-6 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-white shadow-sm'>
				<div className='px-5 py-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
						Total Members
					</p>
					<p className='mt-1 text-2xl font-bold text-foreground'>
						{MOCK_MEMBERS.length}
					</p>
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
					<p className='mt-1 text-2xl font-bold text-care-blue'>
						{invites.length}
					</p>
				</div>
			</div>

			{/* Members list */}
			<section aria-labelledby='members-heading' className='mb-6'>
				<div className='rounded-xl border border-border bg-white shadow-sm'>
					{/* Card header with search */}
					<div className='flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between'>
						<h2
							id='members-heading'
							className='font-heading text-base font-bold text-foreground'>
							Members
							<span className='ml-2 text-sm font-normal text-slate-400'>
								({MOCK_MEMBERS.length})
							</span>
						</h2>
						<div className='relative w-full sm:w-64'>
							<Search
								className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400'
								aria-hidden='true'
							/>
							<Input
								type='search'
								placeholder='Search name, email, or role…'
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className='h-9 pl-9 text-sm'
								aria-label='Search team members'
							/>
						</div>
					</div>

					{/* Column headers */}
					<div className='hidden grid-cols-[auto_1fr_14rem_7rem_6rem_1.5rem] items-center gap-4 border-b border-border px-6 py-2.5 lg:grid'>
						<span className='w-10' />
						<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
							Member
						</span>
						<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
							Roles
						</span>
						<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
							Status
						</span>
						<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
							Joined
						</span>
						<span />
					</div>

					{/* Rows */}
					{filtered.length > 0 ? (
						<ul role='list' className='divide-y divide-border'>
							{filtered.map((member) => (
								<li key={member.id}>
									<MemberRow member={member} />
								</li>
							))}
						</ul>
					) : (
						<div className='flex flex-col items-center gap-2 px-6 py-12 text-center'>
							<Search className='size-8 text-slate-300' aria-hidden='true' />
							<p className='text-sm font-semibold text-foreground'>
								No members found
							</p>
							<p className='text-xs text-slate-500'>
								Try a different name, email, or role.
							</p>
						</div>
					)}
				</div>
			</section>

			{/* Pending invitations */}
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
									These invitations are awaiting acceptance and will expire
									after 7 days.
								</p>
							</div>
							<Link
								href='/dashboard/settings/team/invite'
								className='hidden sm:flex items-center gap-1.5 text-xs font-semibold text-care-blue hover:underline'>
								<Mail className='size-3.5' aria-hidden='true' />
								Send another invite
							</Link>
						</div>

						<ul role='list' className='divide-y divide-border'>
							{invites.map((invite) => (
								<li key={invite.id}>
									<PendingInviteRow invite={invite} onRevoke={revokeInvite} />
								</li>
							))}
						</ul>
					</div>
				</section>
			)}
		</div>
	);
}
