'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
	AlertTriangle,
	ArrowLeft,
	Briefcase,
	Check,
	ChevronRight,
	Clock,
	FileText,
	Mail,
	Phone,
	ShieldCheck,
	ShieldX,
	Trash2,
	Upload,
	UserX,
	X,
} from 'lucide-react';
import Link from 'next/link';
import { use, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CarerStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
type QualStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'EXPIRED';
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
type QualFilter = 'VERIFIED' | 'PENDING' | 'ISSUES' | 'EXPIRING_SOON';

interface DaySlot {
	enabled: boolean;
	start: string; // "07:00"
	end: string; // "19:00"
}

type WeeklyAvailability = Record<DayKey, DaySlot>;

interface Qualification {
	id: string;
	name: string;
	key: string;
	fileUrl: string | null;
	status: QualStatus;
	issuedAt: string | null;
	expiresAt: string | null;
	expires: boolean;
}

interface CarerProfile {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	employmentType: string;
	status: CarerStatus;
	hireDate: string;
	experienceYears: number;
	availability: WeeklyAvailability;
	avatarColor: string;
	qualifications: Qualification[];
}

/* ------------------------------------------------------------------ */
/*  Availability helpers                                               */
/* ------------------------------------------------------------------ */

const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<DayKey, string> = {
	mon: 'Monday',
	tue: 'Tuesday',
	wed: 'Wednesday',
	thu: 'Thursday',
	fri: 'Friday',
	sat: 'Saturday',
	sun: 'Sunday',
};
const DAY_SHORT: Record<DayKey, string> = {
	mon: 'Mon',
	tue: 'Tue',
	wed: 'Wed',
	thu: 'Thu',
	fri: 'Fri',
	sat: 'Sat',
	sun: 'Sun',
};

function makeWeek(
	days: Partial<Record<DayKey, { start: string; end: string }>>,
): WeeklyAvailability {
	const base: WeeklyAvailability = {
		mon: { enabled: false, start: '09:00', end: '17:00' },
		tue: { enabled: false, start: '09:00', end: '17:00' },
		wed: { enabled: false, start: '09:00', end: '17:00' },
		thu: { enabled: false, start: '09:00', end: '17:00' },
		fri: { enabled: false, start: '09:00', end: '17:00' },
		sat: { enabled: false, start: '09:00', end: '17:00' },
		sun: { enabled: false, start: '09:00', end: '17:00' },
	};
	for (const [k, v] of Object.entries(days)) {
		base[k as DayKey] = { enabled: true, ...v };
	}
	return base;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_PROFILES: Record<string, CarerProfile> = {
	c1: {
		id: 'c1',
		firstName: 'Sarah',
		lastName: 'Jenkins',
		email: 'sarah.jenkins@sunrisecare.co.uk',
		phone: '07700 900 112',
		employmentType: 'Full-Time',
		status: 'ACTIVE',
		hireDate: '2022-03-15',
		experienceYears: 4,
		avatarColor: '#6366f1',
		availability: makeWeek({
			mon: { start: '07:00', end: '19:00' },
			tue: { start: '07:00', end: '19:00' },
			wed: { start: '07:00', end: '19:00' },
			thu: { start: '07:00', end: '19:00' },
			fri: { start: '07:00', end: '15:00' },
		}),
		qualifications: [
			{
				id: 'q1',
				name: 'DBS Check (Enhanced)',
				key: 'dbs-enhanced',
				fileUrl: 'DBS_Certificate_2024.pdf',
				status: 'VERIFIED',
				issuedAt: '2024-01-10',
				expiresAt: '2027-01-10',
				expires: true,
			},
			{
				id: 'q2',
				name: 'First Aid (Level 3)',
				key: 'first-aid-l3',
				fileUrl: 'FirstAid_L3_2023.pdf',
				status: 'VERIFIED',
				issuedAt: '2023-06-01',
				expiresAt: '2026-06-01',
				expires: true,
			},
			{
				id: 'q3',
				name: 'Moving & Handling',
				key: 'moving-handling',
				fileUrl: 'MovingHandling_2023.pdf',
				status: 'VERIFIED',
				issuedAt: '2023-04-14',
				expiresAt: '2026-04-14',
				expires: true,
			},
			{
				id: 'q4',
				name: 'Care Certificate',
				key: 'care-certificate',
				fileUrl: 'CareCert.pdf',
				status: 'VERIFIED',
				issuedAt: '2022-04-01',
				expiresAt: null,
				expires: false,
			},
			{
				id: 'q5',
				name: 'Medication Administration',
				key: 'medication-admin',
				fileUrl: 'MedAdmin_2024.pdf',
				status: 'VERIFIED',
				issuedAt: '2024-02-20',
				expiresAt: '2026-02-20',
				expires: true,
			},
			{
				id: 'q6',
				name: 'Fire Safety Training',
				key: 'fire-safety',
				fileUrl: 'FireSafety_2024.pdf',
				status: 'VERIFIED',
				issuedAt: '2024-09-01',
				expiresAt: '2025-09-01',
				expires: true,
			},
		],
	},
	c2: {
		id: 'c2',
		firstName: 'David',
		lastName: 'Chen',
		email: 'd.chen@sunrisecare.co.uk',
		phone: '07700 900 221',
		employmentType: 'Part-Time',
		status: 'ACTIVE',
		hireDate: '2023-07-01',
		experienceYears: 2,
		avatarColor: '#0ea5e9',
		availability: makeWeek({
			mon: { start: '08:00', end: '16:00' },
			wed: { start: '08:00', end: '16:00' },
			fri: { start: '08:00', end: '14:00' },
		}),
		qualifications: [
			{
				id: 'q1',
				name: 'DBS Check (Enhanced)',
				key: 'dbs-enhanced',
				fileUrl: 'DBS_Chen.pdf',
				status: 'VERIFIED',
				issuedAt: '2023-06-15',
				expiresAt: '2026-06-15',
				expires: true,
			},
			{
				id: 'q2',
				name: 'First Aid (Level 3)',
				key: 'first-aid-l3',
				fileUrl: null,
				status: 'EXPIRED',
				issuedAt: '2021-05-01',
				expiresAt: '2024-05-01',
				expires: true,
			},
			{
				id: 'q3',
				name: 'Moving & Handling',
				key: 'moving-handling',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
			{
				id: 'q4',
				name: 'Care Certificate',
				key: 'care-certificate',
				fileUrl: 'CareCert_Chen.pdf',
				status: 'VERIFIED',
				issuedAt: '2023-07-20',
				expiresAt: null,
				expires: false,
			},
			{
				id: 'q5',
				name: 'Medication Administration',
				key: 'medication-admin',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
			{
				id: 'q6',
				name: 'Fire Safety Training',
				key: 'fire-safety',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
		],
	},
	c3: {
		id: 'c3',
		firstName: 'Elena',
		lastName: 'Rodriguez',
		email: 'e.rodriguez@sunrisecare.co.uk',
		phone: '07700 900 334',
		employmentType: 'Full-Time',
		status: 'ACTIVE',
		hireDate: '2021-11-20',
		experienceYears: 6,
		avatarColor: '#10b981',
		availability: makeWeek({
			mon: { start: '06:00', end: '22:00' },
			tue: { start: '06:00', end: '22:00' },
			wed: { start: '06:00', end: '14:00' },
			thu: { start: '14:00', end: '22:00' },
			fri: { start: '06:00', end: '22:00' },
			sat: { start: '08:00', end: '16:00' },
		}),
		qualifications: [
			{
				id: 'q1',
				name: 'DBS Check (Enhanced)',
				key: 'dbs-enhanced',
				fileUrl: 'DBS_Rodriguez.pdf',
				status: 'VERIFIED',
				issuedAt: '2024-03-01',
				expiresAt: '2027-03-01',
				expires: true,
			},
			{
				id: 'q2',
				name: 'First Aid (Level 3)',
				key: 'first-aid-l3',
				fileUrl: 'FA_Rodriguez.pdf',
				status: 'VERIFIED',
				issuedAt: '2023-09-10',
				expiresAt: '2026-09-10',
				expires: true,
			},
			{
				id: 'q3',
				name: 'Moving & Handling',
				key: 'moving-handling',
				fileUrl: 'MH_Rodriguez.pdf',
				status: 'VERIFIED',
				issuedAt: '2023-11-01',
				expiresAt: '2026-11-01',
				expires: true,
			},
			{
				id: 'q4',
				name: 'Care Certificate',
				key: 'care-certificate',
				fileUrl: 'CareCert_Rodriguez.pdf',
				status: 'VERIFIED',
				issuedAt: '2022-01-10',
				expiresAt: null,
				expires: false,
			},
			{
				id: 'q5',
				name: 'Medication Administration',
				key: 'medication-admin',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
			{
				id: 'q6',
				name: 'Fire Safety Training',
				key: 'fire-safety',
				fileUrl: 'Fire_Rodriguez.pdf',
				status: 'VERIFIED',
				issuedAt: '2024-08-20',
				expiresAt: '2025-08-20',
				expires: true,
			},
		],
	},
	c4: {
		id: 'c4',
		firstName: 'Thomas',
		lastName: 'Wade',
		email: 'thomas.wade@sunrisecare.co.uk',
		phone: '07700 900 445',
		employmentType: 'Bank',
		status: 'ON_LEAVE',
		hireDate: '2023-02-08',
		experienceYears: 3,
		avatarColor: '#f59e0b',
		availability: makeWeek({
			sat: { start: '09:00', end: '17:00' },
			sun: { start: '09:00', end: '17:00' },
		}),
		qualifications: [
			{
				id: 'q1',
				name: 'DBS Check (Enhanced)',
				key: 'dbs-enhanced',
				fileUrl: 'DBS_Wade.pdf',
				status: 'VERIFIED',
				issuedAt: '2023-01-20',
				expiresAt: '2026-01-20',
				expires: true,
			},
			{
				id: 'q2',
				name: 'First Aid (Level 3)',
				key: 'first-aid-l3',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
			{
				id: 'q3',
				name: 'Moving & Handling',
				key: 'moving-handling',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
			{
				id: 'q4',
				name: 'Care Certificate',
				key: 'care-certificate',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: false,
			},
			{
				id: 'q5',
				name: 'Medication Administration',
				key: 'medication-admin',
				fileUrl: null,
				status: 'REJECTED',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
			{
				id: 'q6',
				name: 'Fire Safety Training',
				key: 'fire-safety',
				fileUrl: 'Fire_Wade.pdf',
				status: 'VERIFIED',
				issuedAt: '2023-03-01',
				expiresAt: '2025-03-01',
				expires: true,
			},
		],
	},
	c5: {
		id: 'c5',
		firstName: 'Amara',
		lastName: 'Osei',
		email: 'a.osei@sunrisecare.co.uk',
		phone: '07700 900 556',
		employmentType: 'Full-Time',
		status: 'ACTIVE',
		hireDate: '2024-01-15',
		experienceYears: 1,
		avatarColor: '#ec4899',
		availability: makeWeek({
			mon: { start: '08:00', end: '18:00' },
			tue: { start: '08:00', end: '18:00' },
			wed: { start: '08:00', end: '18:00' },
			thu: { start: '08:00', end: '18:00' },
			fri: { start: '08:00', end: '18:00' },
		}),
		qualifications: [
			{
				id: 'q1',
				name: 'DBS Check (Enhanced)',
				key: 'dbs-enhanced',
				fileUrl: 'DBS_Osei.pdf',
				status: 'VERIFIED',
				issuedAt: '2024-01-05',
				expiresAt: '2027-01-05',
				expires: true,
			},
			{
				id: 'q2',
				name: 'First Aid (Level 3)',
				key: 'first-aid-l3',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
			{
				id: 'q3',
				name: 'Moving & Handling',
				key: 'moving-handling',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
			{
				id: 'q4',
				name: 'Care Certificate',
				key: 'care-certificate',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: false,
			},
			{
				id: 'q5',
				name: 'Medication Administration',
				key: 'medication-admin',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
			{
				id: 'q6',
				name: 'Fire Safety Training',
				key: 'fire-safety',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
		],
	},
	c6: {
		id: 'c6',
		firstName: 'Liam',
		lastName: 'Peterson',
		email: 'l.peterson@sunrisecare.co.uk',
		phone: '07700 900 667',
		employmentType: 'Part-Time',
		status: 'SUSPENDED',
		hireDate: '2022-09-12',
		experienceYears: 3,
		avatarColor: '#64748b',
		availability: makeWeek({
			tue: { start: '09:00', end: '17:00' },
			wed: { start: '09:00', end: '17:00' },
			thu: { start: '09:00', end: '17:00' },
		}),
		qualifications: [
			{
				id: 'q1',
				name: 'DBS Check (Enhanced)',
				key: 'dbs-enhanced',
				fileUrl: null,
				status: 'EXPIRED',
				issuedAt: '2020-08-01',
				expiresAt: '2023-08-01',
				expires: true,
			},
			{
				id: 'q2',
				name: 'First Aid (Level 3)',
				key: 'first-aid-l3',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
			{
				id: 'q3',
				name: 'Moving & Handling',
				key: 'moving-handling',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
			{
				id: 'q4',
				name: 'Care Certificate',
				key: 'care-certificate',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: false,
			},
			{
				id: 'q5',
				name: 'Medication Administration',
				key: 'medication-admin',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
			{
				id: 'q6',
				name: 'Fire Safety Training',
				key: 'fire-safety',
				fileUrl: null,
				status: 'PENDING',
				issuedAt: null,
				expiresAt: null,
				expires: true,
			},
		],
	},
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function daysUntil(dateStr: string): number {
	return Math.ceil(
		(new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
	);
}

function complianceScore(qualifications: Qualification[]): number {
	if (qualifications.length === 0) return 0;
	const verified = qualifications.filter((q) => q.status === 'VERIFIED').length;
	return Math.round((verified / qualifications.length) * 100);
}

/* ------------------------------------------------------------------ */
/*  WeeklyScheduleEditor                                               */
/* ------------------------------------------------------------------ */

function WeeklyScheduleEditor({
	value,
	onChange,
}: {
	value: WeeklyAvailability;
	onChange: (next: WeeklyAvailability) => void;
}) {
	function setDay(day: DayKey, patch: Partial<DaySlot>) {
		onChange({ ...value, [day]: { ...value[day], ...patch } });
	}

	const enabledDays = DAY_KEYS.filter((d) => value[d].enabled);

	return (
		<div className='flex flex-col gap-4'>
			{/* Per-day rows */}
			<div
				className='overflow-hidden rounded-lg border border-border'
				role='group'
				aria-label='Weekly availability schedule'>
				{/* Header */}
				<div className='grid grid-cols-[7rem_auto_1fr_1fr] items-center gap-3 border-b border-border bg-slate-50 px-4 py-2'>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Day
					</span>
					<span className='text-xs mr-5 font-semibold uppercase tracking-wider text-slate-400'>
						Available
					</span>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Start
					</span>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						End
					</span>
				</div>

				{DAY_KEYS.map((day, i) => {
					const slot = value[day];
					return (
						<div
							key={day}
							className={cn(
								'grid grid-cols-[7rem_auto_1fr_1fr] items-center gap-3 px-4 py-3',
								i < DAY_KEYS.length - 1 && 'border-b border-border',
								slot.enabled ? 'bg-white' : 'bg-slate-50/60',
							)}>
							{/* Day label */}
							<span
								className={cn(
									'text-sm font-semibold',
									slot.enabled ? 'text-foreground' : 'text-slate-400',
								)}>
								{DAY_LABELS[day]}
							</span>

							{/* Toggle */}
							<button
								type='button'
								role='switch'
								aria-checked={slot.enabled}
								aria-label={`Toggle ${DAY_LABELS[day]}`}
								onClick={() => setDay(day, { enabled: !slot.enabled })}
								className={cn(
									'relative inline-flex mr-10 h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-care-blue/50 focus-visible:outline-none',
									slot.enabled ? 'bg-care-blue' : 'bg-slate-200',
								)}>
								<span
									className={cn(
										'pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform',
										slot.enabled ? 'translate-x-4' : 'translate-x-0',
									)}
								/>
							</button>

							{/* Start time */}
							<input
								type='time'
								value={slot.start}
								disabled={!slot.enabled}
								onChange={(e) => setDay(day, { start: e.target.value })}
								className={cn(
									'h-9 w-full rounded-lg border border-border px-3 text-sm transition-colors focus:border-care-blue focus:ring-2 focus:ring-care-blue/20 focus:outline-none',
									slot.enabled
										? 'bg-white text-foreground'
										: 'cursor-not-allowed bg-slate-100 text-slate-400',
								)}
								aria-label={`${DAY_LABELS[day]} start time`}
							/>

							{/* End time */}
							<input
								type='time'
								value={slot.end}
								disabled={!slot.enabled}
								onChange={(e) => setDay(day, { end: e.target.value })}
								className={cn(
									'h-9 w-full rounded-lg border border-border px-3 text-sm transition-colors focus:border-care-blue focus:ring-2 focus:ring-care-blue/20 focus:outline-none',
									slot.enabled
										? 'bg-white text-foreground'
										: 'cursor-not-allowed bg-slate-100 text-slate-400',
								)}
								aria-label={`${DAY_LABELS[day]} end time`}
							/>
						</div>
					);
				})}
			</div>

			{/* Summary chips */}
			{enabledDays.length > 0 ? (
				<div className='flex flex-wrap gap-2'>
					{enabledDays.map((day) => (
						<span
							key={day}
							className='inline-flex items-center gap-1.5 rounded-full border border-care-blue/20 bg-care-blue-light px-3 py-1 text-xs font-semibold text-care-blue'>
							{DAY_SHORT[day]}{' '}
							<span className='font-normal text-care-blue/70'>
								{value[day].start}–{value[day].end}
							</span>
						</span>
					))}
				</div>
			) : (
				<p className='text-xs text-slate-400 italic'>
					No availability set — toggle days above to add shifts.
				</p>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  UploadModal                                                        */
/* ------------------------------------------------------------------ */

interface UploadModalState {
	qual: Qualification;
	file: File | null;
	expiryDate: string;
	dragOver: boolean;
}

function UploadModal({
	state,
	onConfirm,
	onClose,
}: {
	state: UploadModalState;
	onConfirm: (qualId: string, file: File, expiryDate: string) => void;
	onClose: () => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(state.file);
	const [expiryDate, setExpiryDate] = useState(state.expiryDate);
	const [dragOver, setDragOver] = useState(false);

	const canConfirm =
		file !== null && (!state.qual.expires || expiryDate !== '');

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		setDragOver(false);
		const dropped = e.dataTransfer.files[0];
		if (dropped) setFile(dropped);
	}

	function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		const picked = e.target.files?.[0];
		if (picked) setFile(picked);
	}

	return (
		/* Backdrop */
		<div
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'
			role='dialog'
			aria-modal='true'
			aria-labelledby='upload-modal-title'
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}>
			{/* Panel */}
			<div className='w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-2xl'>
				{/* Header */}
				<div className='flex items-start justify-between border-b border-border px-6 py-5'>
					<div>
						<p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
							Upload Document
						</p>
						<h3
							id='upload-modal-title'
							className='mt-0.5 font-heading text-base font-bold text-foreground'>
							{state.qual.name}
						</h3>
					</div>
					<button
						type='button'
						onClick={onClose}
						className='flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:ring-2 focus-visible:ring-care-blue/50 focus-visible:outline-none'
						aria-label='Close modal'>
						<X className='size-4' />
					</button>
				</div>

				{/* Body */}
				<div className='flex flex-col gap-5 px-6 py-5'>
					{/* Drop zone */}
					<div
						role='button'
						tabIndex={0}
						aria-label='Upload file — click or drag and drop'
						onClick={() => inputRef.current?.click()}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								inputRef.current?.click();
							}
						}}
						onDragOver={(e) => {
							e.preventDefault();
							setDragOver(true);
						}}
						onDragLeave={() => setDragOver(false)}
						onDrop={handleDrop}
						className={cn(
							'flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
							'focus-visible:border-care-blue focus-visible:ring-3 focus-visible:ring-care-blue/30 focus-visible:outline-none',
							dragOver
								? 'border-care-blue bg-care-blue-light'
								: file
									? 'border-success/50 bg-success/5'
									: 'border-slate-200 bg-slate-50 hover:border-care-blue hover:bg-care-blue-light/50',
						)}>
						{file ? (
							<>
								<div className='flex size-11 items-center justify-center rounded-full bg-success/10'>
									<FileText
										className='size-5 text-success'
										aria-hidden='true'
									/>
								</div>
								<div>
									<p className='text-sm font-semibold text-foreground'>
										{file.name}
									</p>
									<p className='mt-0.5 text-xs text-slate-500'>
										{(file.size / 1024 / 1024).toFixed(2)} MB —{' '}
										<span className='font-semibold text-care-blue'>
											click to replace
										</span>
									</p>
								</div>
							</>
						) : (
							<>
								<div className='flex size-11 items-center justify-center rounded-full bg-care-blue-light'>
									<Upload
										className='size-5 text-care-blue'
										aria-hidden='true'
									/>
								</div>
								<div>
									<p className='text-sm font-semibold text-foreground'>
										Click to upload{' '}
										<span className='font-normal text-slate-500'>
											or drag and drop
										</span>
									</p>
									<p className='mt-0.5 text-xs text-slate-400'>
										PDF, JPG or PNG — max 10 MB
									</p>
								</div>
							</>
						)}
						<input
							ref={inputRef}
							type='file'
							accept='.pdf,.jpg,.jpeg,.png'
							className='sr-only'
							aria-hidden='true'
							tabIndex={-1}
							onChange={handleFile}
						/>
					</div>

					{/* Expiry date — only shown when this qual type expires */}
					{state.qual.expires && (
						<div className='flex flex-col gap-2'>
							<Label htmlFor='modal-expiry-date'>
								Expiry Date{' '}
								<span className='text-error' aria-hidden='true'>
									*
								</span>
							</Label>
							<Input
								id='modal-expiry-date'
								type='date'
								value={expiryDate}
								onChange={(e) => setExpiryDate(e.target.value)}
								className='h-10'
								aria-describedby='modal-expiry-hint'
							/>
							<p id='modal-expiry-hint' className='text-xs text-slate-500'>
								The date this certificate or qualification expires and will
								require renewal.
							</p>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className='flex gap-3 border-t border-border px-6 py-4'>
					<button
						type='button'
						onClick={onClose}
						className='inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border bg-background text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'>
						Cancel
					</button>
					<Button
						type='button'
						disabled={!canConfirm}
						onClick={() => {
							if (file) onConfirm(state.qual.id, file, expiryDate);
						}}
						className={cn(
							'h-10 flex-1 gap-2 text-sm font-semibold shadow-md',
							canConfirm
								? 'bg-care-blue hover:bg-care-blue-hover'
								: 'cursor-not-allowed bg-care-blue/40',
						)}>
						<Upload className='size-4' aria-hidden='true' />
						Upload Document
					</Button>
				</div>
			</div>
		</div>
	);
}

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

function CarerStatusBadge({ status }: { status: CarerStatus }) {
	const styles: Record<CarerStatus, string> = {
		ACTIVE: 'bg-success/10 text-success border border-success/20',
		ON_LEAVE: 'bg-care-blue-light text-care-blue border border-care-blue/20',
		SUSPENDED: 'bg-warning/10 text-warning border border-warning/20',
		TERMINATED: 'bg-error/10 text-error border border-error/20',
	};
	const labels: Record<CarerStatus, string> = {
		ACTIVE: 'Active',
		ON_LEAVE: 'On Leave',
		SUSPENDED: 'Suspended',
		TERMINATED: 'Terminated',
	};
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
				styles[status],
			)}>
			{labels[status]}
		</span>
	);
}

function QualStatusBadge({ status }: { status: QualStatus }) {
	const styles: Record<QualStatus, string> = {
		VERIFIED: 'bg-success/10 text-success border border-success/20',
		PENDING: 'bg-warning/10 text-warning border border-warning/20',
		REJECTED: 'bg-error/10 text-error border border-error/20',
		EXPIRED: 'bg-slate-100 text-slate-500 border border-slate-200',
	};
	const icons: Record<QualStatus, React.ReactNode> = {
		VERIFIED: <ShieldCheck className='size-3' aria-hidden='true' />,
		PENDING: <Clock className='size-3' aria-hidden='true' />,
		REJECTED: <ShieldX className='size-3' aria-hidden='true' />,
		EXPIRED: <X className='size-3' aria-hidden='true' />,
	};
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
				styles[status],
			)}>
			{icons[status]}
			{status.charAt(0) + status.slice(1).toLowerCase()}
		</span>
	);
}

/* ------------------------------------------------------------------ */
/*  QualificationCard                                                  */
/* ------------------------------------------------------------------ */

function QualificationCard({
	qual,
	onOpenUpload,
}: {
	qual: Qualification;
	onOpenUpload: (qual: Qualification) => void;
}) {
	const expiryDays = qual.expiresAt ? daysUntil(qual.expiresAt) : null;
	const expiringSoon =
		expiryDays !== null && expiryDays > 0 && expiryDays <= 60;
	const expired = expiryDays !== null && expiryDays <= 0;

	const borderColor =
		expired || qual.status === 'EXPIRED'
			? 'border-slate-200 bg-slate-50/50'
			: qual.status === 'REJECTED'
				? 'border-error/30 bg-error/5'
				: expiringSoon
					? 'border-warning/30 bg-warning/5'
					: 'border-border';

	return (
		<div
			className={cn('rounded-lg border p-4 transition-colors', borderColor)}
			role='group'
			aria-label={qual.name}>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
				{/* Icon + info */}
				<div className='flex min-w-0 items-start gap-3'>
					<div
						className={cn(
							'flex size-9 shrink-0 items-center justify-center rounded-lg',
							qual.status === 'VERIFIED'
								? 'bg-success/10'
								: qual.status === 'EXPIRED'
									? 'bg-slate-100'
									: qual.status === 'REJECTED'
										? 'bg-error/10'
										: 'bg-warning/10',
						)}>
						<FileText
							className={cn(
								'size-4',
								qual.status === 'VERIFIED'
									? 'text-success'
									: qual.status === 'EXPIRED'
										? 'text-slate-400'
										: qual.status === 'REJECTED'
											? 'text-error'
											: 'text-warning',
							)}
							aria-hidden='true'
						/>
					</div>
					<div className='min-w-0'>
						<div className='flex flex-wrap items-center gap-2'>
							<p className='text-sm font-semibold text-foreground'>
								{qual.name}
							</p>
							<QualStatusBadge status={qual.status} />
						</div>

						{qual.fileUrl && (
							<p className='mt-0.5 truncate text-xs text-slate-500'>
								{qual.fileUrl}
							</p>
						)}

						<div className='mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500'>
							{qual.issuedAt && (
								<span>
									Issued:{' '}
									<span className='font-medium text-foreground'>
										{new Date(qual.issuedAt).toLocaleDateString('en-GB', {
											day: 'numeric',
											month: 'short',
											year: 'numeric',
										})}
									</span>
								</span>
							)}
							{qual.expires && qual.expiresAt && (
								<span>
									Expires:{' '}
									<span
										className={cn(
											'font-medium',
											expired
												? 'text-error'
												: expiringSoon
													? 'text-warning'
													: 'text-foreground',
										)}>
										{new Date(qual.expiresAt).toLocaleDateString('en-GB', {
											day: 'numeric',
											month: 'short',
											year: 'numeric',
										})}
									</span>
								</span>
							)}
							{qual.expires &&
								!qual.expiresAt &&
								qual.status !== 'VERIFIED' && (
									<span className='italic text-slate-400'>
										No expiry date set
									</span>
								)}
							{!qual.expires && (
								<span className='italic text-slate-400'>Does not expire</span>
							)}
						</div>

						{expiringSoon && !expired && (
							<div className='mt-2 flex items-center gap-1.5'>
								<AlertTriangle
									className='size-3.5 text-warning'
									aria-hidden='true'
								/>
								<span className='text-xs font-semibold text-warning'>
									Expires in {expiryDays} day{expiryDays !== 1 ? 's' : ''}
								</span>
							</div>
						)}
						{expired && (
							<div className='mt-2 flex items-center gap-1.5'>
								<AlertTriangle
									className='size-3.5 text-error'
									aria-hidden='true'
								/>
								<span className='text-xs font-semibold text-error'>
									Expired {Math.abs(expiryDays!)} day
									{Math.abs(expiryDays!) !== 1 ? 's' : ''} ago
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Upload button */}
				<button
					type='button'
					onClick={() => onOpenUpload(qual)}
					className='flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-care-blue focus-visible:ring-2 focus-visible:ring-care-blue/50 focus-visible:outline-none'
					aria-label={`Upload document for ${qual.name}`}>
					<Upload className='size-3.5' aria-hidden='true' />
					{qual.fileUrl ? 'Replace' : 'Upload'}
				</button>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  ComplianceOverview                                                 */
/* ------------------------------------------------------------------ */

function ComplianceOverview({
	qualifications,
	activeFilter,
	onFilterChange,
}: {
	qualifications: Qualification[];
	activeFilter: QualFilter | null;
	onFilterChange: (f: QualFilter | null) => void;
}) {
	const score = complianceScore(qualifications);
	const verified = qualifications.filter((q) => q.status === 'VERIFIED').length;
	const pending = qualifications.filter((q) => q.status === 'PENDING').length;
	const issues = qualifications.filter(
		(q) => q.status === 'EXPIRED' || q.status === 'REJECTED',
	).length;
	const expiringSoon = qualifications.filter((q) => {
		if (!q.expiresAt) return false;
		const days = daysUntil(q.expiresAt);
		return days > 0 && days <= 60;
	}).length;

	const ringColor =
		score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
	const ringBg = score >= 80 ? '#dcfce7' : score >= 50 ? '#fef9c3' : '#fee2e2';
	const circumference = 2 * Math.PI * 36;
	const offset = circumference - (score / 100) * circumference;

	function toggle(f: QualFilter) {
		onFilterChange(activeFilter === f ? null : f);
	}

	const cardBase =
		'group relative flex w-full flex-col rounded-lg border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue/50';

	return (
		<div className='flex flex-col gap-6 sm:flex-row sm:items-center'>
			{/* Score ring — clicking it clears the filter */}
			<button
				type='button'
				onClick={() => onFilterChange(null)}
				className='flex shrink-0 flex-col items-center gap-2 rounded-xl p-1 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue/50'
				aria-label='Show all qualifications'
				aria-pressed={activeFilter === null}>
				<div className='relative flex items-center justify-center'>
					<svg width='96' height='96' aria-hidden='true'>
						<circle cx='48' cy='48' r='36' fill={ringBg} stroke='#e2e8f0' strokeWidth='8' />
						<circle cx='48' cy='48' r='36' fill='none' stroke={ringColor} strokeWidth='8' strokeLinecap='round' strokeDasharray={circumference} strokeDashoffset={offset} transform='rotate(-90 48 48)' />
					</svg>
					<span className='absolute text-xl font-bold tabular-nums' style={{ color: ringColor }}>
						{score}%
					</span>
				</div>
				<p className={cn(
					'text-xs font-semibold transition-colors',
					activeFilter === null ? 'text-care-blue' : 'text-slate-500',
				)}>
					{activeFilter === null ? 'All docs' : 'Compliance'}
				</p>
			</button>

			<div className='grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4'>
				{/* Verified */}
				<button
					type='button'
					onClick={() => toggle('VERIFIED')}
					aria-pressed={activeFilter === 'VERIFIED'}
					className={cn(
						cardBase,
						activeFilter === 'VERIFIED'
							? 'border-success bg-success/5 ring-2 ring-success/30'
							: 'border-border bg-slate-50 hover:border-success/40 hover:bg-success/5',
					)}>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Verified
					</p>
					<p className='mt-1 text-xl font-bold text-success'>{verified}</p>
					{activeFilter === 'VERIFIED' && (
						<span className='absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-success text-white'>
							<Check className='size-2.5' strokeWidth={3} />
						</span>
					)}
				</button>

				{/* Pending */}
				<button
					type='button'
					onClick={() => toggle('PENDING')}
					aria-pressed={activeFilter === 'PENDING'}
					className={cn(
						cardBase,
						activeFilter === 'PENDING'
							? 'border-warning bg-warning/5 ring-2 ring-warning/30'
							: 'border-border bg-slate-50 hover:border-warning/40 hover:bg-warning/5',
					)}>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Pending
					</p>
					<p className='mt-1 text-xl font-bold text-warning'>{pending}</p>
					{activeFilter === 'PENDING' && (
						<span className='absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-warning text-white'>
							<Check className='size-2.5' strokeWidth={3} />
						</span>
					)}
				</button>

				{/* Issues */}
				<button
					type='button'
					onClick={() => toggle('ISSUES')}
					aria-pressed={activeFilter === 'ISSUES'}
					className={cn(
						cardBase,
						activeFilter === 'ISSUES'
							? 'border-error bg-error/5 ring-2 ring-error/30'
							: 'border-border bg-slate-50 hover:border-error/40 hover:bg-error/5',
					)}>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Issues
					</p>
					<p className={cn('mt-1 text-xl font-bold', issues > 0 ? 'text-error' : 'text-slate-400')}>
						{issues}
					</p>
					{activeFilter === 'ISSUES' && (
						<span className='absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-error text-white'>
							<Check className='size-2.5' strokeWidth={3} />
						</span>
					)}
				</button>

				{/* Expiring Soon */}
				<button
					type='button'
					onClick={() => toggle('EXPIRING_SOON')}
					aria-pressed={activeFilter === 'EXPIRING_SOON'}
					className={cn(
						cardBase,
						activeFilter === 'EXPIRING_SOON'
							? 'border-warning bg-warning/5 ring-2 ring-warning/30'
							: 'border-border bg-slate-50 hover:border-warning/40 hover:bg-warning/5',
					)}>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Expiring Soon
					</p>
					<p className={cn('mt-1 text-xl font-bold', expiringSoon > 0 ? 'text-warning' : 'text-slate-400')}>
						{expiringSoon}
					</p>
					{activeFilter === 'EXPIRING_SOON' && (
						<span className='absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-warning text-white'>
							<Check className='size-2.5' strokeWidth={3} />
						</span>
					)}
				</button>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CarerProfilePage({
	params,
}: {
	params: Promise<{ carerId: string }>;
}) {
	const { carerId } = use(params);
	const profile = MOCK_PROFILES[carerId];

	const [carerStatus, setCarerStatus] = useState<CarerStatus>(
		profile?.status ?? 'ACTIVE',
	);
	const [qualifications, setQualifications] = useState<Qualification[]>(
		profile?.qualifications ?? [],
	);
	const [availability, setAvailability] = useState<WeeklyAvailability>(
		profile?.availability ?? makeWeek({}),
	);
	const [employmentType, setEmploymentType] = useState(
		profile?.employmentType ?? '',
	);
	const [experienceYears, setExperienceYears] = useState(
		String(profile?.experienceYears ?? ''),
	);
	const [qualFilter, setQualFilter] = useState<QualFilter | null>(null);
	const [saved, setSaved] = useState(false);
	const [confirmTerminate, setConfirmTerminate] = useState(false);

	// Upload modal state
	const [uploadModal, setUploadModal] = useState<{
		qual: Qualification;
		file: File | null;
		expiryDate: string;
		dragOver: boolean;
	} | null>(null);

	const hasChanges =
		employmentType !== profile?.employmentType ||
		experienceYears !== String(profile?.experienceYears) ||
		carerStatus !== profile?.status ||
		JSON.stringify(availability) !== JSON.stringify(profile?.availability);

	const visibleQualifications = qualifications.filter((q) => {
		if (!qualFilter) return true;
		if (qualFilter === 'VERIFIED') return q.status === 'VERIFIED';
		if (qualFilter === 'PENDING') return q.status === 'PENDING';
		if (qualFilter === 'ISSUES')
			return q.status === 'EXPIRED' || q.status === 'REJECTED';
		if (qualFilter === 'EXPIRING_SOON') {
			if (!q.expiresAt) return false;
			const d = daysUntil(q.expiresAt);
			return d > 0 && d <= 60;
		}
		return true;
	});

	function handleSave() {
		setSaved(true);
		setTimeout(() => setSaved(false), 3000);
	}

	function handleOpenUpload(qual: Qualification) {
		setUploadModal({
			qual,
			file: null,
			expiryDate: qual.expiresAt ?? '',
			dragOver: false,
		});
	}

	function handleConfirmUpload(
		qualId: string,
		_file: File,
		expiryDate: string,
	) {
		setQualifications((prev) =>
			prev.map((q) =>
				q.id === qualId
					? {
							...q,
							status: 'PENDING' as QualStatus,
							fileUrl: _file.name,
							expiresAt: expiryDate || q.expiresAt,
						}
					: q,
			),
		);
		setUploadModal(null);
	}

	if (!profile) {
		return (
			<div className='mx-auto max-w-6/12 p-4 lg:p-8'>
				<div className='flex flex-col items-center gap-3 py-20 text-center'>
					<p className='text-sm font-semibold text-foreground'>
						Carer not found
					</p>
					<Link
						href='/dashboard/staff'
						className='text-sm font-semibold text-care-blue hover:underline'>
						Back to Staff
					</Link>
				</div>
			</div>
		);
	}

	const initials =
		`${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

	return (
		<>
			{/* Upload modal */}
			{uploadModal && (
				<UploadModal
					state={uploadModal}
					onConfirm={handleConfirmUpload}
					onClose={() => setUploadModal(null)}
				/>
			)}

			<div className='mx-auto max-w-10/12 p-4 lg:p-8'>
				{/* Breadcrumb */}
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
							<span
								className='font-semibold text-foreground'
								aria-current='page'>
								{profile.firstName} {profile.lastName}
							</span>
						</li>
					</ol>
				</nav>

				{/* Page header */}
				<div className='mb-8'>
					<div className='flex items-center gap-3'>
						<Link
							href='/dashboard/staff'
							className='flex size-9 items-center justify-center rounded-lg border border-border text-slate-500 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-care-blue/50 focus-visible:outline-none'
							aria-label='Back to Staff Management'>
							<ArrowLeft className='size-4' />
						</Link>
						<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
							{profile.firstName} {profile.lastName}
						</h1>
						<CarerStatusBadge status={carerStatus} />
					</div>
				</div>

				<div className='flex flex-col gap-6'>
					{/* Profile card */}
					<div className='flex items-center gap-5 rounded-xl border border-border bg-white p-6 shadow-sm'>
						<span
							className='inline-flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white'
							style={{ backgroundColor: profile.avatarColor }}
							aria-hidden='true'>
							{initials}
						</span>
						<div className='min-w-0 flex-1'>
							<p className='text-lg font-bold text-foreground'>
								{profile.firstName} {profile.lastName}
							</p>
							<div className='mt-1 flex flex-wrap gap-x-4 gap-y-1'>
								<span className='flex items-center gap-1.5 text-sm text-slate-500'>
									<Mail className='size-4 shrink-0' aria-hidden='true' />
									{profile.email}
								</span>
								<span className='flex items-center gap-1.5 text-sm text-slate-500'>
									<Phone className='size-4 shrink-0' aria-hidden='true' />
									{profile.phone}
								</span>
							</div>
						</div>
						<dl className='hidden gap-6 text-right sm:flex'>
							<div>
								<dt className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
									Hired
								</dt>
								<dd className='mt-1 text-sm font-semibold text-foreground'>
									{new Date(profile.hireDate).toLocaleDateString('en-GB', {
										day: 'numeric',
										month: 'short',
										year: 'numeric',
									})}
								</dd>
							</div>
							<div>
								<dt className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
									Experience
								</dt>
								<dd className='mt-1 text-sm font-semibold text-foreground'>
									{profile.experienceYears} yr
									{profile.experienceYears !== 1 ? 's' : ''}
								</dd>
							</div>
						</dl>
					</div>

					{/* Employment Details */}
					<FormSection
						id='employment'
						title='Employment Details'
						description='Update employment type, experience, and weekly availability.'>
						<div className='flex flex-col gap-6'>
							<div className='grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2'>
								<div className='flex flex-col gap-2'>
									<Label htmlFor='employment-type'>Employment Type</Label>
									<select
										id='employment-type'
										value={employmentType}
										onChange={(e) => setEmploymentType(e.target.value)}
										className='h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-care-blue focus:ring-2 focus:ring-care-blue/20 focus:outline-none'>
										<option value='Full-Time'>Full-Time</option>
										<option value='Part-Time'>Part-Time</option>
										<option value='Bank'>Bank</option>
										<option value='Agency'>Agency</option>
									</select>
								</div>
								<div className='flex flex-col gap-2'>
									<Label htmlFor='experience-years'>Years of Experience</Label>
									<Input
										id='experience-years'
										type='number'
										min={0}
										max={50}
										value={experienceYears}
										onChange={(e) => setExperienceYears(e.target.value)}
										className='h-10'
									/>
								</div>
							</div>

							{/* Weekly availability */}
							<div className='flex flex-col gap-2'>
								<div>
									<p className='text-sm font-semibold text-foreground'>
										Weekly Availability
									</p>
									<p className='mt-0.5 text-xs text-slate-500'>
										Toggle each day and set the hours this carer is available.
										Hours can vary per day.
									</p>
								</div>
								<WeeklyScheduleEditor
									value={availability}
									onChange={setAvailability}
								/>
							</div>
						</div>
					</FormSection>

					{/* Compliance & Qualifications */}
					<section
						aria-labelledby='compliance-heading'
						className='rounded-xl border border-border bg-white shadow-sm'>
						<div className='border-b border-border px-6 py-5'>
							<h2
								id='compliance-heading'
								className='font-heading text-base font-bold text-foreground'>
								Compliance &amp; Qualifications
							</h2>
							<p className='mt-1 text-sm text-slate-600'>
								Required certificates and training records. Click{' '}
								<span className='font-semibold'>Upload</span> or{' '}
								<span className='font-semibold'>Replace</span> on any row to
								submit a new document for verification.
							</p>
						</div>

						{/* Overview */}
						<div className='border-b border-border px-6 py-5'>
							<ComplianceOverview
								qualifications={qualifications}
								activeFilter={qualFilter}
								onFilterChange={setQualFilter}
							/>
						</div>

						{/* Qualification cards */}
						<div className='flex flex-col gap-3 px-6 py-6'>
							{visibleQualifications.length > 0 ? (
								visibleQualifications.map((qual) => (
									<QualificationCard
										key={qual.id}
										qual={qual}
										onOpenUpload={handleOpenUpload}
									/>
								))
							) : (
								<p className='py-6 text-center text-sm text-slate-400'>
									No qualifications match this filter.
								</p>
							)}
						</div>
					</section>

					{/* Employment Status */}
					<FormSection
						id='status'
						title='Employment Status'
						description='Changing status affects whether this carer can be assigned to visits.'>
						<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
							<div>
								<p className='text-sm font-semibold text-foreground'>
									Current status:{' '}
									<span
										className={cn(
											carerStatus === 'ACTIVE'
												? 'text-success'
												: carerStatus === 'ON_LEAVE'
													? 'text-care-blue'
													: 'text-warning',
										)}>
										{carerStatus === 'ACTIVE'
											? 'Active'
											: carerStatus === 'ON_LEAVE'
												? 'On Leave'
												: 'Suspended'}
									</span>
								</p>
								<p className='mt-1 text-sm text-slate-500'>
									{carerStatus === 'ACTIVE'
										? 'This carer is active and can be assigned to visits.'
										: carerStatus === 'ON_LEAVE'
											? 'This carer is on leave and temporarily unavailable.'
											: 'This carer is suspended and cannot be assigned to visits.'}
								</p>
							</div>
							<div className='flex flex-wrap gap-2'>
								{carerStatus !== 'ACTIVE' && (
									<button
										type='button'
										onClick={() => setCarerStatus('ACTIVE')}
										className='flex items-center gap-2 rounded-lg border border-success/40 bg-success/5 px-4 py-2.5 text-sm font-semibold text-success transition-colors hover:bg-success/10 focus-visible:ring-2 focus-visible:ring-success/50 focus-visible:outline-none'>
										<Check className='size-4' aria-hidden='true' />
										Set Active
									</button>
								)}
								{carerStatus !== 'ON_LEAVE' && (
									<button
										type='button'
										onClick={() => setCarerStatus('ON_LEAVE')}
										className='flex items-center gap-2 rounded-lg border border-care-blue/30 bg-care-blue-light px-4 py-2.5 text-sm font-semibold text-care-blue transition-colors hover:bg-care-blue/10 focus-visible:ring-2 focus-visible:ring-care-blue/50 focus-visible:outline-none'>
										<Briefcase className='size-4' aria-hidden='true' />
										Mark On Leave
									</button>
								)}
								{carerStatus !== 'SUSPENDED' && (
									<button
										type='button'
										onClick={() => setCarerStatus('SUSPENDED')}
										className='flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 px-4 py-2.5 text-sm font-semibold text-warning transition-colors hover:bg-warning/10 focus-visible:ring-2 focus-visible:ring-warning/50 focus-visible:outline-none'>
										<UserX className='size-4' aria-hidden='true' />
										Suspend
									</button>
								)}
							</div>
						</div>
					</FormSection>

					{/* Save actions */}
					<div className='flex flex-col-reverse gap-3 border-t border-border pt-2 sm:flex-row sm:items-center sm:justify-between'>
						<Link
							href='/dashboard/staff'
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

					{/* Danger zone */}
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
								Terminating employment is irreversible. The carer will be
								removed from all future visit assignments.
							</p>
						</div>
						<div className='px-6 py-6'>
							{!confirmTerminate ? (
								<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
									<div>
										<p className='text-sm font-semibold text-foreground'>
											Terminate employment
										</p>
										<p className='mt-0.5 text-sm text-slate-500'>
											{profile.firstName}&apos;s record will be retained for
											compliance purposes but they will no longer be assignable.
										</p>
									</div>
									<button
										type='button'
										onClick={() => setConfirmTerminate(true)}
										className='flex shrink-0 items-center gap-2 rounded-lg border border-error/40 bg-error/5 px-4 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/10 focus-visible:ring-2 focus-visible:ring-error/50 focus-visible:outline-none'>
										<Trash2 className='size-4' aria-hidden='true' />
										Terminate Employment
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
												Confirm termination for {profile.firstName}{' '}
												{profile.lastName}?
											</p>
											<p className='mt-1 text-sm text-slate-600'>
												They will be unassigned from all scheduled visits and
												their status set to <strong>Terminated</strong>. Records
												are retained for audit purposes.
											</p>
										</div>
									</div>
									<div className='flex gap-3'>
										<button
											type='button'
											onClick={() => setConfirmTerminate(false)}
											className='inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'>
											Cancel
										</button>
										<Link
											href='/dashboard/staff'
											className='inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-error px-5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-error/90 focus-visible:ring-2 focus-visible:ring-error/50 focus-visible:outline-none'>
											<Trash2 className='size-4' aria-hidden='true' />
											Yes, Terminate
										</Link>
									</div>
								</div>
							)}
						</div>
					</section>
				</div>
			</div>
		</>
	);
}
