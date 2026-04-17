'use client';

import { BoundingBox } from '@/components/dashboard/bounding-box';
import { Input } from '@/components/ui/input';
import {
	NativeSelect,
	NativeSelectOption,
} from '@/components/ui/native-select';
import {
	fetchCarers,
	fetchPatients,
	fetchVisits,
	getCurrentOrgContext,
	getOrgManagementError,
	hasOrgPermission,
	type CarerListItem,
	type OrgContext,
	type PatientListItem,
	type VisitRecord,
	type VisitStatus,
} from '@/lib/org-management';
import { cn } from '@/lib/utils';
import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Search,
	UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type FilterStatus = 'ALL' | VisitStatus;

const DAY_START = 6;
const DAY_END = 22;
const HOUR_WIDTH = 120;
const CARER_COLUMN_WIDTH = 240;
const HOURS = Array.from({ length: DAY_END - DAY_START + 1 }, (_, index) => DAY_START + index);

const statusBadgeClassNames: Record<VisitStatus, string> = {
	SCHEDULED: 'border-sky-200 bg-sky-50 text-sky-700',
	IN_PROGRESS: 'border-amber-200 bg-amber-50 text-amber-700',
	COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
	CANCELLED: 'border-slate-200 bg-slate-100 text-slate-600',
	NO_SHOW: 'border-red-200 bg-red-50 text-red-700',
};

const statusBarClassNames: Record<VisitStatus, string> = {
	SCHEDULED: 'border-sky-400 bg-sky-50 text-sky-900',
	IN_PROGRESS: 'border-amber-400 bg-amber-50 text-amber-900',
	COMPLETED: 'border-emerald-400 bg-emerald-50 text-emerald-900',
	CANCELLED: 'border-slate-300 bg-slate-100 text-slate-700',
	NO_SHOW: 'border-red-400 bg-red-50 text-red-900',
};

function formatDayLabel(date: string) {
	return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
}

function formatDateTime(date: string) {
	return new Date(date).toLocaleString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function formatTime(date: string) {
	return new Date(date).toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
	});
}

function getDateKey(date: string) {
	return date.slice(0, 10);
}

function getMinutesFromStart(date: string) {
	const parsed = new Date(date);
	return (parsed.getHours() - DAY_START) * 60 + parsed.getMinutes();
}

function timeToX(date: string) {
	return Math.max(0, (getMinutesFromStart(date) / 60) * HOUR_WIDTH);
}

function durationToWidth(start: string, end: string) {
	const durationMinutes =
		(new Date(end).getTime() - new Date(start).getTime()) / 60000;
	return Math.max(56, (durationMinutes / 60) * HOUR_WIDTH);
}

function StatusBadge({ status }: { status: VisitStatus }) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
				statusBadgeClassNames[status],
			)}>
			{status.replace('_', ' ')}
		</span>
	);
}

function VisitBar({ visit }: { visit: VisitRecord }) {
	const firstAssignment = visit.assignments[0] ?? null;

	return (
		<Link
			href={`/dashboard/patients/${visit.patientId}/rota`}
			className={cn(
				'absolute top-2 h-[60px] rounded-xl border-l-4 px-3 py-2 shadow-sm transition-transform hover:-translate-y-0.5',
				statusBarClassNames[visit.status],
			)}
			style={{
				left: timeToX(visit.scheduledStart),
				width: durationToWidth(visit.scheduledStart, visit.scheduledEnd),
			}}>
			<p className='truncate text-sm font-semibold'>
				{visit.patient.firstName} {visit.patient.lastName}
			</p>
			<p className='mt-1 text-xs opacity-80'>
				{formatTime(visit.scheduledStart)} - {formatTime(visit.scheduledEnd)}
			</p>
			<p className='mt-1 truncate text-[11px] opacity-70'>
				{firstAssignment
					? `${firstAssignment.carer.organizationUser.user.firstName} ${firstAssignment.carer.organizationUser.user.lastName}`
					: 'Open visit'}
			</p>
		</Link>
	);
}

