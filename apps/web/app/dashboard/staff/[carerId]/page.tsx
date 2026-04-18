'use client';

import { BoundingBox } from '@/components/dashboard/bounding-box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	NativeSelect,
	NativeSelectOption,
} from '@/components/ui/native-select';
import {
	fetchCarer,
	getCurrentOrgContext,
	getOrgManagementError,
	hasOrgPermission,
	updateCarer,
	type AvailabilityDayKey,
	type CarerAvailabilitySlot,
	type CarerDetail,
	type CarerStatus,
	type OrgContext,
	type WeeklyAvailability,
} from '@/lib/org-management';
import { cn } from '@/lib/utils';
import {
	ArrowLeft,
	ChevronRight,
	Clock3,
	Plus,
	Save,
	Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useMemo, useState, type ReactNode } from 'react';

type CarerDraft = {
	hireDate: string;
	employmentType: string;
	experienceYears: string;
	status: CarerStatus;
	availability: WeeklyAvailability;
};

const dayOrder: Array<{ key: AvailabilityDayKey; label: string; short: string }> = [
	{ key: 'monday', label: 'Monday', short: 'Mon' },
	{ key: 'tuesday', label: 'Tuesday', short: 'Tue' },
	{ key: 'wednesday', label: 'Wednesday', short: 'Wed' },
	{ key: 'thursday', label: 'Thursday', short: 'Thu' },
	{ key: 'friday', label: 'Friday', short: 'Fri' },
	{ key: 'saturday', label: 'Saturday', short: 'Sat' },
	{ key: 'sunday', label: 'Sunday', short: 'Sun' },
];

function emptyAvailability(): WeeklyAvailability {
	return {
		monday: [],
		tuesday: [],
		wednesday: [],
		thursday: [],
		friday: [],
		saturday: [],
		sunday: [],
	};
}

function normalizeAvailability(availability?: WeeklyAvailability | null): WeeklyAvailability {
	return {
		...emptyAvailability(),
		...(availability ?? {}),
	};
}

function toDraft(carer: CarerDetail): CarerDraft {
	return {
		hireDate: carer.hireDate.slice(0, 10),
		employmentType: carer.employmentType,
		experienceYears: String(carer.experienceYears),
		status: carer.status,
		availability: normalizeAvailability(carer.availability),
	};
}

