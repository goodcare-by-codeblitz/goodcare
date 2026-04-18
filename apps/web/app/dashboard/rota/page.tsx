'use client';

import { BoundingBox } from '@/components/dashboard/bounding-box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	NativeSelect,
	NativeSelectOption,
} from '@/components/ui/native-select';
import {
	assignVisitCarer,
	fetchCarers,
	fetchPatients,
	fetchVisits,
	getCurrentOrgContext,
	getOrgManagementError,
	hasOrgPermission,
	previewVisitAssignment,
	unassignVisitCarer,
	type CarerListItem,
	type OrgContext,
	type PatientListItem,
	type VisitAssignmentPreview,
	type VisitRecord,
	type VisitStatus,
} from '@/lib/org-management';
import { cn } from '@/lib/utils';
import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	ExternalLink,
	Search,
	UsersRound,
	X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, type DragEvent } from 'react';

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

function WarningList({
	preview,
}: {
	preview: VisitAssignmentPreview | null;
}) {
	if (!preview || preview.warnings.length === 0) {
		return null;
	}

	return (
		<div className='space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'>
			<p className='font-semibold'>Assignment warnings</p>
			{preview.warnings.map((warning, index) => (
				<div key={`${warning.code}-${index}`} className='rounded-lg bg-white/70 p-3'>
					<p>{warning.message}</p>
					{warning.relatedVisit ? (
						<p className='mt-1 text-xs text-amber-800'>
							Related visit: {warning.relatedVisit.patientName} from{' '}
							{formatDateTime(warning.relatedVisit.scheduledStart)} to{' '}
							{formatTime(warning.relatedVisit.scheduledEnd)}
						</p>
					) : null}
				</div>
			))}
		</div>
	);
}

