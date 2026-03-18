'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	ChevronRight,
	Info,
	Mail,
	Shield,
	Trash2,
	UserX,
	X,
} from 'lucide-react';
import Link from 'next/link';
import { use, useCallback, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type MemberStatus = 'ACTIVE' | 'SUSPENDED';

interface MemberProfile {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	status: MemberStatus;
	roles: string[];
	joinedAt: string;
	invitedAt: string;
	invitedBy: string;
	avatarColor: string;
}

interface Role {
	id: string;
	name: string;
	description: string;
	category: 'admin' | 'manager' | 'viewer';
}

/* ------------------------------------------------------------------ */
/*  Available roles                                                    */
/* ------------------------------------------------------------------ */

const AVAILABLE_ROLES: Role[] = [
	{
		id: 'org-admin',
		name: 'Organisation Admin',
		description:
			'Full access to all settings, billing, team management, and data. Can invite and remove any user.',
		category: 'admin',
	},
	{
		id: 'care-manager',
		name: 'Care Manager',
		description:
			'Manage carers, clients, rotas, care plans, and daily operations. Cannot change billing or org settings.',
		category: 'manager',
	},
	{
		id: 'scheduling-manager',
		name: 'Scheduling Manager',
		description:
			'Create and edit rotas, assign visits, and manage carer availability. Read-only access to client records.',
		category: 'manager',
	},
	{
		id: 'compliance-officer',
		name: 'Compliance Officer',
		description:
			'View audit logs, review qualifications, manage training records, and generate compliance reports.',
		category: 'manager',
	},
	{
		id: 'read-only',
		name: 'Read-Only Viewer',
		description:
			'View dashboards, reports, and client summaries. Cannot create, edit, or delete any records.',
		category: 'viewer',
	},
];

const CATEGORY_LABELS: Record<Role['category'], string> = {
	admin: 'Administrator',
	manager: 'Management',
	viewer: 'Limited Access',
};

/* ------------------------------------------------------------------ */
/*  Mock data lookup                                                   */
/* ------------------------------------------------------------------ */

const MOCK_MEMBERS: Record<string, MemberProfile> = {
	u1: {
		id: 'u1',
		firstName: 'Priya',
		lastName: 'Sharma',
		email: 'priya.sharma@sunrisecare.co.uk',
		status: 'ACTIVE',
		roles: ['org-admin'],
		joinedAt: '2024-09-01',
		invitedAt: '2024-08-25',
		invitedBy: 'System',
		avatarColor: '#6366f1',
	},
	u2: {
		id: 'u2',
		firstName: 'James',
		lastName: 'Porter',
		email: 'james.porter@sunrisecare.co.uk',
		status: 'ACTIVE',
		roles: ['care-manager', 'compliance-officer'],
		joinedAt: '2024-10-14',
		invitedAt: '2024-10-08',
		invitedBy: 'Priya Sharma',
		avatarColor: '#0ea5e9',
	},
	u3: {
		id: 'u3',
		firstName: 'Fatima',
		lastName: 'Al-Rashid',
		email: 'f.alrashid@sunrisecare.co.uk',
		status: 'ACTIVE',
		roles: ['scheduling-manager'],
		joinedAt: '2025-01-06',
		invitedAt: '2024-12-20',
		invitedBy: 'Priya Sharma',
		avatarColor: '#f59e0b',
	},
	u4: {
		id: 'u4',
		firstName: 'Thomas',
		lastName: 'Wade',
		email: 'thomas.wade@sunrisecare.co.uk',
		status: 'SUSPENDED',
		roles: ['read-only'],
		joinedAt: '2025-02-10',
		invitedAt: '2025-02-03',
		invitedBy: 'James Porter',
		avatarColor: '#64748b',
	},
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FormSection({
	title,
	description,
	children,
	id,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
	id: string;
}) {
	return (
		<section
			aria-labelledby={`${id}-heading`}
			className='rounded-xl border border-border bg-white shadow-sm'>
			<div className='border-b border-border px-6 py-5'>
				<h2
					id={`${id}-heading`}
					className='font-heading text-base font-bold text-foreground'>
					{title}
				</h2>
				{description && (
					<p className='mt-1 text-sm text-slate-600'>{description}</p>
				)}
			</div>
			<div className='px-6 py-6'>{children}</div>
		</section>
	);
}

function MemberStatusBadge({ status }: { status: MemberStatus }) {
	const styles: Record<MemberStatus, string> = {
		ACTIVE: 'bg-success/10 text-success border border-success/20',
		SUSPENDED: 'bg-warning/10 text-warning border border-warning/20',
	};
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
				styles[status],
			)}>
			{status === 'ACTIVE' ? 'Active' : 'Suspended'}
		</span>
	);
}

