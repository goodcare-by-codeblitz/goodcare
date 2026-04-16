'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
	AlertTriangle,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	MapPin,
	Pencil,
	Plus,
	Search,
	X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════════════════ */

type VisitStatus =
	| 'SCHEDULED'
	| 'IN_PROGRESS'
	| 'COMPLETED'
	| 'CANCELLED'
	| 'NO_SHOW';

interface VisitTask {
	id: string;
	label: string;
	completed: boolean;
	required: boolean;
}

interface Visit {
	id: string;
	patientName: string;
	patientAddress: string;
	carerId: string | null;
	carerName: string | null;
	carerInitials: string | null;
	carerColor: string | null;
	scheduledStart: string;
	scheduledEnd: string;
	status: VisitStatus;
	category: string;
	tasks: VisitTask[];
	notes?: string;
}

interface Carer {
	id: string;
	name: string;
	initials: string;
	color: string;
	area: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
═══════════════════════════════════════════════════════════════════════════ */

const HOUR_WIDTH = 300;
const DAY_START = 7;
const DAY_END = 21;
const TOTAL_HOURS = DAY_END - DAY_START;
const TOTAL_WIDTH = TOTAL_HOURS * HOUR_WIDTH;
const ROW_H = 80;
const CARER_COL = 256;
const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => i + DAY_START);

/* ═══════════════════════════════════════════════════════════════════════════
   Mock data — 40 carers, generated visits across the week
═══════════════════════════════════════════════════════════════════════════ */

const AREAS = ['North', 'South', 'East', 'West', 'Central'];
const COLORS = [
	'#6366f1',
	'#0ea5e9',
	'#10b981',
	'#f59e0b',
	'#ec4899',
	'#8b5cf6',
	'#ef4444',
	'#14b8a6',
];

const CARER_NAMES: [string, string][] = [
	['Simbarashe Mapisa', 'SM'],
	['David Chen', 'DC'],
	['Elena Rodriguez', 'ER'],
	['Thomas Wade', 'TW'],
	['Amara Osei', 'AO'],
	['Priya Sharma', 'PS'],
	['Marcus Brown', 'MB'],
	['Fatima Ali', 'FA'],
	['Luke Harrison', 'LH'],
	['Grace Kim', 'GK'],
	['Ravi Patel', 'RP'],
	['Hannah Clarke', 'HC'],
	['Omar Diallo', 'OD'],
	['Sophie Turner', 'ST'],
	['Jack Murray', 'JM'],
	['Aisha Bello', 'AB'],
	["Liam O'Brien", 'LO'],
	['Mei Tanaka', 'MT'],
	['Carlos Reyes', 'CR'],
	['Nadia Novak', 'NN'],
	['Ben Adeyemi', 'BA'],
	['Chloe Martin', 'CM'],
	['Yusuf Hassan', 'YH'],
	['Ingrid Berg', 'IB'],
	['Daniel Park', 'DP'],
	['Tanya Ivanova', 'TI'],
	['Aaron Mensah', 'AM'],
	['Fiona Walsh', 'FW'],
	['Kwame Asante', 'KA'],
	['Rebecca Stone', 'RS'],
	['Nico Ferrari', 'NF'],
	['Yasmin Shah', 'YS'],
	['Patrick Doyle', 'PD'],
	['Leila Haddad', 'LH'],
	['George Mitchell', 'GM'],
	['Adaeze Nwosu', 'AN'],
	['Connor Reid', 'CRe'],
	['Simone Laurent', 'SL'],
	['Tariq Hussain', 'TH'],
	['Victoria Hughes', 'VH'],
];

const MOCK_CARERS: Carer[] = CARER_NAMES.map(([name, initials], i) => ({
	id: `c${i + 1}`,
	name,
	initials,
	color: COLORS[i % COLORS.length],
	area: AREAS[i % AREAS.length],
}));

const PATIENTS = [
	{ name: 'Robert Miller', address: '14 Elm St' },
	{ name: 'Mary Higgins', address: '22 Oak Ave' },
	{ name: 'John Dow', address: '5 Pine Rd' },
	{ name: 'Mrs. Kemp', address: '3 Birch Ln' },
	{ name: 'James Porter', address: '17 Maple Dr' },
	{ name: 'Edith Clarke', address: '8 Cedar Ct' },
	{ name: 'William Barnes', address: '31 Ash St' },
	{ name: 'Dorothy Evans', address: '12 Walnut Rd' },
];

const CATEGORIES = [
	'Morning Routine',
	'Evening Routine',
	'Medication',
	'Personal Care',
	'Lunch Support',
	'Social Support',
	'Night Care',
	'Afternoon Care',
];

const BASE_TASKS: VisitTask[][] = [
	[
		{
			id: 't1',
			label: 'Personal hygiene & dressing',
			completed: false,
			required: true,
		},
		{
			id: 't2',
			label: 'Prepare and serve breakfast',
			completed: false,
			required: true,
		},
		{
			id: 't3',
			label: 'Administer morning medication',
			completed: false,
			required: true,
		},
		{
			id: 't4',
			label: 'Blood pressure check',
			completed: false,
			required: false,
		},
		{
			id: 't5',
			label: 'Document in care notes',
			completed: false,
			required: true,
		},
	],
	[
		{
			id: 't1',
			label: 'Administer medication',
			completed: false,
			required: true,
		},
		{
			id: 't2',
			label: 'Confirm medication taken',
			completed: false,
			required: true,
		},
	],
	[
		{
			id: 't1',
			label: 'Personal care support',
			completed: false,
			required: true,
		},
		{
			id: 't2',
			label: 'Mobility assistance',
			completed: false,
			required: true,
		},
		{
			id: 't3',
			label: 'Fluid intake monitoring',
			completed: false,
			required: false,
		},
	],
];

