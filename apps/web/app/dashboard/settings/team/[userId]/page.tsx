'use client';

import { BoundingBox } from '@/components/dashboard/bounding-box';
import { Button } from '@/components/ui/button';
import {
	TEAM_ROLE_META,
	fetchTeamMembers,
	fetchTeamRoles,
	getCurrentOrgContext,
	getOrgManagementError,
	removeTeamMember,
	updateTeamMember,
	type TeamMember,
	type TeamRole,
} from '@/lib/org-management';
import { cn } from '@/lib/utils';
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	ChevronRight,
	Info,
	Mail,
	Trash2,
	UserX,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

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
				{description ? (
					<p className='mt-1 text-sm text-slate-600'>{description}</p>
				) : null}
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
	onSelect,
}: {
	role: TeamRole;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type='button'
			role='checkbox'
			aria-checked={selected}
			onClick={onSelect}
			className={cn(
				'group flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all',
				'focus-visible:border-care-blue focus-visible:ring-3 focus-visible:ring-care-blue/30 focus-visible:outline-none',
				selected
					? 'border-care-blue bg-care-blue-light/40 ring-2 ring-care-blue/20'
					: 'border-border bg-white hover:border-slate-300 hover:bg-slate-50',
			)}>
			<span
				className={cn(
					'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
					selected
						? 'border-care-blue bg-care-blue text-white'
						: 'border-slate-300 bg-white group-hover:border-slate-400',
				)}
				aria-hidden='true'>
				{selected ? <Check className='size-3' strokeWidth={3} /> : null}
			</span>
			<div className='min-w-0 flex-1'>
				<div className='flex flex-wrap items-center gap-2'>
					<p className='text-sm font-semibold text-foreground'>{role.name}</p>
					{role.isSystem ? (
						<span className='rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500'>
							System
						</span>
					) : (
						<span className='rounded-full bg-care-blue-light px-2 py-0.5 text-[11px] font-semibold text-care-blue'>
							Custom
						</span>
					)}
				</div>
				<p className='mt-0.5 text-sm leading-relaxed text-slate-600'>
					{role.description ??
						TEAM_ROLE_META[role.name]?.description ??
						'Organization role'}
				</p>
			</div>
		</button>
	);
}