function RoleCard({
	role,
	selected,
	onToggle,
}: {
	role: Role;
	selected: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type='button'
			role='checkbox'
			aria-checked={selected}
			aria-label={`${role.name}: ${role.description}`}
			onClick={onToggle}
			className={cn(
				'group flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all',
				'focus-visible:border-care-blue focus-visible:ring-3 focus-visible:ring-care-blue/30 focus-visible:outline-none',
				selected
					? 'border-care-blue bg-care-blue-light/40 ring-2 ring-care-blue/20'
					: 'border-border bg-white hover:border-slate-300 hover:bg-slate-50',
			)}>
			<span
				className={cn(
					'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
					selected
						? 'border-care-blue bg-care-blue text-white'
						: 'border-slate-300 bg-white group-hover:border-slate-400',
				)}
				aria-hidden='true'>
				{selected && <Check className='size-3' strokeWidth={3} />}
			</span>
			<div className='min-w-0 flex-1'>
				<p className='text-sm font-semibold text-foreground'>{role.name}</p>
				<p className='mt-0.5 text-sm leading-relaxed text-slate-600'>
					{role.description}
				</p>
			</div>
		</button>
	);
}

function SelectedRolePill({
	role,
	onRemove,
}: {
	role: Role;
	onRemove: () => void;
}) {
	return (
		<span className='inline-flex items-center gap-1.5 rounded-full border border-care-blue/20 bg-care-blue-light px-3 py-1.5'>
			<Shield className='size-3.5 text-care-blue' aria-hidden='true' />
			<span className='text-xs font-semibold text-care-blue'>{role.name}</span>
			<button
				type='button'
				onClick={onRemove}
				className='ml-0.5 flex size-4 items-center justify-center rounded-full text-care-blue/60 transition-colors hover:bg-care-blue/10 hover:text-care-blue focus-visible:ring-2 focus-visible:ring-care-blue/50 focus-visible:outline-none'
				aria-label={`Remove ${role.name} role`}>
				<X className='size-3' />
			</button>
		</span>
	);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MemberProfilePage({
	params,
}: {
	params: Promise<{ userId: string }>;
}) {
	const { userId } = use(params);
	const member = MOCK_MEMBERS[userId];

	const [selectedRoles, setSelectedRoles] = useState<Set<string>>(
		new Set(member?.roles ?? []),
	);
	const [status, setStatus] = useState<MemberStatus>(
		member?.status ?? 'ACTIVE',
	);
	const [saved, setSaved] = useState(false);
	const [confirmRemove, setConfirmRemove] = useState(false);

	const toggleRole = useCallback((roleId: string) => {
		setSelectedRoles((prev) => {
			const next = new Set(prev);
			if (next.has(roleId)) next.delete(roleId);
			else next.add(roleId);
			return next;
		});
	}, []);

	const removeRole = useCallback((roleId: string) => {
		setSelectedRoles((prev) => {
			const next = new Set(prev);
			next.delete(roleId);
			return next;
		});
	}, []);

	function handleSave() {
		// In production: PATCH /orgs/:orgId/members/:userId
		setSaved(true);
		setTimeout(() => setSaved(false), 3000);
	}

	if (!member) {
		return (
			<div className='mx-auto max-w-6/12 p-4 lg:p-8'>
				<div className='flex flex-col items-center gap-3 py-20 text-center'>
					<p className='text-sm font-semibold text-foreground'>
						Member not found
					</p>
					<Link
						href='/dashboard/settings/team'
						className='text-sm font-semibold text-care-blue hover:underline'>
						Back to Team
					</Link>
				</div>
			</div>
		);
	}

	const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
	const selectedRoleObjects = AVAILABLE_ROLES.filter((r) =>
		selectedRoles.has(r.id),
	);
	const groupedRoles = AVAILABLE_ROLES.reduce(
		(acc, role) => {
			if (!acc[role.category]) acc[role.category] = [];
			acc[role.category].push(role);
			return acc;
		},
		{} as Record<string, Role[]>,
	);

	const hasChanges =
		JSON.stringify([...selectedRoles].sort()) !==
			JSON.stringify([...new Set(member.roles)].sort()) ||
		status !== member.status;

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
						<Link
							href='/dashboard/settings/team'
							className='font-medium text-slate-500 transition-colors hover:text-care-blue'>
							Team
						</Link>
					</li>
					<li aria-hidden='true'>
						<ChevronRight className='size-3.5 text-slate-400' />
					</li>
					<li>
						<span className='font-semibold text-foreground' aria-current='page'>
							{member.firstName} {member.lastName}
						</span>
					</li>
				</ol>
			</nav>

			{/* Page header */}
			<div className='mb-8'>
				<div className='flex items-center gap-3'>
					<Link
						href='/dashboard/settings/team'
						className='flex size-9 items-center justify-center rounded-lg border border-border text-slate-500 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-care-blue/50 focus-visible:outline-none'
						aria-label='Back to Team'>
						<ArrowLeft className='size-4' />
					</Link>
					<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
						{member.firstName} {member.lastName}
					</h1>
					<MemberStatusBadge status={status} />
				</div>
				<p className='mt-3 max-w-xl text-sm leading-relaxed text-slate-600'>
					View and manage this member&apos;s profile, roles, and account status.
					Changes can only be made by the member themselves or an admin with the{' '}
					<span className='font-semibold text-foreground'>
						Manage Members
					</span>{' '}
					permission.
				</p>
			</div>

			<div className='flex flex-col gap-6'>
				{/* ---- Profile summary card ---- */}
				<div className='flex items-center gap-5 rounded-xl border border-border bg-white p-6 shadow-sm'>
					<span
						className='inline-flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white'
						style={{ backgroundColor: member.avatarColor }}
						aria-hidden='true'>
						{initials}
					</span>
					<div className='min-w-0 flex-1'>
						<p className='text-lg font-bold text-foreground'>
							{member.firstName} {member.lastName}
						</p>
						<div className='mt-1 flex items-center gap-1.5 text-sm text-slate-500'>
							<Mail className='size-4 shrink-0' aria-hidden='true' />
							<span className='truncate'>{member.email}</span>
						</div>
					</div>
					<dl className='hidden gap-6 text-right sm:flex'>
						<div>
							<dt className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
								Joined
							</dt>
							<dd className='mt-1 text-sm font-semibold text-foreground'>
								{new Date(member.joinedAt).toLocaleDateString('en-GB', {
									day: 'numeric',
									month: 'short',
									year: 'numeric',
								})}
							</dd>
						</div>
						<div>
							<dt className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
								Invited by
							</dt>
							<dd className='mt-1 text-sm font-semibold text-foreground'>
								{member.invitedBy}
							</dd>
						</div>
					</dl>
				</div>

				{/* ---- Access notice ---- */}
				<div
					className='flex gap-3 rounded-xl border border-care-blue/20 bg-care-blue-light p-4'
					role='note'>
					<Info className='mt-0.5 size-4 shrink-0 text-care-blue' aria-hidden='true' />
					<p className='text-sm text-slate-700'>
						<span className='font-bold'>Who can edit this profile?</span> This
						member themselves, or any user with the{' '}
						<span className='font-semibold'>Organisation Admin</span> role or{' '}
						<span className='font-semibold'>Manage Members</span> permission.
					</p>
				</div>

				{/* ---- Roles & Permissions ---- */}
				<FormSection
					id='roles'
					title='Roles & Permissions'
					description='Select one or more roles. Permissions are additive — multiple roles give the combined access of all selected roles.'>
					<div className='flex flex-col gap-6'>
						{/* Selected roles summary */}
						{selectedRoleObjects.length > 0 && (
							<div>
								<p className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>
									Assigned Roles
								</p>
								<div
									className='flex flex-wrap gap-2'
									role='list'
									aria-label='Currently assigned roles'>
									{selectedRoleObjects.map((role) => (
										<span key={role.id} role='listitem'>
											<SelectedRolePill
												role={role}
												onRemove={() => removeRole(role.id)}
											/>
										</span>
									))}
								</div>
							</div>
						)}

						{selectedRoleObjects.length === 0 && (
							<div className='flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-4'>
								<AlertTriangle
									className='size-4 shrink-0 text-warning'
									aria-hidden='true'
								/>
								<p className='text-sm text-slate-700'>
									This member has no roles assigned. They will not be able to
									access the organisation.
								</p>
							</div>
						)}

						{/* Role groups */}
						{(['admin', 'manager', 'viewer'] as Role['category'][]).map(
							(category) => {
								const roles = groupedRoles[category];
								if (!roles) return null;
								return (
									<fieldset key={category} className='flex flex-col gap-3'>
										<legend className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
											{CATEGORY_LABELS[category]}
										</legend>
										{roles.map((role) => (
											<RoleCard
												key={role.id}
												role={role}
												selected={selectedRoles.has(role.id)}
												onToggle={() => toggleRole(role.id)}
											/>
										))}
									</fieldset>
								);
							},
						)}
					</div>
				</FormSection>

				{/* ---- Account Status ---- */}
				<FormSection
					id='status'
					title='Account Status'
					description='Suspending a member immediately removes their access. They can be reactivated at any time.'>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<p className='text-sm font-semibold text-foreground'>
								Current status:{' '}
								<span
									className={cn(
										status === 'ACTIVE' ? 'text-success' : 'text-warning',
									)}>
									{status === 'ACTIVE' ? 'Active' : 'Suspended'}
								</span>
							</p>
							<p className='mt-1 text-sm text-slate-500'>
								{status === 'ACTIVE'
									? 'This member can currently sign in and access the organisation.'
									: 'This member is suspended and cannot sign in.'}
							</p>
						</div>
						{status === 'ACTIVE' ? (
							<button
								type='button'
								onClick={() => setStatus('SUSPENDED')}
								className='flex shrink-0 items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 px-4 py-2.5 text-sm font-semibold text-warning transition-colors hover:bg-warning/10 focus-visible:ring-2 focus-visible:ring-warning/50 focus-visible:outline-none'>
								<UserX className='size-4' aria-hidden='true' />
								Suspend Account
							</button>
						) : (
							<button
								type='button'
								onClick={() => setStatus('ACTIVE')}
								className='flex shrink-0 items-center gap-2 rounded-lg border border-success/40 bg-success/5 px-4 py-2.5 text-sm font-semibold text-success transition-colors hover:bg-success/10 focus-visible:ring-2 focus-visible:ring-success/50 focus-visible:outline-none'>
								<Check className='size-4' aria-hidden='true' />
								Reactivate Account
							</button>
						)}
					</div>
				</FormSection>

				{/* ---- Save actions ---- */}
				<div className='flex flex-col-reverse gap-3 border-t border-border pt-2 sm:flex-row sm:items-center sm:justify-between'>
					<Link
						href='/dashboard/settings/team'
						className='inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'>
						Cancel
					</Link>
					<Button
						type='button'
						onClick={handleSave}
						disabled={!hasChanges}
						className={cn(
							'h-10 gap-2 px-5 text-sm font-semibold shadow-md',
							hasChanges
								? 'bg-care-blue hover:bg-care-blue-hover'
								: 'cursor-not-allowed bg-care-blue/40',
						)}>
						{saved ? (
							<>
								<Check className='size-4' aria-hidden='true' />
								Saved
							</>
						) : (
							'Save Changes'
						)}
					</Button>
				</div>

				{/* ---- Danger zone ---- */}
				<section
					aria-labelledby='danger-heading'
					className='rounded-xl border border-error/30 bg-white shadow-sm'>
					<div className='border-b border-error/20 px-6 py-5'>
						<h2
							id='danger-heading'
							className='font-heading text-base font-bold text-error'>
							Danger Zone
						</h2>
						<p className='mt-1 text-sm text-slate-600'>
							Removing a member immediately revokes all their access. This
							action cannot be undone.
						</p>
					</div>
					<div className='px-6 py-6'>
						{!confirmRemove ? (
							<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
								<div>
									<p className='text-sm font-semibold text-foreground'>
										Remove from organisation
									</p>
									<p className='mt-0.5 text-sm text-slate-500'>
										{member.firstName} will lose access to all data and
										resources. You can re-invite them later.
									</p>
								</div>
								<button
									type='button'
									onClick={() => setConfirmRemove(true)}
									className='flex shrink-0 items-center gap-2 rounded-lg border border-error/40 bg-error/5 px-4 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/10 focus-visible:ring-2 focus-visible:ring-error/50 focus-visible:outline-none'>
									<Trash2 className='size-4' aria-hidden='true' />
									Remove Member
								</button>
							</div>
						) : (
							<div className='flex flex-col gap-4'>
								<div className='flex gap-3 rounded-lg border border-error/30 bg-error/5 p-4'>
									<AlertTriangle
										className='mt-0.5 size-5 shrink-0 text-error'
										aria-hidden='true'
									/>
									<div>
										<p className='text-sm font-bold text-foreground'>
											Are you sure you want to remove{' '}
											{member.firstName} {member.lastName}?
										</p>
										<p className='mt-1 text-sm text-slate-600'>
											This will immediately revoke their access to{' '}
											<strong>all organisation data</strong>. Their account will
											still exist but they will no longer be a member. This
											cannot be undone.
										</p>
									</div>
								</div>
								<div className='flex gap-3'>
									<button
										type='button'
										onClick={() => setConfirmRemove(false)}
										className='inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'>
										Cancel
									</button>
									<Link
										href='/dashboard/settings/team'
										className='inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-error px-5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-error/90 focus-visible:ring-2 focus-visible:ring-error/50 focus-visible:outline-none'>
										<Trash2 className='size-4' aria-hidden='true' />
										Yes, Remove Member
									</Link>
								</div>
							</div>
						)}
					</div>
				</section>
			</div>

			{/* Footer */}
			<p className='mt-8 pb-4 text-center text-xs text-slate-400'>
				&copy; {new Date().getFullYear()} Good Care Pro. All rights reserved.
			</p>
		</div>
	);
}
