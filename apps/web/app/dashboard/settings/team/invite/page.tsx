'use client';

import DashboardFooter from '@/components/dashboard/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
	ArrowLeft,
	Check,
	ChevronRight,
	Info,
	Mail,
	Shield,
	X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
/*  FormSection — reusable accessible card wrapper                     */
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

/* ------------------------------------------------------------------ */
/*  RoleCard                                                           */
/* ------------------------------------------------------------------ */

function RoleCard({
	role,
	selected,
	onToggle,
}: {
	role: Role;
	selected: boolean;
	onToggle: () => void;
}) {
	const borderColor = selected
		? 'border-care-blue ring-2 ring-care-blue/20'
		: 'border-border hover:border-slate-300';

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
				borderColor,
				selected ? 'bg-care-blue-light/40' : 'bg-white hover:bg-slate-50',
			)}>
			{/* Checkbox indicator */}
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

/* ------------------------------------------------------------------ */
/*  SelectedRolePill                                                   */
/* ------------------------------------------------------------------ */

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
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function InviteTeamMemberPage() {
	const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

	const toggleRole = useCallback((roleId: string) => {
		setSelectedRoles((prev) => {
			const next = new Set(prev);
			if (next.has(roleId)) {
				next.delete(roleId);
			} else {
				next.add(roleId);
			}
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

	const selectedRoleObjects = AVAILABLE_ROLES.filter((r) =>
		selectedRoles.has(r.id),
	);

	const groupedRoles = AVAILABLE_ROLES.reduce(
		(acc, role) => {
			if (!acc[role.category]) {
				acc[role.category] = [];
			}
			acc[role.category].push(role);
			return acc;
		},
		{} as Record<string, Role[]>,
	);

	const canSubmit = selectedRoles.size > 0;

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
							Invite Member
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
						aria-label='Back to Team Settings'>
						<ArrowLeft className='size-4' />
					</Link>
					<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
						Invite Team Member
					</h1>
				</div>
				<p className='mt-3 max-w-xl text-sm leading-relaxed text-slate-600'>
					Add a manager, administrator, or other team member to your
					organisation. They&apos;ll receive an email invitation to set up their
					account and can be assigned one or more roles.
				</p>
			</div>

			<form
				onSubmit={(e) => e.preventDefault()}
				className='flex flex-col gap-6'
				noValidate>
				{/* ---- Contact Details ---- */}
				<FormSection
					id='contact'
					title='Contact Details'
					description='Who are you inviting? They will use this email to sign in.'>
					<div className='grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2'>
						<div className='flex flex-col gap-2'>
							<Label htmlFor='tm-firstName'>
								First Name{' '}
								<span className='text-error' aria-hidden='true'>
									*
								</span>
							</Label>
							<Input
								id='tm-firstName'
								placeholder='e.g. James'
								required
								aria-required='true'
								autoComplete='given-name'
								className='h-10'
							/>
						</div>
						<div className='flex flex-col gap-2'>
							<Label htmlFor='tm-lastName'>
								Last Name{' '}
								<span className='text-error' aria-hidden='true'>
									*
								</span>
							</Label>
							<Input
								id='tm-lastName'
								placeholder='e.g. Porter'
								required
								aria-required='true'
								autoComplete='family-name'
								className='h-10'
							/>
						</div>
						<div className='flex flex-col gap-2 sm:col-span-2'>
							<Label htmlFor='tm-email'>
								Email Address{' '}
								<span className='text-error' aria-hidden='true'>
									*
								</span>
							</Label>
							<Input
								id='tm-email'
								type='email'
								placeholder='e.g. james.porter@yourcompany.co.uk'
								required
								aria-required='true'
								autoComplete='email'
								className='h-10'
							/>
							<p className='text-xs text-slate-500' id='email-hint'>
								This will be their login email. Make sure it&apos;s a valid
								address they can access.
							</p>
						</div>
					</div>
				</FormSection>

				{/* ---- Roles & Permissions ---- */}
				<FormSection
					id='roles'
					title='Roles & Permissions'
					description='Select one or more roles. Permissions are additive — a user with multiple roles gets the combined access of all selected roles.'>
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

				{/* ---- Security note ---- */}
				<div
					className='flex gap-3 rounded-xl border border-warning/30 bg-warning/5 p-5'
					role='note'>
					<Shield
						className='mt-0.5 size-5 shrink-0 text-warning'
						aria-hidden='true'
					/>
					<div>
						<p className='text-sm font-bold text-foreground'>Security Notice</p>
						<p className='mt-1 text-sm leading-relaxed text-slate-700'>
							Admin and management roles grant access to sensitive client data,
							staff records, and operational controls. Only invite people you
							trust and assign the minimum roles necessary. You can change roles
							at any time from the Team settings page.
						</p>
					</div>
				</div>

				{/* ---- Invitation workflow info ---- */}
				<div
					className='flex gap-3 rounded-xl border border-care-blue/20 bg-care-blue-light p-5'
					role='note'>
					<Info
						className='mt-0.5 size-5 shrink-0 text-care-blue'
						aria-hidden='true'
					/>
					<div>
						<p className='text-sm font-bold text-foreground'>
							What happens next?
						</p>
						<p className='mt-1 text-sm leading-relaxed text-slate-700'>
							The invitee will receive an email with a secure link to create
							their account and set a password. Their access begins only after
							they accept the invitation. Pending invitations can be revoked
							from the Team settings page.
						</p>
					</div>
				</div>

				{/* ---- Actions ---- */}
				<div className='flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end'>
					<Link
						href='/dashboard/settings/team'
						className='inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'>
						Cancel
					</Link>
					<Button
						type='submit'
						size='lg'
						disabled={!canSubmit}
						className={cn(
							'h-11 gap-2 px-6 text-sm font-semibold shadow-md',
							canSubmit
								? 'bg-care-blue hover:bg-care-blue-hover'
								: 'cursor-not-allowed bg-care-blue/50',
						)}>
						<Mail className='size-4' aria-hidden='true' />
						Send Invitation
					</Button>
				</div>
			</form>
		</div>
	);
}
