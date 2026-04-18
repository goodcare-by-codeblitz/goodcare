'use client';

import { Button } from '@/components/ui/button';
import {
	fetchPatientMarSheet,
	getCurrentOrgContext,
	getOrgManagementError,
	type MedicationAdministrationResult,
	type MedicationMarCellStatus,
	type MedicationMarDay,
	type MedicationMarSheet,
	type MedicationMarRow,
	type MedicationScheduleSlot,
} from '@/lib/org-management';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const scheduleSlots: MedicationScheduleSlot[] = [
	'morning',
	'noon',
	'evening',
	'night',
	'bedtime',
];

const slotLabels: Record<MedicationScheduleSlot, string> = {
	morning: 'Morning',
	noon: 'Noon',
	evening: 'Evening',
	night: 'Night',
	bedtime: 'Bedtime',
};

function cellClassName(status: MedicationMarCellStatus) {
	switch (status) {
		case 'GIVEN':
			return 'border-emerald-200 bg-emerald-50 text-emerald-700';
		case 'MISSED':
			return 'border-red-200 bg-red-50 text-red-700';
		case 'REFUSED':
			return 'border-amber-200 bg-amber-50 text-amber-700';
		case 'NA':
			return 'border-slate-200 bg-slate-100 text-slate-600';
		case 'DUE':
			return 'border-sky-200 bg-sky-50 text-sky-700';
		default:
			return 'border-slate-100 bg-slate-50 text-slate-400';
	}
}

function cellLabel(status: MedicationMarCellStatus) {
	switch (status) {
		case 'GIVEN':
			return 'Given';
		case 'MISSED':
			return 'Missed';
		case 'REFUSED':
			return 'Refused';
		case 'NA':
			return 'N/A';
		case 'DUE':
			return 'Due';
		default:
			return '-';
	}
}

function formatReferenceLabel(sheet: MedicationMarSheet) {
	const date = new Date(sheet.referenceDate);
	return sheet.view === 'daily'
		? date.toLocaleDateString('en-GB', {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
				year: 'numeric',
			})
		: date.toLocaleDateString('en-GB', {
				month: 'long',
				year: 'numeric',
			});
}

function chunkDays(days: MedicationMarDay[], view: 'daily' | 'monthly') {
	if (view === 'daily') {
		return [days];
	}

	const chunks: MedicationMarDay[][] = [];
	for (let index = 0; index < days.length; index += 7) {
		chunks.push(days.slice(index, index + 7));
	}

	return chunks;
}

