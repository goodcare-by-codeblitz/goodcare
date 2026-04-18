'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	TEAM_ROLE_META,
	createTeamInvite,
	fetchTeamRoles,
	getCurrentOrgContext,
	getOrgManagementError,
	type TeamRole,
} from '@/lib/org-management';
import { cn } from '@/lib/utils';
import {
	ArrowLeft,
	Check,
	ChevronRight,
	Info,
	Mail,
	Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
				{description ? <p className='mt-1 text-sm text-slate-600'>{description}</p> : null}
			</div>
			<div className='px-6 py-6'>{children}</div>
		</section>
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
	const meta = TEAM_ROLE_META[role.name];

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
					{role.description ?? meta?.description ?? 'Organization role'}
				</p>
			</div>
		</button>
	);
}

export default function InviteTeamMemberPage() {
	const router = useRouter();
	const [roles, setRoles] = useState<TeamRole[]>([]);
	const [organizationId, setOrganizationId] = useState<string | null>(null);
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				setIsLoading(true);
				setErrorMessage('');
				const org = await getCurrentOrgContext();
				const teamRoles = await fetchTeamRoles(org.organizationId);

				if (!isMounted) {
					return;
				}

				setOrganizationId(org.organizationId);
				setRoles(teamRoles);
			} catch (error) {
				if (isMounted) {
					setErrorMessage(
						getOrgManagementError(error, 'Unable to load available roles.'),
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

	const canSubmit =
		Boolean(organizationId) &&
		Boolean(firstName.trim()) &&
		Boolean(lastName.trim()) &&
		Boolean(email.trim()) &&
		selectedRoleIds.length > 0;

	const groupedRoles = roles.reduce(
		(groups, role) => {
			const category = role.isSystem
				? (TEAM_ROLE_META[role.name]?.category ?? 'viewer')
				: 'custom';
			groups[category].push(role);
			return groups;
		},
		{
			admin: [] as TeamRole[],
			manager: [] as TeamRole[],
			viewer: [] as TeamRole[],
			custom: [] as TeamRole[],
		},
	);

	const orderedCategories = [
		['admin', 'Administrator'],
		['manager', 'Operations'],
		['viewer', 'Read Only'],
		['custom', 'Custom Roles'],
	] as const;

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!organizationId || selectedRoleIds.length === 0) {
			return;
		}

		try {
			setIsSubmitting(true);
			setErrorMessage('');
			await createTeamInvite(organizationId, {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim(),
				roleIds: selectedRoleIds,
			});
			router.push('/dashboard/settings/team');
		} catch (error) {
			setErrorMessage(
				getOrgManagementError(error, 'Unable to send invitation.'),
			);
		} finally {
			setIsSubmitting(false);
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
					Invite an organization admin, manager, or viewer. Carers are onboarded
					separately from the Staff area.
				</p>
			</div>

			<form onSubmit={handleSubmit} className='flex flex-col gap-6' noValidate>
				<FormSection
					id='contact'
					title='Contact Details'
					description='Who are you inviting? They will use this email to sign in.'>
					<div className='grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2'>
						<div className='flex flex-col gap-2'>
							<Label htmlFor='tm-firstName'>First Name</Label>
							<Input
								id='tm-firstName'
								value={firstName}
								onChange={(event) => setFirstName(event.target.value)}
								placeholder='e.g. James'
								className='h-10'
								autoComplete='given-name'
							/>
						</div>
						<div className='flex flex-col gap-2'>
							<Label htmlFor='tm-lastName'>Last Name</Label>
							<Input
								id='tm-lastName'
								value={lastName}
								onChange={(event) => setLastName(event.target.value)}
								placeholder='e.g. Porter'
								className='h-10'
								autoComplete='family-name'
							/>
						</div>
						<div className='flex flex-col gap-2 sm:col-span-2'>
							<Label htmlFor='tm-email'>Email Address</Label>
							<Input
								id='tm-email'
								type='email'
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder='e.g. james.porter@yourcompany.co.uk'
								className='h-10'
								autoComplete='email'
							/>
						</div>
					</div>
				</FormSection>

				<FormSection
					id='roles'
					title='Access Level'
					description='Select one or more team roles. Effective access is the union of all selected permissions.'>
					{isLoading ? (
						<p className='text-sm text-slate-500'>Loading available roles...</p>
					) : (
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
							) : null}

							{orderedCategories.map(([category, label]) =>
								groupedRoles[category].length > 0 ? (
									<fieldset key={category} className='flex flex-col gap-3'>
										<legend className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
											{label}
										</legend>
										<div className='flex flex-col gap-3'>
											{groupedRoles[category].map((role) => (
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
									</fieldset>
								) : null,
							)}
						</div>
					)}
				</FormSection>

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
							Invite only the access level this person needs. Team roles control
							sensitive operational and staffing features.
						</p>
					</div>
				</div>

				<div
					className='flex gap-3 rounded-xl border border-care-blue/20 bg-care-blue-light p-5'
					role='note'>
					<Info
						className='mt-0.5 size-5 shrink-0 text-care-blue'
						aria-hidden='true'
					/>
					<div>
						<p className='text-sm font-bold text-foreground'>What happens next?</p>
						<p className='mt-1 text-sm leading-relaxed text-slate-700'>
							The invitee will receive an email with a secure link to set their
							password and activate access to this organization.
						</p>
					</div>
				</div>

				<div className='min-h-5'>
					{errorMessage ? (
						<p className='text-sm font-medium text-red-600'>{errorMessage}</p>
					) : null}
				</div>

				<div className='flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end'>
					<Link
						href='/dashboard/settings/team'
						className='inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'>
						Cancel
					</Link>
					<Button
						type='submit'
						size='lg'
						disabled={!canSubmit || isSubmitting || isLoading}
						className={cn(
							'h-11 gap-2 px-6 text-sm font-semibold shadow-md',
							canSubmit && !isSubmitting && !isLoading
								? 'bg-care-blue hover:bg-care-blue-hover'
								: 'cursor-not-allowed bg-care-blue/50',
						)}>
						<Mail className='size-4' aria-hidden='true' />
						{isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
					</Button>
				</div>
			</form>
		</div>
	);
}