function formatDate(date: string) {
	return new Date(date).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

function statusBadgeClassName(status: CarerStatus) {
	switch (status) {
		case 'ACTIVE':
			return 'border border-success/20 bg-success/10 text-success';
		case 'ON_LEAVE':
			return 'border border-care-blue/20 bg-care-blue-light text-care-blue';
		case 'SUSPENDED':
			return 'border border-warning/20 bg-warning/10 text-warning';
		default:
			return 'border border-slate-200 bg-slate-100 text-slate-500';
	}
}

function createSlot(): CarerAvailabilitySlot {
	return {
		id: `draft-${Math.random().toString(36).slice(2, 10)}`,
		startTime: '09:00',
		endTime: '17:00',
		crossesMidnight: false,
	};
}

function Section({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<section className='rounded-xl border border-border bg-white shadow-sm'>
			<div className='border-b border-border px-6 py-5'>
				<h2 className='font-heading text-base font-bold text-foreground'>{title}</h2>
				{description ? <p className='mt-1 text-sm text-slate-600'>{description}</p> : null}
			</div>
			<div className='px-6 py-6'>{children}</div>
		</section>
	);
}

function SummaryCard({
	label,
	value,
	meta,
}: {
	label: string;
	value: string;
	meta: string;
}) {
	return (
		<div className='rounded-xl border border-border bg-white px-5 py-4 shadow-sm'>
			<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
				{label}
			</p>
			<p className='mt-2 text-lg font-bold text-foreground'>{value}</p>
			<p className='mt-1 text-sm text-slate-500'>{meta}</p>
		</div>
	);
}

export default function CarerProfilePage({
	params,
}: {
	params: Promise<{ carerId: string }>;
}) {
	const { carerId } = use(params);
	const [orgContext, setOrgContext] = useState<OrgContext | null>(null);
	const [carer, setCarer] = useState<CarerDetail | null>(null);
	const [draft, setDraft] = useState<CarerDraft | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				const context = await getCurrentOrgContext();
				if (!isMounted) {
					return;
				}

				setOrgContext(context);
				if (!hasOrgPermission(context, 'view_users')) {
					setErrorMessage('You do not have permission to view carers.');
					return;
				}

				const nextCarer = await fetchCarer(context.organizationId, carerId);
				if (!isMounted) {
					return;
				}

				setCarer(nextCarer);
				setDraft(toDraft(nextCarer));
			} catch (error) {
				if (isMounted) {
					setErrorMessage(
						getOrgManagementError(error, 'Unable to load this carer profile.'),
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
	}, [carerId]);

	const canManageCarers = orgContext
		? hasOrgPermission(orgContext, 'manage_carers')
		: false;

	const hasChanges = useMemo(() => {
		if (!carer || !draft) {
			return false;
		}

		return JSON.stringify(toDraft(carer)) !== JSON.stringify(draft);
	}, [carer, draft]);

	const setDaySlots = (
		day: AvailabilityDayKey,
		updater: (slots: CarerAvailabilitySlot[]) => CarerAvailabilitySlot[],
	) => {
		setDraft((current) =>
			current
				? {
						...current,
						availability: {
							...current.availability,
							[day]: updater(current.availability[day]),
						},
				  }
				: current,
		);
	};

	const handleSave = async () => {
		if (!orgContext || !carer || !draft || !canManageCarers) {
			return;
		}

		try {
			setIsSaving(true);
			setErrorMessage('');
			setSuccessMessage('');

			const updated = await updateCarer(orgContext.organizationId, carer.id, {
				hireDate: draft.hireDate,
				employmentType: draft.employmentType.trim(),
				experienceYears: Number.parseInt(draft.experienceYears || '0', 10),
				status: draft.status,
				availability: draft.availability,
			});

			setCarer(updated);
			setDraft(toDraft(updated));
			setSuccessMessage('Carer profile updated successfully.');
		} catch (error) {
			setErrorMessage(
				getOrgManagementError(error, 'Unable to update this carer profile.'),
			);
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<BoundingBox className='max-w-6xl'>
				<p className='text-sm text-slate-500'>Loading carer profile...</p>
			</BoundingBox>
		);
	}

	if (!carer || !draft) {
		return (
			<BoundingBox className='max-w-6xl'>
				<p className='text-sm font-semibold text-foreground'>
					{errorMessage || 'Carer not found.'}
				</p>
				<Link
					href='/dashboard/staff'
					className='mt-3 inline-flex text-sm font-semibold text-care-blue hover:underline'>
					Back to Staff
				</Link>
			</BoundingBox>
		);
	}

	return (
		<BoundingBox className='max-w-7xl'>
			<nav aria-label='Breadcrumb' className='mb-6'>
				<ol className='flex items-center gap-1.5 text-sm'>
					<li>
						<Link
							href='/dashboard/staff'
							className='font-medium text-slate-500 transition-colors hover:text-care-blue'>
							Staff Management
						</Link>
					</li>
					<li aria-hidden='true'>
						<ChevronRight className='size-3.5 text-slate-400' />
					</li>
					<li>
						<span className='font-semibold text-foreground' aria-current='page'>
							{carer.firstName} {carer.lastName}
						</span>
					</li>
				</ol>
			</nav>

			<div className='mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
				<div>
					<div className='flex items-center gap-3'>
						<Link
							href='/dashboard/staff'
							className='flex size-9 items-center justify-center rounded-lg border border-border text-slate-500 transition-colors hover:bg-muted hover:text-foreground'
							aria-label='Back to Staff Management'>
							<ArrowLeft className='size-4' />
						</Link>
						<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
							{carer.firstName} {carer.lastName}
						</h1>
						<span
							className={cn(
								'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
								statusBadgeClassName(draft.status),
							)}>
							{draft.status === 'ON_LEAVE'
								? 'On Leave'
								: draft.status.charAt(0) + draft.status.slice(1).toLowerCase()}
						</span>
					</div>
					<p className='mt-3 max-w-2xl text-sm leading-relaxed text-slate-600'>
						Manage employment details and the structured weekly availability used for
						carer scheduling. Availability supports multiple time windows per day and
						overnight shifts.
					</p>
				</div>

				{canManageCarers ? (
					<Button
						type='button'
						size='lg'
						onClick={handleSave}
						disabled={!hasChanges || isSaving}>
						<Save className='size-4' />
						{isSaving ? 'Saving...' : 'Save changes'}
					</Button>
				) : null}
			</div>

			<div className='mb-5 min-h-5'>
				{errorMessage ? (
					<p className='text-sm font-medium text-red-600'>{errorMessage}</p>
				) : null}
				{successMessage ? (
					<p className='text-sm font-medium text-green-600'>{successMessage}</p>
				) : null}
			</div>

			<div className='mb-6 grid gap-4 md:grid-cols-3'>
				<SummaryCard
					label='Email'
					value={carer.email}
					meta='Primary contact for staff access'
				/>
				<SummaryCard
					label='Hire Date'
					value={formatDate(carer.hireDate)}
					meta='Employment start recorded on the carer profile'
				/>
				<SummaryCard
					label='Experience'
					value={`${carer.experienceYears} year${carer.experienceYears === 1 ? '' : 's'}`}
					meta='Used for staffing and rota context'
				/>
			</div>

			<div className='grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]'>
				<Section
					title='Employment Details'
					description='These fields stay on the core carer record.'>
					<div className='space-y-5'>
						<div className='space-y-2'>
							<Label htmlFor='hire-date'>Hire Date</Label>
							<Input
								id='hire-date'
								type='date'
								disabled={!canManageCarers}
								value={draft.hireDate}
								onChange={(event) =>
									setDraft((current) =>
										current ? { ...current, hireDate: event.target.value } : current,
									)
								}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='employment-type'>Employment Type</Label>
							<NativeSelect
								id='employment-type'
								className='w-full'
								disabled={!canManageCarers}
								value={draft.employmentType}
								onChange={(event) =>
									setDraft((current) =>
										current
											? { ...current, employmentType: event.target.value }
											: current,
									)
								}>
								<NativeSelectOption value='Full-Time'>Full-Time</NativeSelectOption>
								<NativeSelectOption value='Part-Time'>Part-Time</NativeSelectOption>
								<NativeSelectOption value='Bank'>Bank</NativeSelectOption>
								<NativeSelectOption value='Agency'>Agency</NativeSelectOption>
							</NativeSelect>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='experience-years'>Years of Experience</Label>
							<Input
								id='experience-years'
								type='number'
								min={0}
								max={50}
								disabled={!canManageCarers}
								value={draft.experienceYears}
								onChange={(event) =>
									setDraft((current) =>
										current
											? { ...current, experienceYears: event.target.value }
											: current,
									)
								}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='status'>Status</Label>
							<NativeSelect
								id='status'
								className='w-full'
								disabled={!canManageCarers}
								value={draft.status}
								onChange={(event) =>
									setDraft((current) =>
										current
											? { ...current, status: event.target.value as CarerStatus }
											: current,
									)
								}>
								<NativeSelectOption value='ACTIVE'>Active</NativeSelectOption>
								<NativeSelectOption value='ON_LEAVE'>On Leave</NativeSelectOption>
								<NativeSelectOption value='SUSPENDED'>Suspended</NativeSelectOption>
								<NativeSelectOption value='TERMINATED'>Terminated</NativeSelectOption>
							</NativeSelect>
						</div>
					</div>
				</Section>

				<Section
					title='Weekly Availability'
					description='Add one or more time windows for each day. Leaving a day empty means the carer is unavailable that day.'>
					<div className='space-y-4'>
						{dayOrder.map((day) => {
							const daySlots = draft.availability[day.key];
							return (
								<div
									key={day.key}
									className='rounded-xl border border-border bg-slate-50/70 p-4'>
									<div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
										<div>
											<p className='text-sm font-semibold text-foreground'>
												{day.label}
											</p>
											<p className='mt-1 text-xs text-slate-500'>
												{daySlots.length === 0
													? 'Closed'
													: `${daySlots.length} time window${daySlots.length === 1 ? '' : 's'}`}
											</p>
										</div>
										{canManageCarers ? (
											<Button
												type='button'
												variant='outline'
												size='sm'
												onClick={() =>
													setDaySlots(day.key, (slots) => [...slots, createSlot()])
												}>
												<Plus className='size-4' />
												Add Window
											</Button>
										) : null}
									</div>

									{daySlots.length === 0 ? (
										<div className='flex items-center gap-2 rounded-lg border border-dashed border-border bg-white px-3 py-3 text-sm text-slate-500'>
											<Clock3 className='size-4' />
											No availability set for {day.short}.
										</div>
									) : (
										<div className='space-y-3'>
											{daySlots.map((slot, slotIndex) => (
												<div
													key={slot.id}
													className='grid gap-3 rounded-lg border border-border bg-white p-3 lg:grid-cols-[9rem_9rem_auto_auto]'>
													<div className='space-y-2'>
														<Label>Start</Label>
														<Input
															type='time'
															disabled={!canManageCarers}
															value={slot.startTime}
															onChange={(event) =>
																setDaySlots(day.key, (slots) =>
																	slots.map((existing, existingIndex) =>
																		existingIndex === slotIndex
																			? {
																					...existing,
																					startTime: event.target.value,
																			  }
																			: existing,
																	),
																)
															}
														/>
													</div>
													<div className='space-y-2'>
														<Label>End</Label>
														<Input
															type='time'
															disabled={!canManageCarers}
															value={slot.endTime}
															onChange={(event) =>
																setDaySlots(day.key, (slots) =>
																	slots.map((existing, existingIndex) =>
																		existingIndex === slotIndex
																			? {
																					...existing,
																					endTime: event.target.value,
																			  }
																			: existing,
																	),
																)
															}
														/>
													</div>
													<label className='flex items-center gap-2 text-sm text-slate-600 lg:self-end lg:pb-2'>
														<input
															type='checkbox'
															disabled={!canManageCarers}
															checked={slot.crossesMidnight}
															onChange={(event) =>
																setDaySlots(day.key, (slots) =>
																	slots.map((existing, existingIndex) =>
																		existingIndex === slotIndex
																			? {
																					...existing,
																					crossesMidnight:
																						event.target.checked,
																			  }
																			: existing,
																	),
																)
															}
															className='size-4 rounded border-border'
														/>
														Overnight
													</label>
													<div className='flex items-end lg:justify-end'>
														{canManageCarers ? (
															<Button
																type='button'
																variant='ghost'
																size='sm'
																onClick={() =>
																	setDaySlots(day.key, (slots) =>
																		slots.filter(
																			(_, existingIndex) =>
																				existingIndex !== slotIndex,
																		),
																	)
																}>
																<Trash2 className='size-4' />
																Remove
															</Button>
														) : null}
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</Section>
			</div>
		</BoundingBox>
	);
}
