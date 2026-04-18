'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	archiveCustomTeamRole,
	createCustomTeamRole,
	fetchRolePermissions,
	fetchTeamRoles,
	getCurrentOrgContext,
	getOrgManagementError,
	updateCustomTeamRole,
	type TeamPermission,
	type TeamRole,
} from '@/lib/org-management';
import { cn } from '@/lib/utils';
import {
	ArrowLeft,
	ChevronRight,
	Plus,
	Shield,
	Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

function permissionGroupLabel(key: string) {
	const [prefix] = key.split('_');
	return prefix ? `${prefix[0]!.toUpperCase()}${prefix.slice(1)}` : 'Other';
}

export default function TeamRolesPage() {
	const [organizationId, setOrganizationId] = useState<string | null>(null);
	const [roles, setRoles] = useState<TeamRole[]>([]);
	const [permissions, setPermissions] = useState<TeamPermission[]>([]);
	const [selectedRoleId, setSelectedRoleId] = useState<string>('new');
	const [draftName, setDraftName] = useState('');
	const [draftDescription, setDraftDescription] = useState('');
	const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				setIsLoading(true);
				setErrorMessage('');
				const org = await getCurrentOrgContext();
				const [nextRoles, nextPermissions] = await Promise.all([
					fetchTeamRoles(org.organizationId),
					fetchRolePermissions(org.organizationId),
				]);

				if (!isMounted) {
					return;
				}

				setOrganizationId(org.organizationId);
				setRoles(nextRoles);
				setPermissions(nextPermissions);
			} catch (error) {
				if (isMounted) {
					setErrorMessage(
						getOrgManagementError(error, 'Unable to load organization roles.'),
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

	const selectedRole =
		selectedRoleId === 'new'
			? null
			: roles.find((role) => role.id === selectedRoleId) ?? null;

	useEffect(() => {
		if (!selectedRole) {
			return;
		}

		setDraftName(selectedRole.name);
		setDraftDescription(selectedRole.description ?? '');
		setSelectedPermissionKeys(
			selectedRole.permissions.map((permission) => permission.key),
		);
	}, [selectedRole]);

	const groupedPermissions = useMemo(() => {
		return permissions.reduce<Record<string, TeamPermission[]>>((groups, permission) => {
			const group = permissionGroupLabel(permission.key);
			if (!groups[group]) {
				groups[group] = [];
			}
			groups[group]!.push(permission);
			return groups;
		}, {});
	}, [permissions]);

	const canSave =
		Boolean(organizationId) &&
		draftName.trim().length >= 2 &&
		selectedPermissionKeys.length > 0 &&
		(!selectedRole || !selectedRole.isSystem);

	const handleSelectRole = (roleId: string) => {
		setSuccessMessage('');
		setErrorMessage('');
		setSelectedRoleId(roleId);
		if (roleId === 'new') {
			setDraftName('');
			setDraftDescription('');
			setSelectedPermissionKeys([]);
		}
	};

	const handleUseAsStartingPoint = () => {
		if (!selectedRole) {
			return;
		}

		setSelectedRoleId('new');
		setDraftName(`${selectedRole.name} Copy`);
		setDraftDescription(selectedRole.description ?? '');
		setSelectedPermissionKeys(selectedRole.permissions.map((permission) => permission.key));
	};

	const handleSave = async () => {
		if (!organizationId || !canSave) {
			return;
		}

		try {
			setIsSaving(true);
			setErrorMessage('');
			setSuccessMessage('');

			const payload = {
				name: draftName.trim(),
				description: draftDescription.trim() || undefined,
				permissionKeys: selectedPermissionKeys,
			};

			if (selectedRole) {
				const updated = await updateCustomTeamRole(
					organizationId,
					selectedRole.id,
					payload,
				);
				setRoles((current) =>
					current.map((role) => (role.id === updated.id ? updated : role)),
				);
				setSuccessMessage('Role updated successfully.');
			} else {
				const created = await createCustomTeamRole(organizationId, payload);
				setRoles((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
				setSelectedRoleId(created.id);
				setSuccessMessage('Custom role created successfully.');
			}
		} catch (error) {
			setErrorMessage(
				getOrgManagementError(error, 'Unable to save this role.'),
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleArchive = async () => {
		if (!organizationId || !selectedRole || selectedRole.isSystem) {
			return;
		}

		try {
			setIsSaving(true);
			setErrorMessage('');
			setSuccessMessage('');
			await archiveCustomTeamRole(organizationId, selectedRole.id);
			setRoles((current) => current.filter((role) => role.id !== selectedRole.id));
			setSelectedRoleId('new');
			setSuccessMessage('Role archived successfully.');
		} catch (error) {
			setErrorMessage(
				getOrgManagementError(error, 'Unable to archive this role.'),
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className='mx-auto max-w-6xl p-4 lg:p-8'>
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
							Roles
						</span>
					</li>
				</ol>
			</nav>

			<div className='mb-8 flex flex-wrap items-start justify-between gap-4'>
				<div className='flex items-center gap-3'>
					<Link
						href='/dashboard/settings/team'
						className='flex size-9 items-center justify-center rounded-lg border border-border text-slate-500 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-care-blue/50 focus-visible:outline-none'
						aria-label='Back to Team'>
						<ArrowLeft className='size-4' />
					</Link>
					<div>
						<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
							Team Roles
						</h1>
						<p className='mt-2 max-w-2xl text-sm leading-relaxed text-slate-600'>
							Create custom organization roles, combine permissions as needed, and
							keep different admins at different privilege levels.
						</p>
					</div>
				</div>
				<Button
					type='button'
					variant='outline'
					className='gap-2'
					onClick={() => handleSelectRole('new')}>
					<Plus className='size-4' aria-hidden='true' />
					New Custom Role
				</Button>
			</div>

			<div className='mb-4 min-h-5'>
				{errorMessage ? (
					<p className='text-sm font-medium text-red-600'>{errorMessage}</p>
				) : null}
				{successMessage ? (
					<p className='text-sm font-medium text-green-600'>{successMessage}</p>
				) : null}
			</div>

			<div className='grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]'>
				<section className='rounded-2xl border border-border bg-white shadow-sm'>
					<div className='border-b border-border px-5 py-4'>
						<h2 className='font-heading text-base font-bold text-foreground'>
							Available Roles
						</h2>
						<p className='mt-1 text-sm text-slate-600'>
							{roles.length} team roles available in this organization.
						</p>
					</div>
					<div className='space-y-2 p-3'>
						{isLoading ? (
							<p className='px-2 py-4 text-sm text-slate-500'>Loading roles...</p>
						) : (
							<>
								<button
									type='button'
									onClick={() => handleSelectRole('new')}
									className={cn(
										'w-full rounded-xl border px-4 py-3 text-left transition-colors',
										selectedRoleId === 'new'
											? 'border-care-blue bg-care-blue-light/40'
											: 'border-border hover:bg-slate-50',
									)}>
									<p className='text-sm font-semibold text-foreground'>New custom role</p>
									<p className='mt-1 text-xs text-slate-500'>
										Start with a blank permission set or copy an existing role.
									</p>
								</button>
								{roles.map((role) => (
									<button
										key={role.id}
										type='button'
										onClick={() => handleSelectRole(role.id)}
										className={cn(
											'w-full rounded-xl border px-4 py-3 text-left transition-colors',
											selectedRoleId === role.id
												? 'border-care-blue bg-care-blue-light/40'
												: 'border-border hover:bg-slate-50',
										)}>
										<div className='flex items-center justify-between gap-2'>
											<p className='text-sm font-semibold text-foreground'>{role.name}</p>
											<span
												className={cn(
													'rounded-full px-2 py-0.5 text-[11px] font-semibold',
													role.isSystem
														? 'bg-slate-100 text-slate-500'
														: 'bg-care-blue-light text-care-blue',
												)}>
												{role.isSystem ? 'System' : 'Custom'}
											</span>
										</div>
										<p className='mt-1 text-xs text-slate-500'>
											{role.permissions.length} permissions
										</p>
									</button>
								))}
							</>
						)}
					</div>
				</section>

				<section className='rounded-2xl border border-border bg-white shadow-sm'>
					<div className='border-b border-border px-6 py-5'>
						<div className='flex flex-wrap items-start justify-between gap-4'>
							<div>
								<h2 className='font-heading text-base font-bold text-foreground'>
									{selectedRole ? selectedRole.name : 'Create custom role'}
								</h2>
								<p className='mt-1 text-sm text-slate-600'>
									{selectedRole?.isSystem
										? 'Built-in roles are read-only, but you can use them as a starting point.'
										: 'Choose exactly the permissions this role should grant.'}
								</p>
							</div>
							{selectedRole?.isSystem ? (
								<Button type='button' variant='outline' onClick={handleUseAsStartingPoint}>
									Use as starting point
								</Button>
							) : null}
						</div>
					</div>

					<div className='space-y-6 px-6 py-6'>
						<div className='grid gap-5 sm:grid-cols-2'>
							<div className='space-y-2'>
								<Label htmlFor='role-name'>Role name</Label>
								<Input
									id='role-name'
									value={draftName}
									disabled={selectedRole?.isSystem}
									onChange={(event) => setDraftName(event.target.value)}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='role-description'>Description</Label>
								<Input
									id='role-description'
									value={draftDescription}
									disabled={selectedRole?.isSystem}
									onChange={(event) => setDraftDescription(event.target.value)}
								/>
							</div>
						</div>

						<div className='space-y-4'>
							<div>
								<h3 className='text-sm font-semibold text-foreground'>Permissions</h3>
								<p className='mt-1 text-sm text-slate-600'>
									Granted permissions are combined with any other roles assigned to the
									member.
								</p>
							</div>
							<div className='grid gap-4 lg:grid-cols-2'>
								{Object.entries(groupedPermissions).map(([group, groupPermissions]) => (
									<div key={group} className='rounded-xl border border-border p-4'>
										<p className='mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500'>
											{group}
										</p>
										<div className='space-y-3'>
											{groupPermissions.map((permission) => (
												<label
													key={permission.key}
													className='flex items-start gap-3 text-sm text-slate-700'>
													<input
														type='checkbox'
														disabled={selectedRole?.isSystem}
														checked={selectedPermissionKeys.includes(permission.key)}
														onChange={(event) =>
															setSelectedPermissionKeys((current) =>
																event.target.checked
																	? [...current, permission.key]
																	: current.filter((key) => key !== permission.key),
															)
														}
													/>
													<span>
														<span className='block font-semibold text-foreground'>
															{permission.key}
														</span>
														<span className='mt-1 block text-xs text-slate-500'>
															{permission.description}
														</span>
													</span>
												</label>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className='flex flex-col gap-3 border-t border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between'>
						<div className='inline-flex items-center gap-2 text-sm text-slate-500'>
							<Shield className='size-4 text-care-blue' aria-hidden='true' />
							<span>
								Organizations can keep several admins while giving each one only the
								permissions they actually need.
							</span>
						</div>
						<div className='flex flex-wrap gap-3'>
							{selectedRole && !selectedRole.isSystem ? (
								<Button
									type='button'
									variant='destructive'
									disabled={isSaving}
									onClick={handleArchive}
									className='gap-2'>
									<Trash2 className='size-4' aria-hidden='true' />
									Archive role
								</Button>
							) : null}
							<Button type='button' disabled={!canSave || isSaving} onClick={handleSave}>
								{isSaving ? 'Saving...' : selectedRole ? 'Save role' : 'Create role'}
							</Button>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
