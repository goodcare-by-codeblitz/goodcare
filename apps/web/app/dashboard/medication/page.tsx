'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
	AlertTriangle,
	CalendarDays,
	Check,
	ChevronRight,
	Clock,
	Info,
	Loader2,
	Pill,
	Plus,
	Search,
	Shield,
	User,
	X,
} from 'lucide-react';
import { useState } from 'react';

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

type MedStatus = 'ACTIVE' | 'PRN' | 'DISCONTINUED';
type AdminResult = 'GIVEN' | 'MISSED' | 'REFUSED' | 'NA' | null;

interface ScheduleTime {
	morning: boolean;
	noon: boolean;
	evening: boolean;
	night: boolean;
	bedtime: boolean;
}

interface Medication {
	id: string;
	name: string;
	doseAmount: string;
	doseUnit: string;
	route: string;
	frequency: string;
	schedule: ScheduleTime;
	startDate: string;
	endDate: string | null;
	prescriber: string;
	instructions: string;
	status: MedStatus;
	prnIndication?: string;
	prnMaxDose?: string;
	// MAR: last 7 days × time slots
	mar: Record<string, Record<string, AdminResult>>;
}

interface Patient {
	id: string;
	name: string;
	dob: string;
	nhsNumber: string;
	gp: string;
	allergies: string[];
	status: 'ACTIVE' | 'INACTIVE';
	medications: Medication[];
}

/* ================================================================== */
/*  Constants                                                           */
/* ================================================================== */

const DOSE_UNITS = ['mg', 'ml', 'mcg', 'g', 'units', 'tablets', 'capsules', 'puffs', 'drops'];
const ROUTES = ['Oral', 'Topical', 'Inhaled', 'Subcutaneous injection', 'Intramuscular injection', 'Sublingual', 'Rectal', 'Transdermal', 'IV', 'Other'];
const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every other day', 'Weekly', 'As directed'];

const MAR_DAYS = ['09/03', '10/03', '11/03', '12/03', '13/03', '14/03', '15/03'];
const MAR_SLOTS = ['Morning', 'Noon', 'Evening', 'Night'] as const;

/* ================================================================== */
/*  Mock Data                                                           */
/* ================================================================== */