const SLOTS: [number, number][] = [
	[7.5, 1.5],
	[8, 1],
	[8.5, 1],
	[9, 1],
	[10, 0.75],
	[11, 1],
	[12, 0.75],
	[13, 1],
	[14, 0.75],
	[15, 1],
	[16, 1],
	[17, 1.5],
	[18, 1],
	[19, 0.75],
];

function decimalToISO(date: string, h: number): string {
	const hr = String(Math.floor(h)).padStart(2, '0');
	const min = String(Math.round((h % 1) * 60)).padStart(2, '0');
	return `${date}T${hr}:${min}:00`;
}

function generateVisits(): Visit[] {
	const visits: Visit[] = [];
	const dates = [
		'2026-03-09',
		'2026-03-10',
		'2026-03-11',
		'2026-03-12',
		'2026-03-13',
		'2026-03-14',
		'2026-03-15',
	];
	let vid = 1;

	for (const carer of MOCK_CARERS) {
		const carerNum = parseInt(carer.id.slice(1));
		for (const date of dates) {
			const numVisits = 2 + ((carerNum + vid) % 3);
			const used = new Set<number>();
			let count = 0;
			for (let attempt = 0; attempt < 30 && count < numVisits; attempt++) {
				const slotIdx = (vid * 7 + attempt * 3 + carerNum) % SLOTS.length;
				if (used.has(slotIdx)) continue;
				used.add(slotIdx);
				const [startH, durH] = SLOTS[slotIdx];
				const startIso = decimalToISO(date, startH);
				const endIso = decimalToISO(date, startH + durH);
				const patient = PATIENTS[(vid + slotIdx) % PATIENTS.length];
				const taskSet = BASE_TASKS[slotIdx % BASE_TASKS.length].map((t) => ({
					...t,
					id: `${vid}-${t.id}`,
					completed:
						date < '2026-03-12' || (date === '2026-03-12' && startH < 10),
				}));
				let status: VisitStatus = 'SCHEDULED';
				if (date < '2026-03-12') status = 'COMPLETED';
				else if (date === '2026-03-12') {
					if (startH < 10) status = 'COMPLETED';
					else if (startH < 12)
						status = vid % 3 === 0 ? 'IN_PROGRESS' : 'SCHEDULED';
				}
				visits.push({
					id: `v${vid}`,
					patientName: patient.name,
					patientAddress: patient.address,
					carerId: carer.id,
					carerName: carer.name,
					carerInitials: carer.initials,
					carerColor: carer.color,
					scheduledStart: startIso,
					scheduledEnd: endIso,
					status,
					category: CATEGORIES[(vid + slotIdx) % CATEGORIES.length],
					tasks: taskSet,
					notes:
						vid % 7 === 0
							? 'Patient requested earlier visit next week.'
							: undefined,
				});
				vid++;
				count++;
			}
		}
	}

	// Unassigned visits for today
	for (const [start, end] of [
		['09:30', '10:30'],
		['14:00', '15:00'],
		['16:30', '17:30'],
	]) {
		const p = PATIENTS[vid % PATIENTS.length];
		visits.push({
			id: `vu${vid}`,
			patientName: p.name,
			patientAddress: p.address,
			carerId: null,
			carerName: null,
			carerInitials: null,
			carerColor: null,
			scheduledStart: `2026-03-12T${start}:00`,
			scheduledEnd: `2026-03-12T${end}:00`,
			status: 'SCHEDULED',
			category: CATEGORIES[vid % CATEGORIES.length],
			tasks: BASE_TASKS[0].map((t) => ({ ...t, id: `u${vid}-${t.id}` })),
		});
		vid++;
	}

	return visits;
}

const MOCK_VISITS = generateVisits();

/* ═══════════════════════════════════════════════════════════════════════════
   Utilities
═══════════════════════════════════════════════════════════════════════════ */

function timeToX(iso: string): number {
	const d = new Date(iso);
	const mins = d.getHours() * 60 + d.getMinutes() - DAY_START * 60;
	return Math.max(0, (mins / (TOTAL_HOURS * 60)) * TOTAL_WIDTH);
}

function durationToW(start: string, end: string): number {
	const mins = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
	return Math.max(6, (mins / (TOTAL_HOURS * 60)) * TOTAL_WIDTH);
}

function fmt(iso: string): string {
	const d = new Date(iso);
	return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtDur(start: string, end: string): string {
	const mins = Math.round(
		(new Date(end).getTime() - new Date(start).getTime()) / 60000,
	);
	const h = Math.floor(mins / 60),
		m = mins % 60;
	return m ? `${h}h ${m}m` : `${h}h`;
}

function isoDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
	const r = new Date(d);
	r.setDate(r.getDate() + n);
	return r;
}