export default function MemberProfilePage({
	params,
}: {
	params: Promise<{ userId: string }>;
}) {
	const router = useRouter();
	const { userId } = use(params);
	const [organizationId, setOrganizationId] = useState<string | null>(null);
	const [member, setMember] = useState<TeamMember | null>(null);
	const [roles, setRoles] = useState<TeamRole[]>([]);
	const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
	const [status, setStatus] = useState<MemberStatus>('ACTIVE');
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [confirmRemove, setConfirmRemove] = useState(false);

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				setIsLoading(true);
				setErrorMessage('');
				const org = await getCurrentOrgContext();
				const [members, teamRoles] = await Promise.all([
					fetchTeamMembers(org.organizationId),
					fetchTeamRoles(org.organizationId),
				]);
				const nextMember =
					members.find((candidate) => candidate.userId === userId) ?? null;

				if (!isMounted) {
					return;
				}

				setOrganizationId(org.organizationId);
				setRoles(teamRoles);
				setMember(nextMember);
				setSelectedRoleIds(nextMember?.roles.map((role) => role.id) ?? []);
				setStatus(nextMember?.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE');
			} catch (error) {
				if (isMounted) {
					setErrorMessage(
						getOrgManagementError(error, 'Unable to load member details.'),
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
	}, [userId]);

	const handleSave = async () => {
		if (!organizationId || !member) {
			return;
		}

		try {
			setIsSaving(true);
			setErrorMessage('');
			setSuccessMessage('');
			await updateTeamMember(organizationId, member.userId, {
				roleIds: selectedRoleIds,
				status,
			});
			setMember((current) =>
				current
					? {
							...current,
							status,
							roles: roles.filter((role) => selectedRoleIds.includes(role.id)),
						}
					: current,
			);
			setSuccessMessage('Member updated successfully.');
		} catch (error) {
			setErrorMessage(
				getOrgManagementError(error, 'Unable to update this member.'),
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleRemove = async () => {
		if (!organizationId || !member) {
			return;
		}

		try {
			setIsSaving(true);
			setErrorMessage('');
			await removeTeamMember(organizationId, member.userId);
			router.push('/dashboard/settings/team');
		} catch (error) {
			setErrorMessage(
				getOrgManagementError(error, 'Unable to remove this member.'),
			);
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className='mx-auto max-w-6/12 p-4 lg:p-8'>
				<p className='text-sm text-slate-500'>Loading member details...</p>
			</div>
		);
	}

	if (!member) {
		return (
			<div className='mx-auto max-w-6/12 p-4 lg:p-8'>
				<p className='text-sm font-semibold text-foreground'>
					Member not found.
				</p>
				<Link
					href='/dashboard/settings/team'
					className='mt-3 inline-flex text-sm font-semibold text-care-blue hover:underline'>
					Back to Team
				</Link>
			</div>
		);
	}

	const initials =
		`${member.user.firstName[0] ?? ''}${member.user.lastName[0] ?? ''}`.toUpperCase();
	const hasChanges =
		member.roles
			.map((role) => role.id)
			.sort()
			.join(',') !== selectedRoleIds.slice().sort().join(',') ||
		member.status !== status;

	return (
		<BoundingBox>
			<div className='mx-auto  p-4 lg:p-8'>
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
							<span
								className='font-semibold text-foreground'
								aria-current='page'>
								{member.user.firstName} {member.user.lastName}
							</span>
						</li>
					</ol>
				</nav>

				<div className='mb-8'>
					<div className='flex items-center gap-3'>
						<Link
							href='/dashboard/settings/team'
							className='flex size-9 items-center justify-center rounded-lg border border-border text-slate-500 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-care-blue/50 focus-visible:outline-none'
							aria-label='Back to Team'>
							<ArrowLeft className='size-4' />
						</Link>
						<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
							{member.user.firstName} {member.user.lastName}
						</h1>
						<MemberStatusBadge status={status} />
					</div>
					<p className='mt-3 max-w-xl text-sm leading-relaxed text-slate-600'>
						View and manage this team member&apos;s access level and account
						status.
					</p>
				</div>

				<div className='mb-4 min-h-5'>
					{errorMessage ? (
						<p className='text-sm font-medium text-red-600'>{errorMessage}</p>
					) : null}
					{successMessage ? (
						<p className='text-sm font-medium text-green-600'>
							{successMessage}
						</p>
					) : null}
				</div>

				<div className='flex flex-col gap-6'>
					<div className='flex items-center gap-5 rounded-xl border border-border bg-white p-6 shadow-sm'>
						<span className='inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-care-blue/10 text-xl font-bold text-care-blue'>
							{initials}
						</span>
						<div className='min-w-0 flex-1'>
							<p className='text-lg font-bold text-foreground'>
								{member.user.firstName} {member.user.lastName}
							</p>
							<div className='mt-1 flex items-center gap-1.5 text-sm text-slate-500'>
								<Mail className='size-4 shrink-0' aria-hidden='true' />
								<span className='truncate'>{member.user.email}</span>
							</div>
						</div>
						<dl className='hidden gap-6 text-right sm:flex'>
							<div>
								<dt className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
									Joined
								</dt>
								<dd className='mt-1 text-sm font-semibold text-foreground'>
									{formatDate(member.joinedAt)}
								</dd>
							</div>
							<div>
								<dt className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
									Invited by
								</dt>
								<dd className='mt-1 text-sm font-semibold text-foreground'>
									{member.invitedBy.firstName} {member.invitedBy.lastName}
								</dd>
							</div>
						</dl>
					</div>

					<div
						className='flex gap-3 rounded-xl border border-care-blue/20 bg-care-blue-light p-4'
						role='note'>
						<Info
							className='mt-0.5 size-4 shrink-0 text-care-blue'
							aria-hidden='true'
						/>
						<p className='text-sm text-slate-700'>
							Only team roles are managed here. Carer access is handled
							separately in the Staff onboarding flow.
						</p>
					</div>

					<FormSection
						id='roles'
						title='Access Level'
						description='Assign one or more team roles. Effective access is the union of all selected permissions.'>
						<div className='flex flex-col gap-6'>
							{selectedRoleIds.length > 0 ? (
								<div className='rounded-lg border border-care-blue/20 bg-care-blue-light px-4 py-3'>
									<p className='text-xs font-semibold uppercase tracking-wider text-care-blue'>
										Selected Roles
									</p>
									<div className='mt-2 flex flex-wrap gap-2'>
										{roles
											.filter((role) => selectedRoleIds.includes(role.id))
											.map((role) => (
												<span
													key={role.id}
													className='rounded-full border border-care-blue/20 bg-white px-2.5 py-1 text-xs font-semibold text-care-blue'>
													{role.name}
												</span>
											))}
									</div>
								</div>
							) : (
								<div className='flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-4'>
									<AlertTriangle className='size-4 shrink-0 text-warning' />
									<p className='text-sm text-slate-700'>
										This member currently has no team role assigned.
									</p>
								</div>
							)}

							<div className='flex flex-col gap-3'>
								{roles.map((role) => (
									<RoleCard
										key={role.id}
										role={role}
										selected={selectedRoleIds.includes(role.id)}
										onSelect={() =>
											setSelectedRoleIds((current) =>
												current.includes(role.id)
													? current.filter((id) => id !== role.id)
													: [...current, role.id],
											)
										}
									/>
								))}
							</div>

							{selectedRoleIds.length > 0 ? (
								<button
									type='button'
									onClick={() => setSelectedRoleIds([])}
									className='self-start text-sm font-semibold text-care-blue hover:underline'>
									Clear selected team roles
								</button>
							) : null}
						</div>
					</FormSection>

					<FormSection
						id='status'
						title='Account Status'
						description='Suspending a member removes sign-in access until they are reactivated.'>
						<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
							<div>
								<p className='text-sm font-semibold text-foreground'>
									Current status:{' '}
									<span
										className={
											status === 'ACTIVE' ? 'text-success' : 'text-warning'
										}>
										{status === 'ACTIVE' ? 'Active' : 'Suspended'}
									</span>
								</p>
								<p className='mt-1 text-sm text-slate-500'>
									{status === 'ACTIVE'
										? 'This member can currently sign in and access the organization.'
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

					<div className='flex flex-col-reverse gap-3 border-t border-border pt-2 sm:flex-row sm:items-center sm:justify-between'>
						<Link
							href='/dashboard/settings/team'
							className='inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'>
							Cancel
						</Link>
						<Button
							type='button'
							onClick={() => void handleSave()}
							disabled={!hasChanges || isSaving}
							className={cn(
								'h-10 gap-2 px-5 text-sm font-semibold shadow-md',
								hasChanges && !isSaving
									? 'bg-care-blue hover:bg-care-blue-hover'
									: 'cursor-not-allowed bg-care-blue/40',
							)}>
							{isSaving ? 'Saving...' : 'Save Changes'}
						</Button>
					</div>

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
								Removing a member immediately revokes all organization access.
							</p>
						</div>
						<div className='px-6 py-6'>
							{!confirmRemove ? (
								<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
									<div>
										<p className='text-sm font-semibold text-foreground'>
											Remove from organization
										</p>
										<p className='mt-0.5 text-sm text-slate-500'>
											{member.user.firstName} will lose access to this
											organization.
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
										<AlertTriangle className='mt-0.5 size-5 shrink-0 text-error' />
										<div>
											<p className='text-sm font-bold text-foreground'>
												Remove {member.user.firstName} {member.user.lastName}{' '}
												from this organization?
											</p>
											<p className='mt-1 text-sm text-slate-600'>
												This immediately revokes their team access. Their user
												account will still exist, but they will no longer belong
												to this organization.
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
										<button
											type='button'
											onClick={() => void handleRemove()}
											className='inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-error px-5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-error/90 focus-visible:ring-2 focus-visible:ring-error/50 focus-visible:outline-none'>
											<Trash2 className='size-4' aria-hidden='true' />
											Yes, Remove Member
										</button>
									</div>
								</div>
							)}
						</div>
					</section>
				</div>
			</div>
		</BoundingBox>
	);
}