export default function RotaPage() {
	const [orgContext, setOrgContext] = useState<OrgContext | null>(null);
	const [patients, setPatients] = useState<PatientListItem[]>([]);
	const [carers, setCarers] = useState<CarerListItem[]>([]);
	const [visits, setVisits] = useState<VisitRecord[]>([]);
	const [selectedPatientId, setSelectedPatientId] = useState('ALL');
	const [status, setStatus] = useState<FilterStatus>('ALL');
	const [search, setSearch] = useState('');
	const [selectedDate, setSelectedDate] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				const context = await getCurrentOrgContext();
				if (!isMounted) {
					return;
				}

				setOrgContext(context);
				if (!hasOrgPermission(context, 'view_visits')) {
					setErrorMessage('You do not have permission to view visits.');
					return;
				}

				const [patientResult, carerResult, visitResult] = await Promise.all([
					fetchPatients(context.organizationId, { page: 1, limit: 100 }),
					fetchCarers(context.organizationId, { page: 1, limit: 100 }),
					fetchVisits(context.organizationId, {
						page: 1,
						limit: 200,
						...(selectedPatientId !== 'ALL' ? { patientId: selectedPatientId } : {}),
						...(status !== 'ALL' ? { status } : {}),
					}),
				]);

				if (!isMounted) {
					return;
				}

				setPatients(patientResult.patients);
				setCarers(carerResult.filter((carer) => carer.status !== 'TERMINATED'));
				setVisits(visitResult.visits);

				const availableDates = Array.from(
					new Set(visitResult.visits.map((visit) => getDateKey(visit.scheduledStart))),
				).sort();
				if (availableDates.length > 0) {
					setSelectedDate((current) =>
						current && availableDates.includes(current) ? current : availableDates[0],
					);
				} else {
					setSelectedDate(new Date().toISOString().slice(0, 10));
				}
			} catch (error) {
				if (isMounted) {
					setErrorMessage(getOrgManagementError(error, 'Unable to load the rota.'));
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
	}, [selectedPatientId, status]);

	const availableDates = useMemo(
		() =>
			Array.from(new Set(visits.map((visit) => getDateKey(visit.scheduledStart)))).sort(),
		[visits],
	);

	const selectedDateIndex = availableDates.indexOf(selectedDate);

	const visibleVisits = useMemo(() => {
		const needle = search.trim().toLowerCase();

		return visits.filter((visit) => {
			if (selectedDate && getDateKey(visit.scheduledStart) !== selectedDate) {
				return false;
			}

			if (!needle) {
				return true;
			}

			const carerNames = visit.assignments
				.map(
					(assignment) =>
						`${assignment.carer.organizationUser.user.firstName} ${assignment.carer.organizationUser.user.lastName}`,
				)
				.join(' ')
				.toLowerCase();

			return (
				`${visit.patient.firstName} ${visit.patient.lastName}`.toLowerCase().includes(needle) ||
				carerNames.includes(needle)
			);
		});
	}, [search, selectedDate, visits]);

	const visitsByCarer = useMemo(() => {
		const grouped = new Map<string, VisitRecord[]>();
		const unassigned: VisitRecord[] = [];

		for (const visit of visibleVisits) {
			if (visit.assignments.length === 0) {
				unassigned.push(visit);
				continue;
			}

			for (const assignment of visit.assignments) {
				const entries = grouped.get(assignment.carer.id) ?? [];
				entries.push(visit);
				grouped.set(assignment.carer.id, entries);
			}
		}

		for (const entry of grouped.values()) {
			entry.sort((left, right) =>
				left.scheduledStart.localeCompare(right.scheduledStart),
			);
		}

		unassigned.sort((left, right) =>
			left.scheduledStart.localeCompare(right.scheduledStart),
		);

		return { grouped, unassigned };
	}, [visibleVisits]);

	const visibleCarers = useMemo(() => {
		const needle = search.trim().toLowerCase();
		return carers.filter((carer) => {
			if (needle && !`${carer.firstName} ${carer.lastName}`.toLowerCase().includes(needle)) {
				const hasPatientMatch = (visitsByCarer.grouped.get(carer.id) ?? []).length > 0;
				if (!hasPatientMatch) {
					return false;
				}
			}

			return true;
		});
	}, [carers, search, visitsByCarer.grouped]);

	const stats = useMemo(
		() => ({
			total: visibleVisits.length,
			completed: visibleVisits.filter((visit) => visit.status === 'COMPLETED').length,
			inProgress: visibleVisits.filter((visit) => visit.status === 'IN_PROGRESS').length,
			unassigned: visitsByCarer.unassigned.length,
		}),
		[visibleVisits, visitsByCarer.unassigned.length],
	);

	const now = new Date();
	const nowDateKey = now.toISOString().slice(0, 10);
	const showNowLine = selectedDate === nowDateKey;
	const nowX = showNowLine
		? ((now.getHours() - DAY_START) * 60 + now.getMinutes()) / 60 * HOUR_WIDTH
		: null;

	if (isLoading) {
		return (
			<BoundingBox>
				<p className='text-sm text-slate-500'>Loading visits...</p>
			</BoundingBox>
		);
	}

	if (!orgContext || !hasOrgPermission(orgContext, 'view_visits')) {
		return (
			<BoundingBox>
				<p className='text-sm font-semibold text-foreground'>
					{errorMessage || 'Visits are unavailable.'}
				</p>
			</BoundingBox>
		);
	}

	return (
		<BoundingBox className='max-w-[96%]'>
			<div className='mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
				<div>
					<div className='flex items-center gap-3'>
						<div className='flex size-10 items-center justify-center rounded-xl bg-care-blue-light text-care-blue'>
							<CalendarDays className='size-5' />
						</div>
						<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
							Visits &amp; Roster
						</h1>
					</div>
					<p className='mt-3 max-w-3xl text-sm leading-relaxed text-slate-600'>
						The organization-wide rota is back in a gant-style schedule so you can scan
						assignments by carer, spot gaps quickly, and jump into each patient&apos;s
						detailed rota workflow when you need to manage a specific visit.
					</p>
				</div>
				<div className='flex flex-wrap gap-2'>
					{(
						[
							['Total', stats.total, 'text-slate-700'],
							['Completed', stats.completed, 'text-emerald-600'],
							['In Progress', stats.inProgress, 'text-amber-600'],
							['Unassigned', stats.unassigned, 'text-red-600'],
						] as const
					).map(([label, value, className]) => (
						<div
							key={label}
							className='rounded-xl border border-border bg-white px-4 py-3 shadow-sm'>
							<p className={cn('text-xl font-bold', className)}>{value}</p>
							<p className='text-xs uppercase tracking-wide text-slate-500'>{label}</p>
						</div>
					))}
				</div>
			</div>

			{errorMessage ? <p className='mb-4 text-sm font-medium text-red-600'>{errorMessage}</p> : null}

			<div className='mb-6 grid gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_15rem_12rem_16rem]'>
				<div className='relative'>
					<Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400' />
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className='pl-9'
						placeholder='Search patient or carer'
					/>
				</div>
				<NativeSelect
					className='w-full'
					value={selectedPatientId}
					onChange={(event) => setSelectedPatientId(event.target.value)}>
					<NativeSelectOption value='ALL'>All patients</NativeSelectOption>
					{patients.map((patient) => (
						<NativeSelectOption key={patient.id} value={patient.id}>
							{patient.firstName} {patient.lastName}
						</NativeSelectOption>
					))}
				</NativeSelect>
				<NativeSelect
					className='w-full'
					value={status}
					onChange={(event) => setStatus(event.target.value as FilterStatus)}>
					<NativeSelectOption value='ALL'>All statuses</NativeSelectOption>
					<NativeSelectOption value='SCHEDULED'>Scheduled</NativeSelectOption>
					<NativeSelectOption value='IN_PROGRESS'>In progress</NativeSelectOption>
					<NativeSelectOption value='COMPLETED'>Completed</NativeSelectOption>
					<NativeSelectOption value='CANCELLED'>Cancelled</NativeSelectOption>
					<NativeSelectOption value='NO_SHOW'>No show</NativeSelectOption>
				</NativeSelect>
				<div className='flex items-center gap-2'>
					<button
						type='button'
						disabled={selectedDateIndex <= 0}
						onClick={() =>
							setSelectedDate(
								availableDates[Math.max(0, selectedDateIndex - 1)] ?? selectedDate,
							)
						}
						className='flex size-9 items-center justify-center rounded-lg border border-border text-slate-500 hover:bg-muted disabled:opacity-40'>
						<ChevronLeft className='size-4' />
					</button>
					<input
						type='date'
						value={selectedDate}
						onChange={(event) => setSelectedDate(event.target.value)}
						className='h-9 flex-1 rounded-lg border border-input px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
					/>
					<button
						type='button'
						disabled={
							selectedDateIndex === -1 || selectedDateIndex >= availableDates.length - 1
						}
						onClick={() =>
							setSelectedDate(
								availableDates[
									Math.min(availableDates.length - 1, selectedDateIndex + 1)
								] ?? selectedDate,
							)
						}
						className='flex size-9 items-center justify-center rounded-lg border border-border text-slate-500 hover:bg-muted disabled:opacity-40'>
						<ChevronRight className='size-4' />
					</button>
				</div>
			</div>

			<div className='mb-4 flex items-center justify-between'>
				<div>
					<p className='text-sm font-semibold text-foreground'>
						{selectedDate ? formatDayLabel(selectedDate) : 'Choose a day'}
					</p>
					<p className='text-sm text-slate-500'>
						{visibleCarers.length} carers in view, {visibleVisits.length} visits scheduled
					</p>
				</div>
				<div className='flex items-center gap-2 text-xs text-slate-500'>
					<UsersRound className='size-4' />
					<span>Click any bar to open that patient&apos;s rota workflow</span>
				</div>
			</div>

			<div className='overflow-auto rounded-2xl border border-border bg-white shadow-sm'>
				<div style={{ minWidth: CARER_COLUMN_WIDTH + (DAY_END - DAY_START) * HOUR_WIDTH }}>
					<div className='sticky top-0 z-20 flex border-b border-border bg-white'>
						<div
							className='sticky left-0 z-30 flex shrink-0 items-center border-r border-border bg-white px-4 py-3'
							style={{ width: CARER_COLUMN_WIDTH }}>
							<span className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
								Carer
							</span>
						</div>
						<div className='relative flex-1' style={{ height: 48 }}>
							{HOURS.map((hour, index) => (
								<div
									key={hour}
									className='absolute top-0 bottom-0 border-l border-slate-100'
									style={{ left: index * HOUR_WIDTH, width: HOUR_WIDTH }}>
									<span className='absolute left-2 top-3 text-xs font-medium text-slate-400'>
										{String(hour).padStart(2, '0')}:00
									</span>
								</div>
							))}
							{nowX !== null ? (
								<div
									className='absolute top-0 bottom-0 z-10 w-0.5 bg-red-400'
									style={{ left: nowX }}
								/>
							) : null}
						</div>
					</div>

					<div className='flex border-b border-amber-200 bg-amber-50/60'>
						<div
							className='sticky left-0 z-10 flex shrink-0 items-center border-r border-amber-200 bg-amber-50/60 px-4 py-4'
							style={{ width: CARER_COLUMN_WIDTH }}>
							<div>
								<p className='text-sm font-semibold text-amber-800'>Unassigned visits</p>
								<p className='text-xs text-amber-700'>
									{visitsByCarer.unassigned.length} open visit{visitsByCarer.unassigned.length === 1 ? '' : 's'}
								</p>
							</div>
						</div>
						<div className='relative h-[76px] flex-1'>
							{HOURS.map((hour, index) => (
								<div
									key={hour}
									className='absolute top-0 bottom-0 border-l border-amber-100'
									style={{ left: index * HOUR_WIDTH, width: HOUR_WIDTH }}
								/>
							))}
							{visitsByCarer.unassigned.map((visit) => (
								<VisitBar key={visit.id} visit={visit} />
							))}
						</div>
					</div>

					{visibleCarers.map((carer, index) => {
						const rowVisits = visitsByCarer.grouped.get(carer.id) ?? [];
						return (
							<div
								key={carer.id}
								className={cn(
									'flex border-b border-border',
									index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60',
								)}>
								<div
									className={cn(
										'sticky left-0 z-10 flex shrink-0 items-center gap-3 border-r border-border px-4 py-4',
										index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60',
									)}
									style={{ width: CARER_COLUMN_WIDTH }}>
									<div className='flex size-10 items-center justify-center rounded-full bg-care-blue text-xs font-bold text-white'>
										{`${carer.firstName[0] ?? ''}${carer.lastName[0] ?? ''}`}
									</div>
									<div className='min-w-0'>
										<p className='truncate text-sm font-semibold text-foreground'>
											{carer.firstName} {carer.lastName}
										</p>
										<p className='text-xs text-slate-500'>
											{carer.employmentType} • {rowVisits.length} visit{rowVisits.length === 1 ? '' : 's'}
										</p>
									</div>
								</div>
								<div className='relative h-[76px] flex-1'>
									{HOURS.map((hour, hourIndex) => (
										<div
											key={hour}
											className='absolute top-0 bottom-0 border-l border-slate-100'
											style={{ left: hourIndex * HOUR_WIDTH, width: HOUR_WIDTH }}
										/>
									))}
									{nowX !== null ? (
										<div
											className='absolute top-0 bottom-0 z-10 w-0.5 bg-red-400/70'
											style={{ left: nowX }}
										/>
									) : null}
									{rowVisits.map((visit) => (
										<VisitBar key={`${carer.id}-${visit.id}`} visit={visit} />
									))}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<div className='mt-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm'>
				<div className='grid gap-4 border-b border-border px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid-cols-[minmax(0,1fr)_10rem_12rem_8rem]'>
					<span>Visit details</span>
					<span>Status</span>
					<span>Assignments</span>
					<span>Open</span>
				</div>
				{visibleVisits.map((visit) => (
					<Link
						key={visit.id}
						href={`/dashboard/patients/${visit.patientId}/rota`}
						className='grid gap-4 border-b border-border px-6 py-4 transition-colors hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_10rem_12rem_8rem] md:items-center'>
						<div className='min-w-0'>
							<p className='truncate text-sm font-semibold text-foreground'>
								{visit.patient.firstName} {visit.patient.lastName}
							</p>
							<p className='mt-1 text-sm text-slate-600'>
								{formatDateTime(visit.scheduledStart)} - {formatTime(visit.scheduledEnd)}
							</p>
						</div>
						<div>
							<StatusBadge status={visit.status} />
						</div>
						<p className='text-sm text-slate-600'>
							{visit.assignments.length > 0
								? visit.assignments
										.map(
											(assignment) =>
												`${assignment.carer.organizationUser.user.firstName} ${assignment.carer.organizationUser.user.lastName}`,
										)
										.join(', ')
								: 'Unassigned'}
						</p>
						<p className='text-sm font-semibold text-care-blue'>Open workflow</p>
					</Link>
				))}
				{visibleVisits.length === 0 ? (
					<div className='px-6 py-10 text-sm text-slate-500'>
						No visits match the current filters for this day.
					</div>
				) : null}
			</div>
		</BoundingBox>
	);
}