function PrintTable({
	rows,
	days,
}: {
	rows: MedicationMarRow[];
	days: MedicationMarDay[];
}) {
	return (
		<div className='overflow-x-auto'>
			<table className='min-w-full border-separate border-spacing-0'>
				<thead>
					<tr>
						<th
							rowSpan={2}
							className='border border-slate-300 bg-white px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500'>
							Medication
						</th>
						{days.map((day) => (
							<th
								key={day.key}
								colSpan={scheduleSlots.length}
								className='border border-slate-300 bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500'>
								{day.label}
							</th>
						))}
					</tr>
					<tr>
						{days.flatMap((day) =>
							scheduleSlots.map((slot) => (
								<th
									key={`${day.key}-${slot}`}
									className='border border-slate-300 bg-white px-1.5 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500'>
									{slotLabels[slot]}
								</th>
							)),
						)}
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row.medication.id}>
							<td className='border border-slate-300 bg-white px-3 py-3 align-top'>
								<p className='text-sm font-semibold text-slate-900'>
									{row.medication.name}
								</p>
								<p className='mt-1 text-xs text-slate-500'>
									{row.medication.doseAmount} {row.medication.doseUnit} |{' '}
									{row.medication.route}
								</p>
							</td>
							{days.flatMap((day) =>
								scheduleSlots.map((slot) => {
									const cell = row.cells[day.key]?.[slot];
									return (
										<td
											key={`${row.medication.id}-${day.key}-${slot}`}
											className='border border-slate-300 p-1'>
											<div
												className={`flex min-h-14 min-w-14 items-center justify-center rounded-md border px-1 py-2 text-center text-[11px] font-semibold ${cellClassName(
													cell?.status ?? 'NOT_SCHEDULED',
												)}`}>
												{cellLabel(cell?.status ?? 'NOT_SCHEDULED')}
											</div>
										</td>
									);
								}),
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default function PatientMedicationPrintPage({
	params,
}: {
	params: Promise<{ patientId: string }>;
}) {
	const { patientId } = use(params);
	const searchParams = useSearchParams();
	const [marSheet, setMarSheet] = useState<MedicationMarSheet | null>(null);
	const [errorMessage, setErrorMessage] = useState('');
	const [isLoading, setIsLoading] = useState(true);

	const view = searchParams.get('view') === 'monthly' ? 'monthly' : 'daily';
	const referenceDate =
		searchParams.get('date') ?? new Date().toISOString().slice(0, 10);

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				setIsLoading(true);
				setErrorMessage('');
				const org = await getCurrentOrgContext();
				const result = await fetchPatientMarSheet(org.organizationId, patientId, {
					view,
					date: referenceDate,
				});

				if (!isMounted) {
					return;
				}

				setMarSheet(result);
			} catch (error) {
				if (!isMounted) {
					return;
				}

				setErrorMessage(
					getOrgManagementError(error, 'Unable to load the MAR print view.'),
				);
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
	}, [patientId, referenceDate, view]);

	const dayChunks = useMemo(
		() => (marSheet ? chunkDays(marSheet.days, marSheet.view) : []),
		[marSheet],
	);

	return (
		<div className='min-h-screen bg-slate-100 px-4 py-6 print:bg-white print:px-0 print:py-0'>
			<style jsx global>{`
				@media print {
					@page {
						size: landscape;
						margin: 10mm;
					}
				}
			`}</style>

			<div className='mx-auto max-w-7xl space-y-6 print:max-w-none print:space-y-0'>
				<div className='flex flex-wrap items-center justify-between gap-3 print:hidden'>
					<div className='flex items-center gap-3'>
						<Link
							href={`/dashboard/patients/${patientId}/medications`}
							className='inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-white'>
							<ArrowLeft className='mr-2 size-4' aria-hidden='true' />
							Back to medications
						</Link>
						<div>
							<h1 className='text-xl font-bold text-foreground'>MAR print view</h1>
							<p className='text-sm text-slate-600'>
								Only the medication administration record is shown here for printing.
							</p>
						</div>
					</div>
					<Button type='button' className='gap-2' onClick={() => window.print()}>
						<Printer className='size-4' aria-hidden='true' />
						Print / Save as PDF
					</Button>
				</div>

				{isLoading ? (
					<div className='rounded-3xl border border-border bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none'>
						<p className='text-sm text-slate-500'>Loading MAR...</p>
					</div>
				) : errorMessage ? (
					<div className='rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-medium text-red-700 print:rounded-none print:border-0 print:bg-white print:p-0'>
						{errorMessage}
					</div>
				) : marSheet ? (
					<div className='space-y-6'>
						{dayChunks.map((days, index) => (
							<section
								key={days[0]?.key ?? index}
								className='rounded-3xl border border-border bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none'
								style={
									index < dayChunks.length - 1
										? { breakAfter: 'page' as const }
										: undefined
								}>
								<div className='mb-6 border-b border-slate-200 pb-5'>
									<div className='flex flex-wrap items-start justify-between gap-4'>
										<div>
											<p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>
												Medication Administration Record
											</p>
											<h2 className='mt-2 text-2xl font-bold text-slate-900'>
												{marSheet.patient.firstName} {marSheet.patient.lastName}
											</h2>
											<p className='mt-2 text-sm text-slate-600'>
												{marSheet.view === 'daily' ? 'Daily MAR' : 'Monthly MAR'} |{' '}
												{formatReferenceLabel(marSheet)}
											</p>
										</div>
										<div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600'>
											<p className='font-semibold text-slate-900'>
												Page {index + 1} of {dayChunks.length}
											</p>
											<p className='mt-1'>
												{days[0]?.label} to {days[days.length - 1]?.label}
											</p>
										</div>
									</div>
								</div>

								<div className='mb-4 flex flex-wrap gap-2'>
									{(['GIVEN', 'MISSED', 'REFUSED', 'NA', 'DUE'] as MedicationAdministrationResult[]).map(
										(status) => (
											<span
												key={status}
												className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cellClassName(
													status,
												)}`}>
												{cellLabel(status)}
											</span>
										),
									)}
								</div>

								<PrintTable rows={marSheet.rows} days={days} />
							</section>
						))}
					</div>
				) : null}
			</div>
		</div>
	);
}