function VisitBar({
	visit,
	canAssign,
	onOpen,
	onDragStart,
}: {
	visit: VisitRecord;
	canAssign: boolean;
	onOpen: (visitId: string) => void;
	onDragStart: (visitId: string) => void;
}) {
	const firstAssignment = visit.assignments[0] ?? null;

	return (
		<button
			type='button'
			draggable={canAssign}
			onDragStart={() => onDragStart(visit.id)}
			onClick={() => onOpen(visit.id)}
			className={cn(
				'absolute top-2 h-[60px] rounded-xl border-l-4 px-3 py-2 text-left shadow-sm transition-transform hover:-translate-y-0.5',
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
		</button>
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
	const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
	const [drawerCarerId, setDrawerCarerId] = useState('');
	const [rowCarerSelections, setRowCarerSelections] = useState<Record<string, string>>({});
	const [preview, setPreview] = useState<VisitAssignmentPreview | null>(null);
	const [pendingAssignment, setPendingAssignment] = useState<{
		visitId: string;
		carerId: string;
	} | null>(null);
	const [draggedVisitId, setDraggedVisitId] = useState<string | null>(null);
	const [dropTargetCarerId, setDropTargetCarerId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isAssigning, setIsAssigning] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	const canAssignVisits = orgContext
		? hasOrgPermission(orgContext, 'assign_visits')
		: false;

	const loadData = async (contextOverride?: OrgContext) => {
		const context = contextOverride ?? (await getCurrentOrgContext());
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

		return { context, visits: visitResult.visits };
	};

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

				await loadData(context);
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

			const assignmentNames = visit.assignments
				.map(
					(assignment) =>
						`${assignment.carer.organizationUser.user.firstName} ${assignment.carer.organizationUser.user.lastName}`,
				)
				.join(' ')
				.toLowerCase();

			return (
				`${visit.patient.firstName} ${visit.patient.lastName}`.toLowerCase().includes(needle) ||
				assignmentNames.includes(needle)
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
			entry.sort((left, right) => left.scheduledStart.localeCompare(right.scheduledStart));
		}

		unassigned.sort((left, right) => left.scheduledStart.localeCompare(right.scheduledStart));
		return { grouped, unassigned };
	}, [visibleVisits]);

	const visibleCarers = useMemo(() => {
		const needle = search.trim().toLowerCase();
		return carers.filter((carer) => {
			if (!needle) {
				return true;
			}

			const ownName = `${carer.firstName} ${carer.lastName}`.toLowerCase();
			if (ownName.includes(needle)) {
				return true;
			}

			return (visitsByCarer.grouped.get(carer.id) ?? []).some((visit) =>
				`${visit.patient.firstName} ${visit.patient.lastName}`.toLowerCase().includes(needle),
			);
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
	const showNowLine = selectedDate === now.toISOString().slice(0, 10);
	const nowX = showNowLine
		? ((now.getHours() - DAY_START) * 60 + now.getMinutes()) / 60 * HOUR_WIDTH
		: null;

	const selectedVisit = selectedVisitId
		? visits.find((visit) => visit.id === selectedVisitId) ?? null
		: null;

	const availableCarersForVisit = useMemo(() => {
		if (!selectedVisit) {
			return carers;
		}

		const assignedIds = new Set(selectedVisit.assignments.map((assignment) => assignment.carer.id));
		return carers.filter((carer) => !assignedIds.has(carer.id));
	}, [carers, selectedVisit]);

	const resetAssignmentState = () => {
		setPreview(null);
		setPendingAssignment(null);
		setDrawerCarerId('');
	};

	const openDrawer = (visitId: string) => {
		setSelectedVisitId(visitId);
		resetAssignmentState();
	};

	const refreshAfterAssignment = async () => {
		if (!orgContext) {
			return;
		}

		const result = await loadData(orgContext);
		if (selectedVisitId) {
			const stillSelected = result.visits.find((visit) => visit.id === selectedVisitId);
			if (!stillSelected) {
				setSelectedVisitId(null);
			}
		}
	};

	const beginAssignment = async (visitId: string, carerId: string) => {
		if (!orgContext || !canAssignVisits) {
			return;
		}

		const visit = visits.find((entry) => entry.id === visitId);
		if (!visit) {
			return;
		}

		if (visit.assignments.some((assignment) => assignment.carer.id === carerId)) {
			setErrorMessage('That carer is already assigned to this visit.');
			return;
		}

		try {
			setIsAssigning(true);
			setErrorMessage('');
			setSuccessMessage('');

			const nextPreview = await previewVisitAssignment(
				orgContext.organizationId,
				visitId,
				carerId,
			);
			setPreview(nextPreview);
			setPendingAssignment({ visitId, carerId });
			setSelectedVisitId(visitId);

			if (nextPreview.warnings.length === 0) {
				await assignVisitCarer(orgContext.organizationId, visitId, carerId);
				await refreshAfterAssignment();
				setPreview(null);
				setPendingAssignment(null);
				setSuccessMessage('Carer assigned to visit.');
			}
		} catch (error) {
			setErrorMessage(getOrgManagementError(error, 'Unable to assign this carer.'));
		} finally {
			setIsAssigning(false);
		}
	};

	const confirmAssignment = async () => {
		if (!orgContext || !pendingAssignment) {
			return;
		}

		try {
			setIsAssigning(true);
			setErrorMessage('');
			await assignVisitCarer(
				orgContext.organizationId,
				pendingAssignment.visitId,
				pendingAssignment.carerId,
			);
			await refreshAfterAssignment();
			setSuccessMessage('Carer assigned to visit.');
			setPreview(null);
			setPendingAssignment(null);
			setDrawerCarerId('');
		} catch (error) {
			setErrorMessage(getOrgManagementError(error, 'Unable to assign this carer.'));
		} finally {
			setIsAssigning(false);
		}
	};

	const handleUnassign = async (visitId: string, carerId: string) => {
		if (!orgContext || !canAssignVisits) {
			return;
		}

		try {
			setIsAssigning(true);
			setErrorMessage('');
			await unassignVisitCarer(orgContext.organizationId, visitId, carerId);
			await refreshAfterAssignment();
			setSuccessMessage('Carer removed from visit.');
		} catch (error) {
			setErrorMessage(getOrgManagementError(error, 'Unable to remove this carer.'));
		} finally {
			setIsAssigning(false);
		}
	};

	const handleDragStart = (visitId: string) => {
		if (!canAssignVisits) {
			return;
		}
		setDraggedVisitId(visitId);
	};

	const handleDropOnCarer = async (
		event: DragEvent<HTMLDivElement>,
		carerId: string,
	) => {
		event.preventDefault();
		setDropTargetCarerId(null);
		const visitId = draggedVisitId;
		setDraggedVisitId(null);
		if (!visitId) {
			return;
		}

		await beginAssignment(visitId, carerId);
	};

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
							Visits & Roster
						</h1>
					</div>
					<p className='mt-3 max-w-3xl text-sm leading-relaxed text-slate-600'>
						Manage calls on the organization-wide gant roster, assign carers inline,
						and use drag-and-drop to place visits quickly while still surfacing
						availability and overlap warnings before you commit.
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

			<div className='mb-4 min-h-5'>
				{errorMessage ? <p className='text-sm font-medium text-red-600'>{errorMessage}</p> : null}
				{successMessage ? (
					<p className='text-sm font-medium text-green-600'>{successMessage}</p>
				) : null}
			</div>

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
					<span>
						Drag a visit onto a carer row to assign it, or open a visit to manage it in the drawer.
					</span>
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
								<VisitBar
									key={visit.id}
									visit={visit}
									canAssign={canAssignVisits}
									onOpen={openDrawer}
									onDragStart={handleDragStart}
								/>
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
									dropTargetCarerId === carer.id && 'ring-2 ring-care-blue/30',
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
											{carer.employmentType} · {rowVisits.length} visit{rowVisits.length === 1 ? '' : 's'}
										</p>
									</div>
								</div>
								<div
									className='relative h-[76px] flex-1'
									onDragOver={(event) => {
										if (!canAssignVisits) {
											return;
										}
										event.preventDefault();
										setDropTargetCarerId(carer.id);
									}}
									onDragLeave={() => setDropTargetCarerId((current) => (current === carer.id ? null : current))}
									onDrop={(event) => void handleDropOnCarer(event, carer.id)}>
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
										<VisitBar
											key={`${carer.id}-${visit.id}`}
											visit={visit}
											canAssign={canAssignVisits}
											onOpen={openDrawer}
											onDragStart={handleDragStart}
										/>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<div className='mt-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm'>
				<div className='grid gap-4 border-b border-border px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid-cols-[minmax(0,1fr)_10rem_16rem_18rem_10rem]'>
					<span>Visit details</span>
					<span>Status</span>
					<span>Assignments</span>
					<span>Quick assign</span>
					<span>Open</span>
				</div>
				{visibleVisits.map((visit) => {
					const selectedCarerId = rowCarerSelections[visit.id] ?? '';
					const unassignedCarers = carers.filter(
						(carer) =>
							!visit.assignments.some((assignment) => assignment.carer.id === carer.id),
					);

					return (
						<div
							key={visit.id}
							className='grid gap-4 border-b border-border px-6 py-4 md:grid-cols-[minmax(0,1fr)_10rem_16rem_18rem_10rem] md:items-center'>
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
							<div className='space-y-2'>
								{visit.assignments.length > 0 ? (
									visit.assignments.map((assignment) => (
										<div
											key={assignment.id}
											className='flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm'>
											<span className='truncate'>
												{assignment.carer.organizationUser.user.firstName}{' '}
												{assignment.carer.organizationUser.user.lastName}
											</span>
											{canAssignVisits ? (
												<button
													type='button'
													onClick={() => void handleUnassign(visit.id, assignment.carer.id)}
													className='font-semibold text-red-600 hover:underline'>
													Remove
												</button>
											) : null}
										</div>
									))
								) : (
									<p className='text-sm text-slate-500'>Unassigned</p>
								)}
							</div>
							<div className='space-y-2'>
								<NativeSelect
									className='w-full'
									disabled={!canAssignVisits || unassignedCarers.length === 0}
									value={selectedCarerId}
									onChange={(event) =>
										setRowCarerSelections((current) => ({
											...current,
											[visit.id]: event.target.value,
										}))
									}>
									<NativeSelectOption value=''>Select carer</NativeSelectOption>
									{unassignedCarers.map((carer) => (
										<NativeSelectOption key={carer.id} value={carer.id}>
											{carer.firstName} {carer.lastName}
										</NativeSelectOption>
									))}
								</NativeSelect>
								{canAssignVisits ? (
									<Button
										type='button'
										size='sm'
										variant='outline'
										disabled={!selectedCarerId || isAssigning}
										onClick={() => void beginAssignment(visit.id, selectedCarerId)}>
										Assign
									</Button>
								) : null}
							</div>
							<div className='flex items-center gap-3'>
								<Button type='button' size='sm' variant='outline' onClick={() => openDrawer(visit.id)}>
									Manage
								</Button>
								<Link
									href={`/dashboard/patients/${visit.patientId}/rota`}
									className='text-sm font-semibold text-care-blue hover:underline'>
									Patient rota
								</Link>
							</div>
						</div>
					);
				})}
				{visibleVisits.length === 0 ? (
					<div className='px-6 py-10 text-sm text-slate-500'>
						No visits match the current filters for this day.
					</div>
				) : null}
			</div>

			{selectedVisit ? (
				<div className='fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-border bg-white shadow-2xl'>
					<div className='flex h-full flex-col'>
						<div className='flex items-start justify-between border-b border-border px-6 py-5'>
							<div>
								<p className='text-sm font-semibold text-slate-500'>Visit assignment</p>
								<h2 className='mt-1 font-heading text-xl font-bold text-foreground'>
									{selectedVisit.patient.firstName} {selectedVisit.patient.lastName}
								</h2>
								<p className='mt-2 text-sm text-slate-600'>
									{formatDateTime(selectedVisit.scheduledStart)} - {formatTime(selectedVisit.scheduledEnd)}
								</p>
							</div>
							<button
								type='button'
								onClick={() => {
									setSelectedVisitId(null);
									resetAssignmentState();
								}}
								className='rounded-lg border border-border p-2 text-slate-500 hover:bg-muted'>
								<X className='size-4' />
							</button>
						</div>

						<div className='flex-1 space-y-6 overflow-y-auto px-6 py-6'>
							<div className='flex items-center justify-between rounded-xl border border-border bg-slate-50 px-4 py-3'>
								<div>
									<p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
										Status
									</p>
									<div className='mt-2'>
										<StatusBadge status={selectedVisit.status} />
									</div>
								</div>
								<Link
									href={`/dashboard/patients/${selectedVisit.patientId}/rota`}
									className='inline-flex items-center gap-2 text-sm font-semibold text-care-blue hover:underline'>
									Open patient rota
									<ExternalLink className='size-4' />
								</Link>
							</div>

							<section className='space-y-3'>
								<h3 className='text-sm font-semibold text-foreground'>Assigned carers</h3>
								{selectedVisit.assignments.length > 0 ? (
									selectedVisit.assignments.map((assignment) => (
										<div
											key={assignment.id}
											className='flex items-center justify-between rounded-xl border border-border px-4 py-3'>
											<div>
												<p className='text-sm font-semibold text-foreground'>
													{assignment.carer.organizationUser.user.firstName}{' '}
													{assignment.carer.organizationUser.user.lastName}
												</p>
												<p className='mt-1 text-xs text-slate-500'>
													Currently assigned to this visit
												</p>
											</div>
											{canAssignVisits ? (
												<Button
													type='button'
													variant='outline'
													size='sm'
													onClick={() =>
														void handleUnassign(selectedVisit.id, assignment.carer.id)
													}
													disabled={isAssigning}>
													Remove
												</Button>
											) : null}
										</div>
									))
								) : (
									<p className='text-sm text-slate-500'>No carers assigned yet.</p>
								)}
							</section>

							<section className='space-y-4 rounded-xl border border-border p-4'>
								<div>
									<h3 className='text-sm font-semibold text-foreground'>Assign a carer</h3>
									<p className='mt-1 text-sm text-slate-600'>
										Preview warnings before assigning, or drag this visit onto a
										carer row from the roster board.
									</p>
								</div>
								<NativeSelect
									className='w-full'
									disabled={!canAssignVisits || availableCarersForVisit.length === 0}
									value={drawerCarerId}
									onChange={(event) => {
										setDrawerCarerId(event.target.value);
										setPreview(null);
										setPendingAssignment(null);
									}}>
									<NativeSelectOption value=''>Select carer</NativeSelectOption>
									{availableCarersForVisit.map((carer) => (
										<NativeSelectOption key={carer.id} value={carer.id}>
											{carer.firstName} {carer.lastName}
										</NativeSelectOption>
									))}
								</NativeSelect>

								{pendingAssignment?.visitId === selectedVisit.id &&
								pendingAssignment.carerId === drawerCarerId ? (
									<WarningList preview={preview} />
								) : null}

								{canAssignVisits ? (
									<div className='flex flex-wrap gap-3'>
										<Button
											type='button'
											variant='outline'
											disabled={!drawerCarerId || isAssigning}
											onClick={() => void beginAssignment(selectedVisit.id, drawerCarerId)}>
											Preview assignment
										</Button>
										{preview &&
										preview.warnings.length > 0 &&
										pendingAssignment?.visitId === selectedVisit.id &&
										pendingAssignment.carerId === drawerCarerId ? (
											<Button
												type='button'
												disabled={isAssigning}
												onClick={() => void confirmAssignment()}>
												Assign anyway
											</Button>
										) : null}
									</div>
								) : null}
							</section>
						</div>
					</div>
				</div>
			) : null}
		</BoundingBox>
	);
}