function overlaps(a: Visit, b: Visit): boolean {
	return (
		new Date(a.scheduledStart) < new Date(b.scheduledEnd) &&
		new Date(b.scheduledStart) < new Date(a.scheduledEnd)
	);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Status config
═══════════════════════════════════════════════════════════════════════════ */

const S_COLOR: Record<VisitStatus, string> = {
	SCHEDULED: '#0ea5e9',
	IN_PROGRESS: '#f59e0b',
	COMPLETED: '#10b981',
	CANCELLED: '#94a3b8',
	NO_SHOW: '#ef4444',
};

const S_LABEL: Record<VisitStatus, string> = {
	SCHEDULED: 'Scheduled',
	IN_PROGRESS: 'In Progress',
	COMPLETED: 'Completed',
	CANCELLED: 'Cancelled',
	NO_SHOW: 'No Show',
};

const S_BADGE: Record<VisitStatus, string> = {
	SCHEDULED: 'bg-sky-50 text-sky-700 border-sky-200',
	IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
	COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
	NO_SHOW: 'bg-red-50 text-red-700 border-red-200',
};

/* ═══════════════════════════════════════════════════════════════════════════
   VisitBar
═══════════════════════════════════════════════════════════════════════════ */

function VisitBar({
	visit,
	isSelected,
	onClick,
	yOffset = 0,
}: {
	visit: Visit;
	isSelected: boolean;
	onClick: () => void;
	yOffset?: number;
}) {
	const left = timeToX(visit.scheduledStart);
	const width = durationToW(visit.scheduledStart, visit.scheduledEnd);
	const color = S_COLOR[visit.status];
	const barH = ROW_H - 10 - yOffset * 18;
	const narrow = width < 36;
	const compact = width < 120; // single-line only
	const full = width >= 160; // two lines with all detail

	return (
		<button
			onClick={onClick}
			title={`${visit.patientName} · ${fmt(visit.scheduledStart)}–${fmt(visit.scheduledEnd)} · ${visit.category}`}
			className={cn(
				'absolute overflow-hidden rounded-md text-left transition-all hover:brightness-95 focus:outline-none',
				full
					? 'flex flex-col justify-between px-2 py-1'
					: 'flex items-center px-1.5',
				isSelected && 'brightness-90',
			)}
			style={{
				left: left + 1,
				width: Math.max(width - 3, 4),
				top: 4 + yOffset * 18,
				height: Math.max(barH, 20),
				backgroundColor: color + '1e',
				borderLeft: `3px solid ${color}`,
				boxShadow: isSelected
					? `0 0 0 2px ${color}, 0 0 0 4px ${color}33`
					: undefined,
			}}>
			{/* Row 1: patient name */}
			{!narrow && (
				<div className='flex min-w-0 items-center gap-1'>
					<span
						className='truncate text-[11px] font-semibold leading-tight'
						style={{ color }}>
						{compact ? visit.patientName.split(' ')[0] : visit.patientName}
					</span>
					{compact && !full && (
						<span className='shrink-0 text-[10px] text-slate-400'>
							{fmt(visit.scheduledStart)}
						</span>
					)}
				</div>
			)}

			{/* Row 2: time range + category + carer dot */}
			{full && (
				<div className='flex min-w-0 items-center gap-1'>
					<span className='shrink-0 text-[10px] tabular-nums text-slate-500'>
						{fmt(visit.scheduledStart)}–{fmt(visit.scheduledEnd)}
					</span>
					<span className='h-1 w-1 shrink-0 rounded-full bg-slate-300' />
					<span className='truncate text-[10px] text-slate-400'>
						{visit.category}
					</span>
					{visit.carerInitials && (
						<div
							className='ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white'
							style={{ backgroundColor: visit.carerColor ?? '#94a3b8' }}>
							{visit.carerInitials.slice(0, 1)}
						</div>
					)}
				</div>
			)}
		</button>
	);
}

/* ═══════════════════════════════════════════════════════════════════════════
   TimeHeader  (sticky top)
═══════════════════════════════════════════════════════════════════════════ */

function TimeHeader({ nowX }: { nowX: number | null }) {
	return (
		<div className='sticky top-0 z-20 flex h-9 border-b-2 border-border bg-white shadow-sm'>
			<div
				className='sticky left-0 z-30 flex shrink-0 items-end border-r border-border bg-white px-3 pb-1.5'
				style={{ width: CARER_COL, minWidth: CARER_COL }}>
				<span className='text-[10px] font-semibold uppercase tracking-wide text-slate-400'>
					Carer
				</span>
			</div>
			<div className='relative' style={{ minWidth: TOTAL_WIDTH }}>
				{HOURS.map((h, i) => (
					<span
						key={h}
						className='absolute bottom-1.5 text-[11px] font-medium text-slate-400'
						style={{ left: i * HOUR_WIDTH + 2 }}>
						{String(h).padStart(2, '0')}:00
					</span>
				))}
				{nowX !== null && (
					<div
						className='absolute top-0 z-10 w-0.5 bg-red-400'
						style={{ left: nowX, height: '100%' }}
					/>
				)}
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════════════════
   GanttRow
═══════════════════════════════════════════════════════════════════════════ */

function GanttRow({
	carer,
	visits,
	selectedId,
	onSelect,
	shade,
	nowX,
}: {
	carer: Carer;
	visits: Visit[];
	selectedId: string | null;
	onSelect: (v: Visit) => void;
	shade: boolean;
	nowX: number | null;
}) {
	const offsets = new Map<string, number>();
	for (let i = 0; i < visits.length; i++) {
		for (let j = i + 1; j < visits.length; j++) {
			if (overlaps(visits[i], visits[j])) {
				offsets.set(visits[j].id, (offsets.get(visits[j].id) ?? 0) + 1);
			}
		}
	}
	const hasConflict = offsets.size > 0;
	const bg = hasConflict ? '#FDE8E8' : shade ? '#f8fafc' : '#FFFFFF';

	return (
		<div
			className='flex border-b border-slate-100'
			style={{ height: ROW_H, backgroundColor: bg }}>
			{/* Sticky carer cell */}
			<div
				className='sticky left-0 z-10 flex shrink-0 items-center gap-2.5 border-r border-slate-100 px-3'
				style={{ width: CARER_COL, minWidth: CARER_COL, backgroundColor: bg }}>
				<div
					className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white'
					style={{ backgroundColor: carer.color }}>
					{carer.initials}
				</div>
				<div className='min-w-0 flex-1'>
					<p className='text-sm font-medium leading-tight text-slate-800'>
						{carer.name}
					</p>
					<p className='mt-0.5 text-[10px] text-slate-400'>
						{carer.area} · {visits.length} visit{visits.length !== 1 ? 's' : ''}
					</p>
				</div>
				{hasConflict && (
					<AlertTriangle className='h-3.5 w-3.5 shrink-0 text-amber-400' />
				)}
			</div>

			{/* Time grid */}
			<div
				className='relative flex-1 overflow-hidden'
				style={{ minWidth: TOTAL_WIDTH }}>
				{HOURS.map((_, i) => (
					<div
						key={i}
						className='absolute top-0 h-full w-px bg-slate-100'
						style={{ left: i * HOUR_WIDTH }}
					/>
				))}
				{nowX !== null && (
					<div
						className='pointer-events-none absolute top-0 z-10 w-0.5 bg-red-400/60'
						style={{ left: nowX, height: '100%' }}
					/>
				)}
				{visits.map((v) => (
					<VisitBar
						key={v.id}
						visit={v}
						isSelected={v.id === selectedId}
						onClick={() => onSelect(v)}
						yOffset={offsets.get(v.id) ?? 0}
					/>
				))}
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════════════════
   UnassignedRow
═══════════════════════════════════════════════════════════════════════════ */

function UnassignedRow({
	visits,
	selectedId,
	onSelect,
	nowX,
}: {
	visits: Visit[];
	selectedId: string | null;
	onSelect: (v: Visit) => void;
	nowX: number | null;
}) {
	if (visits.length === 0) return null;
	return (
		<div
			className='flex border-b-2 border-amber-200'
			style={{ height: ROW_H, backgroundColor: '#fffbeb' }}>
			<div
				className='sticky left-0 z-10 flex shrink-0 items-center gap-2.5 border-r border-amber-200 px-3'
				style={{
					width: CARER_COL,
					minWidth: CARER_COL,
					backgroundColor: '#fffbeb',
				}}>
				<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-700'>
					?
				</div>
				<div>
					<p className='text-sm font-semibold text-amber-700'>Unassigned</p>
					<p className='text-[10px] text-amber-500'>
						{visits.length} visit{visits.length !== 1 ? 's' : ''}
					</p>
				</div>
			</div>
			<div
				className='relative flex-1 overflow-hidden'
				style={{ minWidth: TOTAL_WIDTH }}>
				{HOURS.map((_, i) => (
					<div
						key={i}
						className='absolute top-0 h-full w-px bg-amber-100'
						style={{ left: i * HOUR_WIDTH }}
					/>
				))}
				{nowX !== null && (
					<div
						className='pointer-events-none absolute top-0 z-10 w-0.5 bg-red-400/60'
						style={{ left: nowX, height: '100%' }}
					/>
				)}
				{visits.map((v) => (
					<VisitBar
						key={v.id}
						visit={v}
						isSelected={v.id === selectedId}
						onClick={() => onSelect(v)}
					/>
				))}
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════════════════
   VisitDetailPanel
═══════════════════════════════════════════════════════════════════════════ */

/* ── Carer picker dropdown ───────────────────────────────────────────────── */

function CarerPicker({
	value,
	onChange,
}: {
	value: string | null;
	onChange: (id: string | null) => void;
}) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');
	const selected = MOCK_CARERS.find((c) => c.id === value) ?? null;
	const filtered = search
		? MOCK_CARERS.filter((c) =>
				c.name.toLowerCase().includes(search.toLowerCase()),
			)
		: MOCK_CARERS;

	return (
		<div className='relative'>
			<button
				type='button'
				onClick={() => setOpen((p) => !p)}
				className='flex w-full items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5 text-sm hover:bg-muted'>
				{selected ? (
					<>
						<div
							className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white'
							style={{ backgroundColor: selected.color }}>
							{selected.initials}
						</div>
						<div className='min-w-0 flex-1 text-left'>
							<p className='truncate font-medium text-slate-800'>
								{selected.name}
							</p>
							<p className='text-[10px] text-slate-400'>{selected.area}</p>
						</div>
					</>
				) : (
					<>
						<div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-700'>
							?
						</div>
						<span className='flex-1 text-left text-slate-400'>Unassigned</span>
					</>
				)}
				<ChevronDown
					className={cn(
						'h-4 w-4 shrink-0 text-slate-400 transition-transform',
						open && 'rotate-180',
					)}
				/>
			</button>

			{open && (
				<div className='absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-xl'>
					<div className='p-2 pb-1'>
						<div className='relative'>
							<Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400' />
							<input
								type='text'
								placeholder='Search carer…'
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className='w-full rounded-lg border border-border py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
								autoFocus
							/>
						</div>
					</div>
					<div className='max-h-52 overflow-y-auto pb-1'>
						{/* Unassign option */}
						<button
							type='button'
							onClick={() => {
								onChange(null);
								setOpen(false);
								setSearch('');
							}}
							className={cn(
								'flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted',
								!value && 'bg-sky-50',
							)}>
							<div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[9px] font-bold text-amber-700'>
								?
							</div>
							<span className='text-slate-400'>Unassigned</span>
							{!value && <Check className='ml-auto h-3.5 w-3.5 text-sky-500' />}
						</button>
						{filtered.map((c) => (
							<button
								key={c.id}
								type='button'
								onClick={() => {
									onChange(c.id);
									setOpen(false);
									setSearch('');
								}}
								className={cn(
									'flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted',
									c.id === value && 'bg-sky-50',
								)}>
								<div
									className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white'
									style={{ backgroundColor: c.color }}>
									{c.initials}
								</div>
								<span className='flex-1 truncate text-left text-slate-700'>
									{c.name}
								</span>
								<span className='text-[10px] text-slate-400'>{c.area}</span>
								{c.id === value && (
									<Check className='ml-1 h-3.5 w-3.5 text-sky-500' />
								)}
							</button>
						))}
						{filtered.length === 0 && (
							<p className='px-3 py-3 text-center text-xs text-slate-400'>
								No carers found
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

/* ── EditVisitForm ───────────────────────────────────────────────────────── */

function EditVisitForm({
	visit,
	onSave,
	onCancel,
}: {
	visit: Visit;
	onSave: (patch: Partial<Visit>) => void;
	onCancel: () => void;
}) {
	const dateStr = visit.scheduledStart.slice(0, 10);
	const [startTime, setStartTime] = useState(fmt(visit.scheduledStart));
	const [endTime, setEndTime] = useState(fmt(visit.scheduledEnd));
	const [carerId, setCarerId] = useState<string | null>(visit.carerId);
	const [category, setCategory] = useState(visit.category);

	function handleSave() {
		const carer = MOCK_CARERS.find((c) => c.id === carerId) ?? null;
		onSave({
			scheduledStart: `${dateStr}T${startTime}:00`,
			scheduledEnd: `${dateStr}T${endTime}:00`,
			carerId: carer?.id ?? null,
			carerName: carer?.name ?? null,
			carerInitials: carer?.initials ?? null,
			carerColor: carer?.color ?? null,
			category,
		});
	}

	return (
		<div className='flex flex-1 flex-col overflow-hidden'>
			<div className='flex-1 overflow-y-auto px-5 py-4'>
				{/* Timing */}
				<p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400'>
					Timing
				</p>
				<div className='mb-5 grid grid-cols-2 gap-3'>
					<div>
						<label className='mb-1 block text-xs text-slate-500'>
							Start time
						</label>
						<input
							type='time'
							value={startTime}
							onChange={(e) => setStartTime(e.target.value)}
							className='w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
						/>
					</div>
					<div>
						<label className='mb-1 block text-xs text-slate-500'>
							End time
						</label>
						<input
							type='time'
							value={endTime}
							onChange={(e) => setEndTime(e.target.value)}
							className='w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
						/>
					</div>
				</div>

				{/* Category */}
				<p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400'>
					Category
				</p>
				<select
					value={category}
					onChange={(e) => setCategory(e.target.value)}
					className='mb-5 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'>
					{CATEGORIES.map((c) => (
						<option key={c} value={c}>
							{c}
						</option>
					))}
				</select>

				{/* Carer */}
				<p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400'>
					Assigned carer
				</p>
				<CarerPicker value={carerId} onChange={setCarerId} />
			</div>

			<div className='flex gap-2 border-t border-border p-4'>
				<Button variant='outline' className='flex-1' onClick={onCancel}>
					Cancel
				</Button>
				<Button
					className='flex-1 bg-[#0284c7] text-white hover:bg-care-blue-hover'
					onClick={handleSave}>
					Save changes
				</Button>
			</div>
		</div>
	);
}

/* ── VisitDetailPanel ────────────────────────────────────────────────────── */

function VisitDetailPanel({
	visit,
	onClose,
	onUpdate,
}: {
	visit: Visit;
	onClose: () => void;
	onUpdate: (patch: Partial<Visit>) => void;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [tasks, setTasks] = useState(() => visit.tasks);
	const done = tasks.filter((t) => t.completed).length;
	const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

	function handleSave(patch: Partial<Visit>) {
		onUpdate(patch);
		setIsEditing(false);
	}

	return (
		<>
			<div
				className='fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]'
				onClick={onClose}
			/>
			<div className='fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col bg-white shadow-2xl'>
				{/* Header */}
				<div className='flex items-start justify-between border-b border-border p-5'>
					<div>
						<div className='flex items-center gap-2'>
							<h2 className='text-lg font-semibold text-slate-900'>
								{visit.patientName}
							</h2>
							{isEditing && (
								<span className='rounded-full bg-[#0284c7]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0284c7]'>
									Editing
								</span>
							)}
						</div>
						<p className='mt-0.5 flex items-center gap-1 text-sm text-slate-500'>
							<MapPin className='h-3.5 w-3.5 shrink-0' />
							{visit.patientAddress}
						</p>
					</div>
					<div className='flex items-center gap-1'>
						{!isEditing && (
							<button
								onClick={() => setIsEditing(true)}
								className='rounded-lg p-1.5 text-slate-400 hover:bg-muted hover:text-slate-600'
								title='Edit visit'>
								<Pencil className='h-4 w-4' />
							</button>
						)}
						<button
							onClick={onClose}
							className='rounded-lg p-1.5 hover:bg-muted'>
							<X className='h-5 w-5 text-slate-400' />
						</button>
					</div>
				</div>

				{isEditing ? (
					<EditVisitForm
						visit={visit}
						onSave={handleSave}
						onCancel={() => setIsEditing(false)}
					/>
				) : (
					<>
						{/* Status + category */}
						<div className='flex items-center gap-3 border-b border-border px-5 py-3'>
							<span
								className={cn(
									'rounded-full border px-2.5 py-0.5 text-xs font-medium',
									S_BADGE[visit.status],
								)}>
								{S_LABEL[visit.status]}
							</span>
							<span className='text-sm text-slate-500'>{visit.category}</span>
						</div>

						{/* Timing grid */}
						<div className='grid grid-cols-3 gap-px border-b border-border bg-border'>
							{(
								[
									['Start', fmt(visit.scheduledStart)],
									['End', fmt(visit.scheduledEnd)],
									[
										'Duration',
										fmtDur(visit.scheduledStart, visit.scheduledEnd),
									],
								] as const
							).map(([label, value]) => (
								<div key={label} className='bg-white px-4 py-3 text-center'>
									<p className='text-[10px] uppercase tracking-wide text-slate-400'>
										{label}
									</p>
									<p className='mt-0.5 text-base font-bold text-slate-800'>
										{value}
									</p>
								</div>
							))}
						</div>

						{/* Carer */}
						{visit.carerName ? (
							<div className='flex items-center gap-3 border-b border-border px-5 py-3'>
								<div
									className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white'
									style={{ backgroundColor: visit.carerColor ?? '#6366f1' }}>
									{visit.carerInitials}
								</div>
								<div>
									<p className='text-sm font-medium text-slate-800'>
										{visit.carerName}
									</p>
									<p className='text-xs text-slate-400'>Assigned Carer</p>
								</div>
								<button
									onClick={() => setIsEditing(true)}
									className='ml-auto rounded-lg border border-border px-2.5 py-1 text-xs text-slate-500 hover:bg-muted'>
									Reassign
								</button>
							</div>
						) : (
							<div className='flex items-center gap-3 border-b border-border bg-amber-50 px-5 py-3'>
								<AlertTriangle className='h-4 w-4 text-amber-500' />
								<p className='text-sm font-medium text-amber-700'>
									No carer assigned
								</p>
								<button
									onClick={() => setIsEditing(true)}
									className='ml-auto rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs text-amber-700 hover:bg-amber-100'>
									Assign
								</button>
							</div>
						)}

						{/* Tasks */}
						<div className='flex-1 overflow-y-auto px-5 py-4'>
							<div className='mb-3 flex items-center justify-between'>
								<p className='text-sm font-semibold text-slate-700'>Tasks</p>
								<span className='text-xs text-slate-400'>
									{done}/{tasks.length} complete
								</span>
							</div>
							<div className='mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100'>
								<div
									className='h-full rounded-full bg-emerald-500 transition-all duration-300'
									style={{ width: `${pct}%` }}
								/>
							</div>
							<div className='flex flex-col gap-2'>
								{tasks.map((task) => (
									<button
										key={task.id}
										onClick={() =>
											setTasks((prev) =>
												prev.map((t) =>
													t.id === task.id
														? { ...t, completed: !t.completed }
														: t,
												),
											)
										}
										className={cn(
											'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
											task.completed
												? 'border-emerald-200 bg-emerald-50'
												: 'border-slate-200 bg-white hover:bg-slate-50',
										)}>
										<div
											className={cn(
												'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
												task.completed
													? 'border-emerald-500 bg-emerald-500'
													: 'border-slate-300',
											)}>
											{task.completed && (
												<Check className='h-3 w-3 text-white' />
											)}
										</div>
										<span
											className={cn(
												'flex-1 text-sm',
												task.completed && 'text-slate-400 line-through',
											)}>
											{task.label}
										</span>
										{task.required && !task.completed && (
											<span className='rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600'>
												Required
											</span>
										)}
									</button>
								))}
							</div>

							{visit.notes && (
								<div className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3'>
									<p className='text-[10px] font-semibold uppercase tracking-wide text-slate-400'>
										Notes
									</p>
									<p className='mt-1 text-sm text-slate-600'>{visit.notes}</p>
								</div>
							)}
						</div>

						{/* Footer */}
						<div className='flex gap-2 border-t border-border p-4'>
							<Button variant='outline' className='flex-1' onClick={onClose}>
								Close
							</Button>
							{visit.status === 'SCHEDULED' && (
								<Button className='flex-1 bg-[#0284c7] text-white hover:bg-care-blue-hover'>
									Start Visit
								</Button>
							)}
							{visit.status === 'IN_PROGRESS' && (
								<Button className='flex-1 bg-emerald-600 text-white hover:bg-emerald-700'>
									Mark Complete
								</Button>
							)}
						</div>
					</>
				)}
			</div>
		</>
	);
}

/* ═══════════════════════════════════════════════════════════════════════════
   AddVisitModal
═══════════════════════════════════════════════════════════════════════════ */

function AddVisitModal({
	defaultDate,
	onAdd,
	onClose,
}: {
	defaultDate: string;
	onAdd: (v: Visit) => void;
	onClose: () => void;
}) {
	const [date, setDate] = useState(defaultDate);
	const [startTime, setStartTime] = useState('09:00');
	const [endTime, setEndTime] = useState('10:00');
	const [patientName, setPatientName] = useState('');
	const [patientAddress, setPatientAddress] = useState('');
	const [carerId, setCarerId] = useState<string | null>(null);
	const [category, setCategory] = useState(CATEGORIES[0]);
	const [notes, setNotes] = useState('');

	function handleAdd() {
		if (!patientName.trim()) return;
		const carer = MOCK_CARERS.find((c) => c.id === carerId) ?? null;
		onAdd({
			id: `new-${Date.now()}`,
			patientName: patientName.trim(),
			patientAddress: patientAddress.trim(),
			carerId: carer?.id ?? null,
			carerName: carer?.name ?? null,
			carerInitials: carer?.initials ?? null,
			carerColor: carer?.color ?? null,
			scheduledStart: `${date}T${startTime}:00`,
			scheduledEnd: `${date}T${endTime}:00`,
			status: 'SCHEDULED',
			category,
			tasks: BASE_TASKS[0].map((t, i) => ({
				...t,
				id: `new-${Date.now()}-${i}`,
				completed: false,
			})),
			notes: notes.trim() || undefined,
		});
		onClose();
	}

	return (
		<>
			<div
				className='fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]'
				onClick={onClose}
			/>
			<div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
				<div className='w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl'>
					<div className='flex items-center justify-between border-b border-border px-6 py-4'>
						<h2 className='text-lg font-semibold text-slate-900'>New Visit</h2>
						<button
							onClick={onClose}
							className='rounded-lg p-1.5 hover:bg-muted'>
							<X className='h-5 w-5 text-slate-400' />
						</button>
					</div>

					<div className='max-h-[70vh] overflow-y-auto px-6 py-5'>
						{/* Patient */}
						<p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400'>
							Patient
						</p>
						<div className='mb-5 grid grid-cols-2 gap-3'>
							<div>
								<label className='mb-1 block text-xs text-slate-500'>
									Full name *
								</label>
								<input
									type='text'
									placeholder='e.g. Robert Miller'
									value={patientName}
									onChange={(e) => setPatientName(e.target.value)}
									className='w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
									autoFocus
								/>
							</div>
							<div>
								<label className='mb-1 block text-xs text-slate-500'>
									Address
								</label>
								<input
									type='text'
									placeholder='e.g. 14 Elm St'
									value={patientAddress}
									onChange={(e) => setPatientAddress(e.target.value)}
									className='w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
								/>
							</div>
						</div>

						{/* Timing */}
						<p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400'>
							Timing
						</p>
						<div className='mb-5 grid grid-cols-3 gap-3'>
							<div>
								<label className='mb-1 block text-xs text-slate-500'>
									Date
								</label>
								<input
									type='date'
									value={date}
									onChange={(e) => setDate(e.target.value)}
									className='w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
								/>
							</div>
							<div>
								<label className='mb-1 block text-xs text-slate-500'>
									Start
								</label>
								<input
									type='time'
									value={startTime}
									onChange={(e) => setStartTime(e.target.value)}
									className='w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
								/>
							</div>
							<div>
								<label className='mb-1 block text-xs text-slate-500'>End</label>
								<input
									type='time'
									value={endTime}
									onChange={(e) => setEndTime(e.target.value)}
									className='w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
								/>
							</div>
						</div>

						{/* Category */}
						<p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400'>
							Category
						</p>
						<select
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							className='mb-5 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'>
							{CATEGORIES.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>

						{/* Carer */}
						<p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400'>
							Assign carer
						</p>
						<div className='mb-5'>
							<CarerPicker value={carerId} onChange={setCarerId} />
						</div>

						{/* Notes */}
						<p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400'>
							Notes
						</p>
						<textarea
							placeholder='Optional visit notes…'
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={2}
							className='w-full resize-none rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
						/>
					</div>

					<div className='flex gap-2 border-t border-border px-6 py-4'>
						<Button variant='outline' className='flex-1' onClick={onClose}>
							Cancel
						</Button>
						<Button
							className='flex-1 bg-[#0284c7] text-white hover:bg-care-blue-hover disabled:opacity-50'
							onClick={handleAdd}
							disabled={!patientName.trim()}>
							Create Visit
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════════════════════ */

const TODAY = new Date('2026-03-12');
const MOCK_NOW_ISO = '2026-03-12T11:30:00';

export default function RotaPage() {
	const [selectedDate, setSelectedDate] = useState(TODAY);
	const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
	const [carerSearch, setCarerSearch] = useState('');
	const [areaFilter, setAreaFilter] = useState('ALL');
	const [statusFilter, setStatusFilter] = useState<VisitStatus | 'ALL'>('ALL');
	const [overrides, setOverrides] = useState<Map<string, Visit>>(
		() => new Map(),
	);
	const [customVisits, setCustomVisits] = useState<Visit[]>([]);
	const [showAddVisit, setShowAddVisit] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	const dateStr = isoDate(selectedDate);
	const isToday = dateStr === isoDate(TODAY);

	const nowX = useMemo(
		() => (isToday ? timeToX(MOCK_NOW_ISO) : null),
		[isToday],
	);

	// Merge in any local edits + newly created visits
	const allVisits = useMemo(
		() =>
			[...MOCK_VISITS, ...customVisits].map((v) => overrides.get(v.id) ?? v),
		[overrides, customVisits],
	);

	const dayVisits = useMemo(
		() => allVisits.filter((v) => v.scheduledStart.startsWith(dateStr)),
		[allVisits, dateStr],
	);

	const unassignedVisits = useMemo(
		() => dayVisits.filter((v) => !v.carerId),
		[dayVisits],
	);

	const carerVisitMap = useMemo(() => {
		const m = new Map<string, Visit[]>();
		for (const v of dayVisits) {
			if (!v.carerId) continue;
			const arr = m.get(v.carerId) ?? [];
			arr.push(v);
			m.set(v.carerId, arr);
		}
		return m;
	}, [dayVisits]);

	const filteredCarers = useMemo(
		() =>
			MOCK_CARERS.filter((c) => {
				if (
					carerSearch &&
					!c.name.toLowerCase().includes(carerSearch.toLowerCase())
				)
					return false;
				if (areaFilter !== 'ALL' && c.area !== areaFilter) return false;
				return true;
			}),
		[carerSearch, areaFilter],
	);

	const filteredVisits = useMemo(() => {
		const m = new Map<string, Visit[]>();
		for (const carer of filteredCarers) {
			let vs = carerVisitMap.get(carer.id) ?? [];
			if (statusFilter !== 'ALL')
				vs = vs.filter((v) => v.status === statusFilter);
			m.set(carer.id, vs);
		}
		return m;
	}, [filteredCarers, carerVisitMap, statusFilter]);

	const stats = useMemo(
		() => ({
			total: dayVisits.length,
			completed: dayVisits.filter((v) => v.status === 'COMPLETED').length,
			inProgress: dayVisits.filter((v) => v.status === 'IN_PROGRESS').length,
			unassigned: unassignedVisits.length,
		}),
		[dayVisits, unassignedVisits],
	);

	const dayLabel = selectedDate.toLocaleDateString('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	return (
		<div className='flex h-full flex-col overflow-hidden'>
			{/* Page header */}
			<div className='shrink-0 border-b border-border bg-white px-6 py-4'>
				<div className='flex flex-wrap items-start justify-between gap-3'>
					<div>
						<h1 className='font-heading text-2xl font-bold text-slate-900'>
							Visits & Roster
						</h1>
						<p className='mt-0.5 text-sm text-slate-500'>{dayLabel}</p>
					</div>
					<div className='flex items-center gap-2'>
						<button
							onClick={() => setSelectedDate((d) => addDays(d, -1))}
							className='rounded-lg border border-border p-2 hover:bg-muted'>
							<ChevronLeft className='h-4 w-4' />
						</button>
						<button
							onClick={() => setSelectedDate(TODAY)}
							className={cn(
								'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
								isToday
									? 'border-[#0284c7] bg-[#0284c7] text-white'
									: 'border-border hover:bg-muted',
							)}>
							Today
						</button>
						<button
							onClick={() => setSelectedDate((d) => addDays(d, 1))}
							className='rounded-lg border border-border p-2 hover:bg-muted'>
							<ChevronRight className='h-4 w-4' />
						</button>
						<Button
							className='ml-2 bg-[#0284c7] text-white hover:bg-care-blue-hover'
							onClick={() => setShowAddVisit(true)}>
							<Plus className='mr-1.5 h-4 w-4' />
							Add Visit
						</Button>
					</div>
				</div>

				{/* Stats */}
				<div className='mt-4 flex flex-wrap gap-2'>
					{(
						[
							['Total', stats.total, 'text-slate-700'],
							['Completed', stats.completed, 'text-emerald-600'],
							['In Progress', stats.inProgress, 'text-amber-600'],
							['Unassigned', stats.unassigned, 'text-red-600'],
						] as const
					).map(([label, val, cls]) => (
						<div
							key={label}
							className='flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2'>
							<span className={cn('text-xl font-bold', cls)}>{val}</span>
							<span className='text-sm text-slate-500'>{label}</span>
						</div>
					))}
				</div>
			</div>

			{/* Filters */}
			<div className='flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-white px-6 py-2.5'>
				<div className='relative min-w-40 max-w-xs flex-1'>
					<Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400' />
					<input
						type='text'
						placeholder='Search carer…'
						value={carerSearch}
						onChange={(e) => setCarerSearch(e.target.value)}
						className='w-full rounded-lg border border-border bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'
					/>
				</div>
				<select
					value={areaFilter}
					onChange={(e) => setAreaFilter(e.target.value)}
					className='rounded-lg border border-border bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'>
					<option value='ALL'>All Areas</option>
					{AREAS.map((a) => (
						<option key={a} value={a}>
							{a}
						</option>
					))}
				</select>
				<select
					value={statusFilter}
					onChange={(e) =>
						setStatusFilter(e.target.value as VisitStatus | 'ALL')
					}
					className='rounded-lg border border-border bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/30'>
					<option value='ALL'>All Statuses</option>
					{(Object.keys(S_LABEL) as VisitStatus[]).map((s) => (
						<option key={s} value={s}>
							{S_LABEL[s]}
						</option>
					))}
				</select>
				<span className='ml-auto text-xs text-slate-400'>
					{filteredCarers.length} / {MOCK_CARERS.length} carers
				</span>
			</div>

			{/* Gantt grid — both axes scrollable */}
			<div ref={scrollRef} className='min-h-0 flex-1 overflow-auto'>
				<div style={{ minWidth: CARER_COL + TOTAL_WIDTH + 32 }}>
					<TimeHeader nowX={nowX} />

					<UnassignedRow
						visits={unassignedVisits}
						selectedId={selectedVisit?.id ?? null}
						onSelect={setSelectedVisit}
						nowX={nowX}
					/>

					{filteredCarers.map((carer, i) => (
						<GanttRow
							key={carer.id}
							carer={carer}
							visits={filteredVisits.get(carer.id) ?? []}
							selectedId={selectedVisit?.id ?? null}
							onSelect={setSelectedVisit}
							shade={i % 2 !== 0}
							nowX={nowX}
						/>
					))}

					{filteredCarers.length === 0 && (
						<div className='flex h-24 items-center justify-center text-sm text-slate-400'>
							No carers match your filters.
						</div>
					)}
				</div>
			</div>

			{/* Detail panel */}
			{selectedVisit && (
				<VisitDetailPanel
					key={selectedVisit.id}
					visit={selectedVisit}
					onClose={() => setSelectedVisit(null)}
					onUpdate={(patch) => {
						const updated = { ...selectedVisit, ...patch };
						setOverrides((prev) =>
							new Map(prev).set(selectedVisit.id, updated),
						);
						setSelectedVisit(updated);
					}}
				/>
			)}

			{/* Add visit modal */}
			{showAddVisit && (
				<AddVisitModal
					defaultDate={dateStr}
					onAdd={(v) => setCustomVisits((prev) => [...prev, v])}
					onClose={() => setShowAddVisit(false)}
				/>
			)}
		</div>
	);
}