const MOCK_PATIENTS: Patient[] = [
	{
		id: 'p1',
		name: 'Robert Miller',
		dob: '12 Mar 1945',
		nhsNumber: '485 777 3456',
		gp: 'Dr. A. Patel',
		allergies: ['Penicillin', 'NSAIDs'],
		status: 'ACTIVE',
		medications: [
			{
				id: 'm1',
				name: 'Aspirin',
				doseAmount: '75',
				doseUnit: 'mg',
				route: 'Oral',
				frequency: 'Once daily',
				schedule: { morning: true, noon: false, evening: false, night: false, bedtime: false },
				startDate: '2024-01-10',
				endDate: null,
				prescriber: 'Dr. A. Patel',
				instructions: 'Take with food. Do not crush.',
				status: 'ACTIVE',
				mar: {
					'09/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'10/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'11/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'12/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'13/03': { Morning: null, Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'14/03': { Morning: null, Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'15/03': { Morning: null, Noon: 'NA', Evening: 'NA', Night: 'NA' },
				},
			},
			{
				id: 'm2',
				name: 'Amlodipine',
				doseAmount: '5',
				doseUnit: 'mg',
				route: 'Oral',
				frequency: 'Once daily',
				schedule: { morning: true, noon: false, evening: false, night: false, bedtime: false },
				startDate: '2023-06-01',
				endDate: null,
				prescriber: 'Dr. A. Patel',
				instructions: 'Monitor blood pressure. Report dizziness.',
				status: 'ACTIVE',
				mar: {
					'09/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'10/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'11/03': { Morning: 'MISSED', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'12/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'13/03': { Morning: null, Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'14/03': { Morning: null, Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'15/03': { Morning: null, Noon: 'NA', Evening: 'NA', Night: 'NA' },
				},
			},
			{
				id: 'm3',
				name: 'Furosemide',
				doseAmount: '40',
				doseUnit: 'mg',
				route: 'Oral',
				frequency: 'Twice daily',
				schedule: { morning: true, noon: false, evening: true, night: false, bedtime: false },
				startDate: '2023-11-15',
				endDate: null,
				prescriber: 'Dr. A. Patel',
				instructions: 'Monitor fluid intake and output. Weigh daily.',
				status: 'ACTIVE',
				mar: {
					'09/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'GIVEN', Night: 'NA' },
					'10/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'GIVEN', Night: 'NA' },
					'11/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'REFUSED', Night: 'NA' },
					'12/03': { Morning: 'GIVEN', Noon: 'NA', Evening: null, Night: 'NA' },
					'13/03': { Morning: null, Noon: 'NA', Evening: null, Night: 'NA' },
					'14/03': { Morning: null, Noon: 'NA', Evening: null, Night: 'NA' },
					'15/03': { Morning: null, Noon: 'NA', Evening: null, Night: 'NA' },
				},
			},
			{
				id: 'm4',
				name: 'Morphine Sulfate',
				doseAmount: '10',
				doseUnit: 'mg',
				route: 'Oral',
				frequency: 'As directed',
				schedule: { morning: false, noon: false, evening: false, night: false, bedtime: false },
				startDate: '2025-02-20',
				endDate: null,
				prescriber: 'Dr. B. Singh',
				instructions: 'For breakthrough pain only. Max 4 doses in 24h.',
				status: 'PRN',
				prnIndication: 'Breakthrough pain',
				prnMaxDose: '40mg in 24 hours',
				mar: {
					'09/03': { Morning: 'NA', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'10/03': { Morning: 'NA', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'11/03': { Morning: 'NA', Noon: 'GIVEN', Evening: 'NA', Night: 'NA' },
					'12/03': { Morning: 'NA', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'13/03': { Morning: 'NA', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'14/03': { Morning: 'NA', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'15/03': { Morning: 'NA', Noon: 'NA', Evening: 'NA', Night: 'NA' },
				},
			},
		],
	},
	{
		id: 'p2',
		name: 'Mary Higgins',
		dob: '03 Jul 1951',
		nhsNumber: '612 344 9012',
		gp: 'Dr. C. Brown',
		allergies: ['Sulfonamides'],
		status: 'ACTIVE',
		medications: [
			{
				id: 'm1',
				name: 'Metformin',
				doseAmount: '500',
				doseUnit: 'mg',
				route: 'Oral',
				frequency: 'Twice daily',
				schedule: { morning: true, noon: false, evening: true, night: false, bedtime: false },
				startDate: '2022-03-01',
				endDate: null,
				prescriber: 'Dr. C. Brown',
				instructions: 'Take with meals. Monitor blood glucose.',
				status: 'ACTIVE',
				mar: {
					'09/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'GIVEN', Night: 'NA' },
					'10/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'GIVEN', Night: 'NA' },
					'11/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'GIVEN', Night: 'NA' },
					'12/03': { Morning: 'GIVEN', Noon: 'NA', Evening: null, Night: 'NA' },
					'13/03': { Morning: null, Noon: 'NA', Evening: null, Night: 'NA' },
					'14/03': { Morning: null, Noon: 'NA', Evening: null, Night: 'NA' },
					'15/03': { Morning: null, Noon: 'NA', Evening: null, Night: 'NA' },
				},
			},
			{
				id: 'm2',
				name: 'Warfarin',
				doseAmount: '2',
				doseUnit: 'mg',
				route: 'Oral',
				frequency: 'Once daily',
				schedule: { morning: false, noon: false, evening: true, night: false, bedtime: false },
				startDate: '2023-01-15',
				endDate: null,
				prescriber: 'Dr. C. Brown',
				instructions: 'Monitor INR regularly. Avoid aspirin and NSAIDs. Check for bruising.',
				status: 'ACTIVE',
				mar: {
					'09/03': { Morning: 'NA', Noon: 'NA', Evening: 'GIVEN', Night: 'NA' },
					'10/03': { Morning: 'NA', Noon: 'NA', Evening: 'GIVEN', Night: 'NA' },
					'11/03': { Morning: 'NA', Noon: 'NA', Evening: 'GIVEN', Night: 'NA' },
					'12/03': { Morning: 'NA', Noon: 'NA', Evening: null, Night: 'NA' },
					'13/03': { Morning: 'NA', Noon: 'NA', Evening: null, Night: 'NA' },
					'14/03': { Morning: 'NA', Noon: 'NA', Evening: null, Night: 'NA' },
					'15/03': { Morning: 'NA', Noon: 'NA', Evening: null, Night: 'NA' },
				},
			},
		],
	},
	{
		id: 'p3',
		name: 'John Dow',
		dob: '18 Nov 1962',
		nhsNumber: '723 891 2345',
		gp: 'Dr. F. Hassan',
		allergies: [],
		status: 'ACTIVE',
		medications: [],
	},
	{
		id: 'p4',
		name: 'Mrs. Kemp',
		dob: '25 Sep 1938',
		nhsNumber: '834 556 7890',
		gp: 'Dr. A. Patel',
		allergies: ['Latex', 'Codeine'],
		status: 'ACTIVE',
		medications: [
			{
				id: 'm1',
				name: 'Simvastatin',
				doseAmount: '20',
				doseUnit: 'mg',
				route: 'Oral',
				frequency: 'Once daily',
				schedule: { morning: false, noon: false, evening: false, night: true, bedtime: false },
				startDate: '2021-08-01',
				endDate: null,
				prescriber: 'Dr. A. Patel',
				instructions: 'Take at night. Avoid grapefruit juice.',
				status: 'ACTIVE',
				mar: {
					'09/03': { Morning: 'NA', Noon: 'NA', Evening: 'NA', Night: 'GIVEN' },
					'10/03': { Morning: 'NA', Noon: 'NA', Evening: 'NA', Night: 'GIVEN' },
					'11/03': { Morning: 'NA', Noon: 'NA', Evening: 'NA', Night: 'GIVEN' },
					'12/03': { Morning: 'NA', Noon: 'NA', Evening: 'NA', Night: null },
					'13/03': { Morning: 'NA', Noon: 'NA', Evening: 'NA', Night: null },
					'14/03': { Morning: 'NA', Noon: 'NA', Evening: 'NA', Night: null },
					'15/03': { Morning: 'NA', Noon: 'NA', Evening: 'NA', Night: null },
				},
			},
		],
	},
	{
		id: 'p5',
		name: 'James Porter',
		dob: '07 Feb 1958',
		nhsNumber: '945 112 3456',
		gp: 'Dr. L. Wu',
		allergies: [],
		status: 'ACTIVE',
		medications: [
			{
				id: 'm1',
				name: 'Sertraline',
				doseAmount: '50',
				doseUnit: 'mg',
				route: 'Oral',
				frequency: 'Once daily',
				schedule: { morning: true, noon: false, evening: false, night: false, bedtime: false },
				startDate: '2024-05-12',
				endDate: null,
				prescriber: 'Dr. L. Wu',
				instructions: 'Take in the morning with or without food. Do not stop abruptly.',
				status: 'ACTIVE',
				mar: {
					'09/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'10/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'11/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'12/03': { Morning: 'GIVEN', Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'13/03': { Morning: null, Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'14/03': { Morning: null, Noon: 'NA', Evening: 'NA', Night: 'NA' },
					'15/03': { Morning: null, Noon: 'NA', Evening: 'NA', Night: 'NA' },
				},
			},
		],
	},
];

/* ================================================================== */
/*  Helpers                                                             */
/* ================================================================== */

const MAR_RESULT_CFG: Record<
	NonNullable<AdminResult>,
	{ label: string; short: string; bg: string; text: string; border: string }
> = {
	GIVEN: {
		label: 'Given',
		short: 'G',
		bg: 'bg-success/10',
		text: 'text-success',
		border: 'border-success/20',
	},
	MISSED: {
		label: 'Missed',
		short: 'M',
		bg: 'bg-error/10',
		text: 'text-error',
		border: 'border-error/20',
	},
	REFUSED: {
		label: 'Refused',
		short: 'R',
		bg: 'bg-warning/10',
		text: 'text-warning',
		border: 'border-warning/20',
	},
	NA: {
		label: 'N/A',
		short: '–',
		bg: 'bg-slate-50',
		text: 'text-slate-300',
		border: 'border-slate-100',
	},
};

function getActiveMeds(meds: Medication[]) {
	return meds.filter((m) => m.status === 'ACTIVE');
}
function getPRNMeds(meds: Medication[]) {
	return meds.filter((m) => m.status === 'PRN');
}

function formatSchedule(s: ScheduleTime): string {
	const times = Object.entries(s)
		.filter(([, v]) => v)
		.map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
	return times.length > 0 ? times.join(', ') : 'As needed';
}

/* ================================================================== */
/*  MedicationCard                                                      */
/* ================================================================== */

function MedicationCard({ med }: { med: Medication }) {
	const isPRN = med.status === 'PRN';
	return (
		<div
			className={cn(
				'rounded-xl border p-4 transition-shadow hover:shadow-md',
				isPRN
					? 'border-warning/30 bg-warning/5'
					: 'border-border bg-white',
			)}>
			<div className='flex items-start justify-between gap-3'>
				<div className='min-w-0 flex-1'>
					<div className='flex flex-wrap items-center gap-2'>
						<p className='font-heading text-base font-bold text-foreground'>
							{med.name}
						</p>
						<span
							className={cn(
								'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
								isPRN
									? 'bg-warning/10 text-warning border border-warning/20'
									: 'bg-success/10 text-success border border-success/20',
							)}>
							{isPRN ? 'PRN' : 'Active'}
						</span>
					</div>
					<p className='mt-1 text-sm font-semibold text-slate-700'>
						{med.doseAmount} {med.doseUnit} — {med.route}
					</p>
				</div>
				<div className='shrink-0 text-right'>
					<p className='text-xs font-semibold text-slate-500'>
						{med.frequency}
					</p>
					<p className='mt-0.5 text-[10px] text-slate-400'>
						Since{' '}
						{new Date(med.startDate).toLocaleDateString('en-GB', {
							month: 'short',
							year: 'numeric',
						})}
					</p>
				</div>
			</div>

			{/* Schedule times */}
			<div className='mt-3 flex flex-wrap gap-1.5'>
				{(
					Object.entries(med.schedule) as [keyof ScheduleTime, boolean][]
				)
					.filter(([, v]) => v)
					.map(([time]) => (
						<span
							key={time}
							className='inline-flex items-center rounded-full border border-care-blue/20 bg-care-blue-light px-2.5 py-0.5 text-[11px] font-semibold text-care-blue capitalize'>
							{time}
						</span>
					))}
				{Object.values(med.schedule).every((v) => !v) && (
					<span className='text-xs text-slate-400 italic'>No fixed schedule</span>
				)}
			</div>

			{/* PRN details */}
			{isPRN && med.prnIndication && (
				<div className='mt-3 rounded-lg bg-warning/10 border border-warning/20 px-3 py-2'>
					<p className='text-xs font-semibold text-warning'>
						Indication: {med.prnIndication}
					</p>
					{med.prnMaxDose && (
						<p className='mt-0.5 text-xs text-slate-600'>
							Max dose: {med.prnMaxDose}
						</p>
					)}
				</div>
			)}

			{/* Instructions */}
			{med.instructions && (
				<div className='mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2'>
					<Info className='mt-0.5 size-3.5 shrink-0 text-slate-400' />
					<p className='text-xs text-slate-600 leading-relaxed'>
						{med.instructions}
					</p>
				</div>
			)}

			<div className='mt-3 flex items-center gap-4 text-xs text-slate-500'>
				<span className='flex items-center gap-1'>
					<User className='size-3' />
					{med.prescriber}
				</span>
				{med.endDate && (
					<span className='flex items-center gap-1 text-warning'>
						<AlertTriangle className='size-3' />
						Ends {med.endDate}
					</span>
				)}
			</div>
		</div>
	);
}

/* ================================================================== */
/*  MARGrid                                                             */
/* ================================================================== */

function MARGrid({ medications }: { medications: Medication[] }) {
	const active = medications.filter((m) => m.status !== 'DISCONTINUED');

	if (active.length === 0) {
		return (
			<p className='py-8 text-center text-sm text-slate-400'>
				No medications to display in MAR.
			</p>
		);
	}

	return (
		<div className='overflow-x-auto'>
			<table className='w-full text-xs border-collapse min-w-[700px]'>
				<thead>
					<tr>
						<th className='sticky left-0 bg-white border border-slate-200 px-3 py-2 text-left font-bold text-slate-700 min-w-[160px]'>
							Medication
						</th>
						<th className='border border-slate-200 px-2 py-2 text-left font-semibold text-slate-500 min-w-[80px]'>
							Dose
						</th>
						{MAR_DAYS.map((day) => (
							<th
								key={day}
								colSpan={MAR_SLOTS.length}
								className={cn(
									'border border-slate-200 px-2 py-2 text-center font-bold',
									day === '12/03'
										? 'bg-care-blue-light text-care-blue'
										: 'text-slate-700',
								)}>
								{day}
							</th>
						))}
					</tr>
					<tr>
						<th className='sticky left-0 bg-slate-50 border border-slate-200 px-3 py-1.5' />
						<th className='border border-slate-200 px-2 py-1.5' />
						{MAR_DAYS.flatMap((day) =>
							MAR_SLOTS.map((slot) => (
								<th
									key={`${day}-${slot}`}
									className={cn(
										'border border-slate-200 px-1 py-1.5 text-center text-[10px] font-semibold text-slate-400',
										day === '12/03' && 'bg-blue-50/40',
									)}>
									{slot.slice(0, 3)}
								</th>
							)),
						)}
					</tr>
				</thead>
				<tbody>
					{active.map((med) => (
						<tr key={med.id} className='hover:bg-slate-50 transition-colors'>
							<td className='sticky left-0 bg-white border border-slate-200 px-3 py-2 font-semibold text-foreground'>
								{med.name}
							</td>
							<td className='border border-slate-200 px-2 py-2 text-slate-500 whitespace-nowrap'>
								{med.doseAmount} {med.doseUnit}
							</td>
							{MAR_DAYS.flatMap((day) =>
								MAR_SLOTS.map((slot) => {
									const result = med.mar[day]?.[slot] ?? null;
									if (result === null) {
										return (
											<td
												key={`${day}-${slot}`}
												className={cn(
													'border border-slate-200 px-1 py-2 text-center',
													day === '12/03' && 'bg-blue-50/20',
												)}>
												<div className='mx-auto size-6 rounded border border-dashed border-slate-200' />
											</td>
										);
									}
									const cfg = MAR_RESULT_CFG[result];
									return (
										<td
											key={`${day}-${slot}`}
											className={cn(
												'border border-slate-200 px-1 py-2 text-center',
												day === '12/03' && 'bg-blue-50/20',
											)}>
											<div
												className={cn(
													'mx-auto flex size-6 items-center justify-center rounded border font-bold',
													cfg.bg,
													cfg.text,
													cfg.border,
												)}
												title={cfg.label}>
												{cfg.short}
											</div>
										</td>
									);
								}),
							)}
						</tr>
					))}
				</tbody>
			</table>

			{/* Legend */}
			<div className='mt-3 flex flex-wrap items-center gap-4 px-1'>
				<p className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>
					Key:
				</p>
				{Object.entries(MAR_RESULT_CFG)
					.filter(([k]) => k !== 'NA')
					.map(([, cfg]) => (
						<div key={cfg.label} className='flex items-center gap-1.5'>
							<div
								className={cn(
									'flex size-5 items-center justify-center rounded border text-[10px] font-bold',
									cfg.bg,
									cfg.text,
									cfg.border,
								)}>
								{cfg.short}
							</div>
							<span className='text-[11px] text-slate-500'>{cfg.label}</span>
						</div>
					))}
				<div className='flex items-center gap-1.5'>
					<div className='size-5 rounded border border-dashed border-slate-200' />
					<span className='text-[11px] text-slate-500'>Pending</span>
				</div>
			</div>
		</div>
	);
}

/* ================================================================== */
/*  AddMedicationModal                                                  */
/* ================================================================== */

function AddMedicationModal({
	patient,
	onClose,
}: {
	patient: Patient;
	onClose: () => void;
}) {
	const [drugName, setDrugName] = useState('');
	const [doseAmount, setDoseAmount] = useState('');
	const [doseUnit, setDoseUnit] = useState('mg');
	const [route, setRoute] = useState('Oral');
	const [isPRN, setIsPRN] = useState(false);
	const [frequency, setFrequency] = useState('Once daily');
	const [schedule, setSchedule] = useState<ScheduleTime>({
		morning: false,
		noon: false,
		evening: false,
		night: false,
		bedtime: false,
	});
	const [startDate, setStartDate] = useState('2026-03-12');
	const [ongoing, setOngoing] = useState(true);
	const [endDate, setEndDate] = useState('');
	const [prescriber, setPrescriber] = useState('');
	const [instructions, setInstructions] = useState('');
	const [prnIndication, setPrnIndication] = useState('');
	const [prnMaxDose, setPrnMaxDose] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const canSubmit = drugName && doseAmount && prescriber;

	function toggleScheduleTime(time: keyof ScheduleTime) {
		setSchedule((prev) => ({ ...prev, [time]: !prev[time] }));
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		setSubmitting(true);
		setTimeout(() => {
			setSubmitting(false);
			onClose();
		}, 900);
	}

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'
			role='dialog'
			aria-modal='true'
			aria-labelledby='add-med-title'
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}>
			<div className='w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-white shadow-2xl'>
				{/* Header */}
				<div className='sticky top-0 z-10 flex items-start justify-between border-b border-border bg-white px-6 py-5'>
					<div>
						<p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
							Add Medication
						</p>
						<h2
							id='add-med-title'
							className='mt-0.5 font-heading text-lg font-bold text-foreground'>
							{patient.name}
						</h2>
						{patient.allergies.length > 0 && (
							<div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
								<AlertTriangle className='size-3.5 text-error' />
								<span className='text-xs font-semibold text-error'>
									Allergies:
								</span>
								{patient.allergies.map((a) => (
									<span
										key={a}
										className='inline-flex items-center rounded-full bg-error/10 border border-error/20 px-2 py-0.5 text-[11px] font-semibold text-error'>
										{a}
									</span>
								))}
							</div>
						)}
					</div>
					<button
						type='button'
						onClick={onClose}
						className='ml-4 flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-foreground'>
						<X className='size-4' />
					</button>
				</div>

				<form
					onSubmit={handleSubmit}
					className='flex flex-col divide-y divide-border'>
					{/* Section: Drug */}
					<div className='px-6 py-5'>
						<h3 className='mb-4 text-xs font-bold uppercase tracking-wider text-slate-400'>
							Drug Details
						</h3>
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
							<div className='flex flex-col gap-2 sm:col-span-2'>
								<Label htmlFor='am-drug'>
									Drug Name{' '}
									<span className='text-error' aria-hidden='true'>
										*
									</span>
								</Label>
								<Input
									id='am-drug'
									placeholder='e.g. Metformin, Amlodipine…'
									required
									value={drugName}
									onChange={(e) => setDrugName(e.target.value)}
									className='h-10'
								/>
							</div>

							<div className='flex flex-col gap-2'>
								<Label htmlFor='am-dose-amount'>
									Dose Amount{' '}
									<span className='text-error' aria-hidden='true'>
										*
									</span>
								</Label>
								<Input
									id='am-dose-amount'
									type='number'
									min='0'
									step='any'
									placeholder='e.g. 5'
									required
									value={doseAmount}
									onChange={(e) => setDoseAmount(e.target.value)}
									className='h-10'
								/>
							</div>

							<div className='flex flex-col gap-2'>
								<Label htmlFor='am-dose-unit'>Dose Unit</Label>
								<select
									id='am-dose-unit'
									value={doseUnit}
									onChange={(e) => setDoseUnit(e.target.value)}
									className='h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-care-blue focus:ring-2 focus:ring-care-blue/20 focus:outline-none'>
									{DOSE_UNITS.map((u) => (
										<option key={u} value={u}>
											{u}
										</option>
									))}
								</select>
							</div>

							<div className='flex flex-col gap-2 sm:col-span-2'>
								<Label htmlFor='am-route'>Route of Administration</Label>
								<select
									id='am-route'
									value={route}
									onChange={(e) => setRoute(e.target.value)}
									className='h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-care-blue focus:ring-2 focus:ring-care-blue/20 focus:outline-none'>
									{ROUTES.map((r) => (
										<option key={r} value={r}>
											{r}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>

					{/* Section: Type & Schedule */}
					<div className='px-6 py-5'>
						<h3 className='mb-4 text-xs font-bold uppercase tracking-wider text-slate-400'>
							Type &amp; Schedule
						</h3>

						{/* PRN toggle */}
						<div className='mb-4 flex items-center justify-between rounded-xl border border-border p-4'>
							<div>
								<p className='text-sm font-semibold text-foreground'>
									PRN (As Required)
								</p>
								<p className='text-xs text-slate-500'>
									Enable for medications given only when needed, not on a fixed
									schedule.
								</p>
							</div>
							<button
								type='button'
								role='switch'
								aria-checked={isPRN}
								onClick={() => setIsPRN((v) => !v)}
								className={cn(
									'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue/50',
									isPRN ? 'bg-care-blue' : 'bg-slate-200',
								)}>
								<span
									className={cn(
										'inline-block size-5 rounded-full bg-white shadow-lg transition-transform',
										isPRN ? 'translate-x-5' : 'translate-x-0',
									)}
								/>
							</button>
						</div>

						{!isPRN && (
							<>
								<div className='mb-4 flex flex-col gap-2'>
									<Label htmlFor='am-frequency'>Frequency</Label>
									<select
										id='am-frequency'
										value={frequency}
										onChange={(e) => setFrequency(e.target.value)}
										className='h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-care-blue focus:ring-2 focus:ring-care-blue/20 focus:outline-none'>
										{FREQUENCIES.map((f) => (
											<option key={f} value={f}>
												{f}
											</option>
										))}
									</select>
								</div>

								{/* Schedule times */}
								<div>
									<Label className='mb-2 block'>
										Administration Times
									</Label>
									<div className='flex flex-wrap gap-2'>
										{(
											Object.keys(schedule) as (keyof ScheduleTime)[]
										).map((time) => (
											<button
												key={time}
												type='button'
												onClick={() => toggleScheduleTime(time)}
												className={cn(
													'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold capitalize transition-all',
													schedule[time]
														? 'border-care-blue bg-care-blue text-white shadow-sm'
														: 'border-border bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
												)}>
												{schedule[time] && (
													<Check className='size-3.5' strokeWidth={3} />
												)}
												{time}
											</button>
										))}
									</div>
								</div>
							</>
						)}

						{/* PRN-specific fields */}
						{isPRN && (
							<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
								<div className='flex flex-col gap-2 sm:col-span-2'>
									<Label htmlFor='am-prn-indication'>Indication</Label>
									<Input
										id='am-prn-indication'
										placeholder='e.g. Breakthrough pain, Anxiety episode…'
										value={prnIndication}
										onChange={(e) => setPrnIndication(e.target.value)}
										className='h-10'
									/>
								</div>
								<div className='flex flex-col gap-2 sm:col-span-2'>
									<Label htmlFor='am-prn-max'>Maximum Dose in 24 Hours</Label>
									<Input
										id='am-prn-max'
										placeholder='e.g. 40mg / 4 doses'
										value={prnMaxDose}
										onChange={(e) => setPrnMaxDose(e.target.value)}
										className='h-10'
									/>
								</div>
							</div>
						)}
					</div>

					{/* Section: Dates & Prescriber */}
					<div className='px-6 py-5'>
						<h3 className='mb-4 text-xs font-bold uppercase tracking-wider text-slate-400'>
							Dates &amp; Prescriber
						</h3>
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
							<div className='flex flex-col gap-2'>
								<Label htmlFor='am-start'>
									Start Date{' '}
									<span className='text-error' aria-hidden='true'>
										*
									</span>
								</Label>
								<Input
									id='am-start'
									type='date'
									required
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className='h-10'
								/>
							</div>

							<div className='flex flex-col gap-2'>
								<div className='flex items-center justify-between'>
									<Label htmlFor='am-end'>End Date</Label>
									<label className='flex cursor-pointer items-center gap-1.5 text-xs text-slate-500'>
										<input
											type='checkbox'
											checked={ongoing}
											onChange={(e) => setOngoing(e.target.checked)}
											className='rounded border-border'
										/>
										Ongoing
									</label>
								</div>
								<Input
									id='am-end'
									type='date'
									disabled={ongoing}
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									className={cn(
										'h-10',
										ongoing && 'cursor-not-allowed bg-slate-100 text-slate-400',
									)}
								/>
							</div>

							<div className='flex flex-col gap-2 sm:col-span-2'>
								<Label htmlFor='am-prescriber'>
									Prescriber{' '}
									<span className='text-error' aria-hidden='true'>
										*
									</span>
								</Label>
								<Input
									id='am-prescriber'
									placeholder='e.g. Dr. A. Patel'
									required
									value={prescriber}
									onChange={(e) => setPrescriber(e.target.value)}
									className='h-10'
								/>
							</div>
						</div>
					</div>

					{/* Section: Instructions */}
					<div className='px-6 py-5'>
						<h3 className='mb-4 text-xs font-bold uppercase tracking-wider text-slate-400'>
							Special Instructions
						</h3>
						<textarea
							id='am-instructions'
							rows={3}
							placeholder='Any special handling instructions, warnings, or notes for carers…'
							value={instructions}
							onChange={(e) => setInstructions(e.target.value)}
							className='w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground resize-none focus:border-care-blue focus:ring-2 focus:ring-care-blue/20 focus:outline-none'
						/>
					</div>

					{/* Safety notice */}
					<div className='px-6 py-5'>
						<div className='flex gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4'>
							<Shield
								className='mt-0.5 size-5 shrink-0 text-warning'
								aria-hidden='true'
							/>
							<div>
								<p className='text-sm font-bold text-foreground'>
									Clinical Safety Notice
								</p>
								<p className='mt-1 text-sm leading-relaxed text-slate-700'>
									Always verify the medication, dose, and frequency against the
									original prescription before confirming. Ensure any known
									allergies are checked. This record will be added to the
									patient&apos;s MAR and requires administrator sign-off for
									controlled drugs.
								</p>
							</div>
						</div>
					</div>

					{/* Actions */}
					<div className='sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-white px-6 py-4'>
						<button
							type='button'
							onClick={onClose}
							className='h-11 rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted'>
							Cancel
						</button>
						<Button
							type='submit'
							disabled={!canSubmit || submitting}
							className={cn(
								'h-11 gap-2 px-6 text-sm font-semibold shadow-md',
								canSubmit
									? 'bg-care-blue hover:bg-care-blue-hover'
									: 'cursor-not-allowed bg-care-blue/50',
							)}>
							{submitting ? (
								<Loader2 className='size-4 animate-spin' />
							) : (
								<Plus className='size-4' />
							)}
							Add to MAR
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

/* ================================================================== */
/*  Page                                                                */
/* ================================================================== */

type MedTab = 'active' | 'prn' | 'mar';

export default function MedicationPage() {
	const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
		null,
	);
	const [patientSearch, setPatientSearch] = useState('');
	const [tab, setTab] = useState<MedTab>('active');
	const [showAddModal, setShowAddModal] = useState(false);

	const selectedPatient = MOCK_PATIENTS.find(
		(p) => p.id === selectedPatientId,
	);

	const filteredPatients = MOCK_PATIENTS.filter((p) => {
		const q = patientSearch.toLowerCase();
		return (
			p.name.toLowerCase().includes(q) ||
			p.nhsNumber.toLowerCase().includes(q)
		);
	});

	const activeMeds = selectedPatient
		? getActiveMeds(selectedPatient.medications)
		: [];
	const prnMeds = selectedPatient
		? getPRNMeds(selectedPatient.medications)
		: [];

	return (
		<>
			{showAddModal && selectedPatient && (
				<AddMedicationModal
					patient={selectedPatient}
					onClose={() => setShowAddModal(false)}
				/>
			)}

			<div className='flex h-full flex-col'>
				{/* Page header */}
				<div className='shrink-0 border-b border-border bg-white px-6 py-5'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='flex size-10 items-center justify-center rounded-xl bg-care-blue-light'>
								<Pill className='size-5 text-care-blue' />
							</div>
							<div>
								<h1 className='font-heading text-xl font-bold tracking-tight text-foreground'>
									Medication &amp; eMAR
								</h1>
								<p className='text-sm text-slate-500'>
									Manage prescriptions, schedules, and administration records.
								</p>
							</div>
						</div>
						{selectedPatient && (
							<Button
								onClick={() => setShowAddModal(true)}
								className='h-10 gap-2 bg-care-blue text-sm font-semibold shadow-md hover:bg-care-blue-hover'>
								<Plus className='size-4' />
								Add Medication
							</Button>
						)}
					</div>
				</div>

				{/* Body: split panel */}
				<div className='flex min-h-0 flex-1 overflow-hidden'>
					{/* Left: Patient list */}
					<div className='flex w-72 shrink-0 flex-col border-r border-border bg-white'>
						{/* Search */}
						<div className='border-b border-border p-3'>
							<div className='relative'>
								<Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400' />
								<Input
									type='search'
									placeholder='Search patients…'
									value={patientSearch}
									onChange={(e) => setPatientSearch(e.target.value)}
									className='h-9 pl-9 text-sm'
								/>
							</div>
						</div>
						{/* Patient list */}
						<div className='flex-1 overflow-y-auto py-1'>
							{filteredPatients.map((p) => {
								const isSelected = p.id === selectedPatientId;
								const medCount = p.medications.filter(
									(m) => m.status !== 'DISCONTINUED',
								).length;
								return (
									<button
										key={p.id}
										type='button'
										onClick={() => {
											setSelectedPatientId(p.id);
											setTab('active');
										}}
										className={cn(
											'w-full px-4 py-3.5 text-left transition-colors hover:bg-slate-50',
											isSelected && 'bg-care-blue-light border-r-2 border-care-blue',
										)}>
										<div className='flex items-start justify-between gap-2'>
											<div className='min-w-0'>
												<p
													className={cn(
														'truncate text-sm font-semibold',
														isSelected ? 'text-care-blue' : 'text-foreground',
													)}>
													{p.name}
												</p>
												<p className='mt-0.5 text-xs text-slate-500'>
													DOB: {p.dob}
												</p>
											</div>
											<div className='flex shrink-0 flex-col items-end gap-1'>
												{medCount > 0 ? (
													<span
														className={cn(
															'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold',
															isSelected
																? 'bg-care-blue text-white'
																: 'bg-slate-100 text-slate-500',
														)}>
														{medCount}
													</span>
												) : (
													<span className='text-[10px] text-slate-300'>
														No meds
													</span>
												)}
												{p.allergies.length > 0 && (
													<AlertTriangle className='size-3.5 text-error' />
												)}
											</div>
										</div>
										{isSelected && (
											<div className='mt-1 flex items-center gap-1 text-[10px] text-care-blue/80'>
												<span>Selected</span>
												<ChevronRight className='size-3' />
											</div>
										)}
									</button>
								);
							})}
						</div>
					</div>

					{/* Right: Medication detail */}
					<div className='flex flex-1 flex-col overflow-hidden bg-muted'>
						{!selectedPatient ? (
							<div className='flex h-full flex-col items-center justify-center gap-4 text-center'>
								<div className='flex size-16 items-center justify-center rounded-2xl bg-white border border-border shadow-sm'>
									<Pill className='size-8 text-slate-300' />
								</div>
								<div>
									<p className='text-sm font-semibold text-foreground'>
										No patient selected
									</p>
									<p className='mt-1 text-sm text-slate-400'>
										Select a patient from the list to view their medications.
									</p>
								</div>
							</div>
						) : (
							<div className='flex h-full flex-col overflow-hidden'>
								{/* Patient info banner */}
								<div className='shrink-0 border-b border-border bg-white px-6 py-4'>
									<div className='flex flex-wrap items-start justify-between gap-4'>
										<div className='flex items-center gap-4'>
											<div
												className='flex size-12 items-center justify-center rounded-full text-lg font-bold text-white'
												style={{
													backgroundColor:
														['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'][
															MOCK_PATIENTS.findIndex(
																(p) => p.id === selectedPatient.id,
															) % 5
														],
												}}>
												{selectedPatient.name
													.split(' ')
													.map((n) => n[0])
													.join('')
													.slice(0, 2)}
											</div>
											<div>
												<p className='font-heading text-lg font-bold text-foreground'>
													{selectedPatient.name}
												</p>
												<div className='mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500'>
													<span>DOB: {selectedPatient.dob}</span>
													<span>NHS: {selectedPatient.nhsNumber}</span>
													<span>GP: {selectedPatient.gp}</span>
												</div>
											</div>
										</div>
										{/* Allergies */}
										{selectedPatient.allergies.length > 0 ? (
											<div className='flex flex-wrap items-center gap-2 rounded-xl border border-error/20 bg-error/5 px-3 py-2'>
												<AlertTriangle className='size-4 shrink-0 text-error' />
												<span className='text-xs font-bold text-error'>
													Allergies:
												</span>
												{selectedPatient.allergies.map((a) => (
													<span
														key={a}
														className='inline-flex items-center rounded-full bg-error/10 border border-error/20 px-2.5 py-0.5 text-xs font-semibold text-error'>
														{a}
													</span>
												))}
											</div>
										) : (
											<span className='inline-flex items-center gap-1.5 rounded-xl border border-success/20 bg-success/5 px-3 py-2 text-xs font-semibold text-success'>
												<Check className='size-4' />
												No known allergies
											</span>
										)}
									</div>

									{/* Stats */}
									<div className='mt-4 flex flex-wrap gap-4'>
										{[
											{
												label: 'Active',
												value: activeMeds.length,
												color: 'text-success',
											},
											{
												label: 'PRN',
												value: prnMeds.length,
												color: 'text-warning',
											},
											{
												label: 'Prescribers',
												value: new Set(
													selectedPatient.medications.map((m) => m.prescriber),
												).size,
												color: 'text-care-blue',
											},
										].map(({ label, value, color }) => (
											<div
												key={label}
												className='flex items-baseline gap-1.5'>
												<span
													className={cn(
														'text-2xl font-bold tabular-nums leading-none',
														color,
													)}>
													{value}
												</span>
												<span className='text-xs text-slate-500 font-medium'>
													{label}
												</span>
											</div>
										))}
									</div>
								</div>

								{/* Tabs */}
								<div className='shrink-0 flex border-b border-border bg-white px-6'>
									{(
										[
											{ id: 'active', label: `Active (${activeMeds.length})` },
											{ id: 'prn', label: `PRN (${prnMeds.length})` },
											{ id: 'mar', label: 'MAR Chart' },
										] as { id: MedTab; label: string }[]
									).map(({ id, label }) => (
										<button
											key={id}
											type='button'
											onClick={() => setTab(id)}
											className={cn(
												'h-11 border-b-2 px-4 text-sm font-semibold transition-colors',
												tab === id
													? 'border-care-blue text-care-blue'
													: 'border-transparent text-slate-500 hover:text-foreground',
											)}>
											{label}
										</button>
									))}
								</div>

								{/* Tab content */}
								<div className='flex-1 overflow-y-auto p-6'>
									{tab === 'active' && (
										<div className='flex flex-col gap-4'>
											{activeMeds.length > 0 ? (
												activeMeds.map((med) => (
													<MedicationCard key={med.id} med={med} />
												))
											) : (
												<div className='flex flex-col items-center gap-3 py-16 text-center'>
													<Pill className='size-10 text-slate-200' />
													<p className='text-sm font-semibold text-foreground'>
														No active medications
													</p>
													<p className='text-xs text-slate-400'>
														Click &quot;Add Medication&quot; to prescribe a new
														drug.
													</p>
												</div>
											)}
										</div>
									)}

									{tab === 'prn' && (
										<div className='flex flex-col gap-4'>
											{prnMeds.length > 0 ? (
												prnMeds.map((med) => (
													<MedicationCard key={med.id} med={med} />
												))
											) : (
												<div className='flex flex-col items-center gap-3 py-16 text-center'>
													<Clock className='size-10 text-slate-200' />
													<p className='text-sm font-semibold text-foreground'>
														No PRN medications
													</p>
													<p className='text-xs text-slate-400'>
														Add a PRN drug to track as-needed administration.
													</p>
												</div>
											)}
										</div>
									)}

									{tab === 'mar' && (
										<div className='rounded-xl border border-border bg-white p-5 shadow-sm'>
											<div className='mb-4 flex items-center justify-between'>
												<div>
													<h3 className='font-heading text-sm font-bold text-foreground'>
														Medication Administration Record
													</h3>
													<p className='mt-0.5 text-xs text-slate-500'>
														Week of 9–15 March 2026
													</p>
												</div>
												<div className='flex items-center gap-2 text-xs text-slate-400'>
													<CalendarDays className='size-4' />
													<span>Current week</span>
												</div>
											</div>
											<MARGrid medications={selectedPatient.medications} />
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
