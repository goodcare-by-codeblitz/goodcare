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
	createMedication,
	createMedicationAdministration,
	deleteMedication,
	fetchMedications,
	fetchPatient,
	fetchPatientMarSheet,
	getCurrentOrgContext,
	getOrgManagementError,
	hasOrgPermission,
	updateMedication,
	type MedicationAdministrationRecord,
	type MedicationAdministrationResult,
	type MedicationMarCellStatus,
	type MedicationMarSheet,
	type MedicationRecord,
	type MedicationScheduleSlot,
	type MedicationStatus,
	type OrgContext,
	type PatientDetail,
} from '@/lib/org-management';
import { ArrowLeft, ChevronRight, Pill, Printer, TableProperties } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';

type MedicationForm = {
	name: string;
	doseAmount: string;
	doseUnit: string;
	route: string;
	frequency: string;
	morning: boolean;
	noon: boolean;
	evening: boolean;
	night: boolean;
	bedtime: boolean;
	startDate: string;
	endDate: string;
	prescriber: string;
	instructions: string;
	status: MedicationStatus;
	prnIndication: string;
	prnMaxDose: string;
};

type AdministrationForm = {
	result: MedicationAdministrationResult;
	slot: MedicationScheduleSlot;
	scheduledFor: string;
	administeredAt: string;
	notes: string;
};

const textAreaClassName =
	'min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50';

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

const slotDefaultTimes: Record<MedicationScheduleSlot, string> = {
	morning: '08:00',
	noon: '12:00',
	evening: '18:00',
	night: '21:00',
	bedtime: '22:30',
};

function emptyMedicationForm(): MedicationForm {
	return {
		name: '',
		doseAmount: '',
		doseUnit: 'mg',
		route: 'Oral',
		frequency: 'Once daily',
		morning: true,
		noon: false,
		evening: false,
		night: false,
		bedtime: false,
		startDate: '',
		endDate: '',
		prescriber: '',
		instructions: '',
		status: 'ACTIVE',
		prnIndication: '',
		prnMaxDose: '',
	};
}

function toMedicationForm(medication: MedicationRecord): MedicationForm {
	return {
		name: medication.name,
		doseAmount: medication.doseAmount,
		doseUnit: medication.doseUnit,
		route: medication.route,
		frequency: medication.frequency,
		morning: medication.schedule.morning,
		noon: medication.schedule.noon,
		evening: medication.schedule.evening,
		night: medication.schedule.night,
		bedtime: medication.schedule.bedtime,
		startDate: medication.startDate.slice(0, 10),
		endDate: medication.endDate ? medication.endDate.slice(0, 10) : '',
		prescriber: medication.prescriber,
		instructions: medication.instructions,
		status: medication.status,
		prnIndication: medication.prnIndication ?? '',
		prnMaxDose: medication.prnMaxDose ?? '',
	};
}

function emptyAdministrationForm(referenceDate?: string): AdministrationForm {
	return {
		result: 'GIVEN',
		slot: 'morning',
		scheduledFor: referenceDate ? `${referenceDate}T08:00` : '',
		administeredAt: '',
		notes: '',
	};
}

function formatDate(date: string) {
	return new Date(date).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

function formatDateTime(date: string | null) {
	if (!date) {
		return 'Not recorded';
	}

	return new Date(date).toLocaleString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

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

function administrationTitle(administration: MedicationAdministrationRecord | null) {
	if (!administration) {
		return '';
	}

	return `Updated ${formatDateTime(administration.administeredAt ?? administration.scheduledFor ?? administration.createdAt)}`;
}

export default function PatientMedicationsPage({
	params,
}: {
	params: Promise<{ patientId: string }>;
}) {
	const { patientId } = use(params);
	const [orgContext, setOrgContext] = useState<OrgContext | null>(null);
	const [patient, setPatient] = useState<PatientDetail | null>(null);
	const [medications, setMedications] = useState<MedicationRecord[]>([]);
	const [marSheet, setMarSheet] = useState<MedicationMarSheet | null>(null);
	const [selectedMedicationId, setSelectedMedicationId] = useState<string>('new');
	const [medicationForm, setMedicationForm] = useState<MedicationForm>(emptyMedicationForm());
	const [administrationForm, setAdministrationForm] = useState<AdministrationForm>(
		emptyAdministrationForm(new Date().toISOString().slice(0, 10)),
	);
	const [marView, setMarView] = useState<'daily' | 'monthly'>('daily');
	const [marDate, setMarDate] = useState(new Date().toISOString().slice(0, 10));
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	const selectedMedication =
		selectedMedicationId === 'new'
			? null
			: medications.find((medication) => medication.id === selectedMedicationId) ?? null;

	const canManageMedications = orgContext
		? hasOrgPermission(orgContext, 'manage_medications')
		: false;
	const canAdministerMedications = orgContext
		? hasOrgPermission(orgContext, 'administer_medications')
		: false;

	const loadMedication = (medicationId: string, nextMedications?: MedicationRecord[]) => {
		const medicationPool = nextMedications ?? medications;
		if (medicationId === 'new') {
			setSelectedMedicationId('new');
			setMedicationForm(emptyMedicationForm());
			setAdministrationForm(emptyAdministrationForm(marDate));
			return;
		}

		const medication = medicationPool.find((entry) => entry.id === medicationId);
		if (!medication) {
			return;
		}

		setSelectedMedicationId(medicationId);
		setMedicationForm(toMedicationForm(medication));
		setAdministrationForm((current) => ({
			...current,
			slot: scheduleSlots.find((slot) => medication.schedule[slot]) ?? 'morning',
		}));
	};

	const refreshData = async (contextOverride?: OrgContext) => {
		const context = contextOverride ?? orgContext;
		if (!context) {
			return { medications: [] as MedicationRecord[], mar: null as MedicationMarSheet | null };
		}

		const [patientRecord, medicationResult, marResult] = await Promise.all([
			fetchPatient(context.organizationId, patientId),
			fetchMedications(context.organizationId, {
				patientId,
				page: 1,
				limit: 100,
			}),
			fetchPatientMarSheet(context.organizationId, patientId, {
				view: marView,
				date: marDate,
			}),
		]);

		setPatient(patientRecord);
		setMedications(medicationResult.medications);
		setMarSheet(marResult);

		return { medications: medicationResult.medications, mar: marResult };
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
				if (!hasOrgPermission(context, 'view_medications')) {
					setErrorMessage('You do not have permission to view medications.');
					return;
				}

				const result = await refreshData(context);
				if (!isMounted) {
					return;
				}

				if (result.medications.length > 0) {
					loadMedication(result.medications[0].id, result.medications);
				}
			} catch (error) {
				if (isMounted) {
					setErrorMessage(
						getOrgManagementError(error, 'Unable to load the patient medication workflow.'),
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
	}, [marDate, marView, patientId]);

	const handleSaveMedication = async () => {
		if (!orgContext || !canManageMedications) {
			return;
		}

		try {
			setIsSaving(true);
			setErrorMessage('');
			setSuccessMessage('');

			if (selectedMedication) {
				await updateMedication(orgContext.organizationId, patientId, selectedMedication.id, {
					name: medicationForm.name.trim(),
					doseAmount: medicationForm.doseAmount.trim(),
					doseUnit: medicationForm.doseUnit.trim(),
					route: medicationForm.route.trim(),
					frequency: medicationForm.frequency.trim(),
					schedule: {
						morning: medicationForm.morning,
						noon: medicationForm.noon,
						evening: medicationForm.evening,
						night: medicationForm.night,
						bedtime: medicationForm.bedtime,
					},
					startDate: medicationForm.startDate,
					endDate: medicationForm.endDate || undefined,
					prescriber: medicationForm.prescriber.trim(),
					instructions: medicationForm.instructions.trim(),
					status: medicationForm.status,
					prnIndication: medicationForm.prnIndication.trim() || undefined,
					prnMaxDose: medicationForm.prnMaxDose.trim() || undefined,
				});
			} else {
				const created = await createMedication(orgContext.organizationId, patientId, {
					name: medicationForm.name.trim(),
					doseAmount: medicationForm.doseAmount.trim(),
					doseUnit: medicationForm.doseUnit.trim(),
					route: medicationForm.route.trim(),
					frequency: medicationForm.frequency.trim(),
					schedule: {
						morning: medicationForm.morning,
						noon: medicationForm.noon,
						evening: medicationForm.evening,
						night: medicationForm.night,
						bedtime: medicationForm.bedtime,
					},
					startDate: medicationForm.startDate,
					endDate: medicationForm.endDate || undefined,
					prescriber: medicationForm.prescriber.trim(),
					instructions: medicationForm.instructions.trim(),
					status: medicationForm.status,
					prnIndication: medicationForm.prnIndication.trim() || undefined,
					prnMaxDose: medicationForm.prnMaxDose.trim() || undefined,
				});
				const refreshed = await refreshData(orgContext);
				loadMedication(created.id, refreshed.medications);
				setSuccessMessage('Medication created.');
				return;
			}

			const refreshed = await refreshData(orgContext);
			if (selectedMedication) {
				loadMedication(selectedMedication.id, refreshed.medications);
			}
			setSuccessMessage('Medication updated.');
		} catch (error) {
			setErrorMessage(getOrgManagementError(error, 'Unable to save this medication.'));
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteMedication = async () => {
		if (!orgContext || !selectedMedication || !canManageMedications) {
			return;
		}

		try {
			setIsSaving(true);
			await deleteMedication(orgContext.organizationId, patientId, selectedMedication.id);
			const refreshed = await refreshData(orgContext);
			if (refreshed.medications[0]) {
				loadMedication(refreshed.medications[0].id, refreshed.medications);
			} else {
				loadMedication('new', refreshed.medications);
			}
			setSuccessMessage('Medication deleted.');
		} catch (error) {
			setErrorMessage(getOrgManagementError(error, 'Unable to delete this medication.'));
		} finally {
			setIsSaving(false);
		}
	};

	const handleLogAdministration = async () => {
		if (!orgContext || !selectedMedication || !canAdministerMedications) {
			return;
		}

		try {
			setIsSaving(true);
			setErrorMessage('');
			await createMedicationAdministration(
				orgContext.organizationId,
				patientId,
				selectedMedication.id,
				{
					result: administrationForm.result,
					slot: administrationForm.slot,
					scheduledFor: administrationForm.scheduledFor
						? new Date(administrationForm.scheduledFor).toISOString()
						: undefined,
					administeredAt: administrationForm.administeredAt
						? new Date(administrationForm.administeredAt).toISOString()
						: undefined,
					notes: administrationForm.notes.trim() || undefined,
				},
			);
			await refreshData(orgContext);
			setAdministrationForm(emptyAdministrationForm(marDate));
			setSuccessMessage('Administration logged and MAR updated.');
		} catch (error) {
			setErrorMessage(
				getOrgManagementError(error, 'Unable to log this administration.'),
			);
		} finally {
			setIsSaving(false);
		}
	};

	const prefillAdministrationFromCell = (
		medicationId: string,
		dayKey: string,
		slot: MedicationScheduleSlot,
	) => {
		loadMedication(medicationId);
		setAdministrationForm({
			result: 'GIVEN',
			slot,
			scheduledFor: `${dayKey}T${slotDefaultTimes[slot]}`,
			administeredAt: '',
			notes: '',
		});
		setSuccessMessage(`Prepared ${slotLabels[slot]} administration entry.`);
	};

	if (isLoading) {
		return (
			<BoundingBox className='max-w-7xl'>
				<p className='text-sm text-slate-500'>Loading medications...</p>
			</BoundingBox>
		);
	}

	if (!patient || !orgContext || !hasOrgPermission(orgContext, 'view_medications')) {
		return (
			<BoundingBox className='max-w-5xl'>
				<p className='text-sm font-semibold text-foreground'>
					{errorMessage || 'Medications are not available for this patient.'}
				</p>
				<Link
					href={`/dashboard/patients/${patientId}`}
					className='mt-3 inline-flex text-sm font-semibold text-care-blue hover:underline'>
					Back to patient
				</Link>
			</BoundingBox>
		);
	}

	return (
		<BoundingBox className='max-w-7xl'>
			<nav aria-label='Breadcrumb' className='mb-6 print:hidden'>
				<ol className='flex items-center gap-1.5 text-sm'>
					<li>
						<Link href='/dashboard/patients' className='font-medium text-slate-500 hover:text-care-blue'>
							Patients
						</Link>
					</li>
					<li aria-hidden='true'>
						<ChevronRight className='size-3.5 text-slate-400' />
					</li>
					<li>
						<Link href={`/dashboard/patients/${patient.id}`} className='font-medium text-slate-500 hover:text-care-blue'>
							{patient.firstName} {patient.lastName}
						</Link>
					</li>
					<li aria-hidden='true'>
						<ChevronRight className='size-3.5 text-slate-400' />
					</li>
					<li className='font-semibold text-foreground'>Medication & MAR</li>
				</ol>
			</nav>

			<div className='mb-8 flex flex-wrap items-center justify-between gap-4 print:mb-4'>
				<div className='flex items-start gap-3'>
					<Link
						href={`/dashboard/patients/${patient.id}`}
						className='flex size-9 items-center justify-center rounded-lg border border-border text-slate-500 hover:bg-muted hover:text-foreground print:hidden'
						aria-label='Back to patient'>
						<ArrowLeft className='size-4' />
					</Link>
					<div>
						<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
							Medication and MAR for {patient.firstName} {patient.lastName}
						</h1>
						<p className='mt-2 text-sm text-slate-600 print:mt-1'>
							Manage medication orders, log administrations, and keep a live daily or
							monthly digital MAR sheet for this patient.
						</p>
					</div>
				</div>
				<Button
					type='button'
					variant='outline'
					className='print:hidden'
					onClick={() =>
						window.open(
							`/dashboard/patients/${patient.id}/medications/mar/print?view=${marView}&date=${marDate}`,
							'_blank',
							'noopener,noreferrer',
						)
					}>
					<Printer className='size-4' />
					Print MAR
				</Button>
			</div>

			<div className='mb-5 min-h-5 print:hidden'>
				{errorMessage ? <p className='text-sm font-medium text-red-600'>{errorMessage}</p> : null}
				{successMessage ? <p className='text-sm font-medium text-green-600'>{successMessage}</p> : null}
			</div>

			<div className='grid gap-6 xl:grid-cols-[19rem_minmax(0,1fr)] print:block'>
				<section className='rounded-2xl border border-border bg-white shadow-sm print:hidden'>
					<div className='flex items-center justify-between border-b border-border px-5 py-4'>
						<div>
							<h2 className='font-heading text-base font-bold text-foreground'>Medication orders</h2>
							<p className='mt-1 text-sm text-slate-600'>{medications.length} saved orders</p>
						</div>
						{canManageMedications ? (
							<Button type='button' variant='outline' size='sm' onClick={() => loadMedication('new')}>
								New
							</Button>
						) : null}
					</div>
					<div className='space-y-2 p-3'>
						{medications.map((medication) => (
							<button
								key={medication.id}
								type='button'
								onClick={() => loadMedication(medication.id)}
								className={`w-full rounded-xl border px-4 py-3 text-left ${
									selectedMedicationId === medication.id
										? 'border-care-blue bg-care-blue-light/40'
										: 'border-border hover:bg-slate-50'
								}`}>
								<p className='text-sm font-semibold text-foreground'>{medication.name}</p>
								<p className='mt-1 text-sm text-slate-600'>
									{medication.doseAmount} {medication.doseUnit} · {medication.route}
								</p>
								<p className='mt-2 text-xs font-medium uppercase tracking-wide text-slate-400'>
									{medication.status} · Started {formatDate(medication.startDate)}
								</p>
							</button>
						))}
						{medications.length === 0 ? (
							<p className='px-2 py-4 text-sm text-slate-500'>No medication orders yet.</p>
						) : null}
					</div>
				</section>

				<div className='space-y-6 print:space-y-4'>
					<section className='rounded-2xl border border-border bg-white shadow-sm print:hidden'>
						<div className='border-b border-border px-6 py-5'>
							<h2 className='font-heading text-base font-bold text-foreground'>
								{selectedMedication ? selectedMedication.name : 'New medication'}
							</h2>
							<p className='mt-1 text-sm text-slate-600'>
								Medication orders stay patient-scoped, while the MAR sheet below reflects the live administration state.
							</p>
						</div>
						<div className='grid gap-5 px-6 py-6 md:grid-cols-2'>
							<div className='space-y-2'>
								<Label htmlFor='medicationName'>Medication name</Label>
								<Input
									id='medicationName'
									disabled={!canManageMedications}
									value={medicationForm.name}
									onChange={(event) =>
										setMedicationForm((current) => ({ ...current, name: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='status'>Status</Label>
								<NativeSelect
									id='status'
									className='w-full'
									disabled={!canManageMedications}
									value={medicationForm.status}
									onChange={(event) =>
										setMedicationForm((current) => ({
											...current,
											status: event.target.value as MedicationStatus,
										}))
									}>
									<NativeSelectOption value='ACTIVE'>Active</NativeSelectOption>
									<NativeSelectOption value='PRN'>PRN</NativeSelectOption>
									<NativeSelectOption value='DISCONTINUED'>Discontinued</NativeSelectOption>
								</NativeSelect>
							</div>
							<div className='space-y-2'>
								<Label>Dose amount</Label>
								<Input
									disabled={!canManageMedications}
									value={medicationForm.doseAmount}
									onChange={(event) =>
										setMedicationForm((current) => ({ ...current, doseAmount: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label>Dose unit</Label>
								<Input
									disabled={!canManageMedications}
									value={medicationForm.doseUnit}
									onChange={(event) =>
										setMedicationForm((current) => ({ ...current, doseUnit: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label>Route</Label>
								<Input
									disabled={!canManageMedications}
									value={medicationForm.route}
									onChange={(event) =>
										setMedicationForm((current) => ({ ...current, route: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label>Frequency</Label>
								<Input
									disabled={!canManageMedications}
									value={medicationForm.frequency}
									onChange={(event) =>
										setMedicationForm((current) => ({ ...current, frequency: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label>Start date</Label>
								<Input
									type='date'
									disabled={!canManageMedications}
									value={medicationForm.startDate}
									onChange={(event) =>
										setMedicationForm((current) => ({ ...current, startDate: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label>End date</Label>
								<Input
									type='date'
									disabled={!canManageMedications}
									value={medicationForm.endDate}
									onChange={(event) =>
										setMedicationForm((current) => ({ ...current, endDate: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2 md:col-span-2'>
								<Label>Prescriber</Label>
								<Input
									disabled={!canManageMedications}
									value={medicationForm.prescriber}
									onChange={(event) =>
										setMedicationForm((current) => ({ ...current, prescriber: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2 md:col-span-2'>
								<Label>Instructions</Label>
								<textarea
									className={textAreaClassName}
									disabled={!canManageMedications}
									value={medicationForm.instructions}
									onChange={(event) =>
										setMedicationForm((current) => ({ ...current, instructions: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2 md:col-span-2'>
								<Label>Schedule</Label>
								<div className='flex flex-wrap gap-4 rounded-xl border border-border px-4 py-3'>
									{scheduleSlots.map((slot) => (
										<label key={slot} className='inline-flex items-center gap-2 text-sm text-slate-700'>
											<input
												type='checkbox'
												disabled={!canManageMedications}
												checked={medicationForm[slot]}
												onChange={(event) =>
													setMedicationForm((current) => ({
														...current,
														[slot]: event.target.checked,
													}))
												}
											/>
											{slotLabels[slot]}
										</label>
									))}
								</div>
							</div>
							<div className='space-y-2'>
								<Label>PRN indication</Label>
								<Input
									disabled={!canManageMedications}
									value={medicationForm.prnIndication}
									onChange={(event) =>
										setMedicationForm((current) => ({ ...current, prnIndication: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label>PRN max dose</Label>
								<Input
									disabled={!canManageMedications}
									value={medicationForm.prnMaxDose}
									onChange={(event) =>
										setMedicationForm((current) => ({ ...current, prnMaxDose: event.target.value }))
									}
								/>
							</div>
						</div>
						<div className='flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4'>
							{selectedMedication && canManageMedications ? (
								<Button type='button' variant='destructive' onClick={handleDeleteMedication} disabled={isSaving}>
									Delete medication
								</Button>
							) : null}
							{canManageMedications ? (
								<Button type='button' onClick={handleSaveMedication} disabled={isSaving}>
									{isSaving ? 'Saving...' : selectedMedication ? 'Save medication' : 'Create medication'}
								</Button>
							) : null}
						</div>
					</section>

					<section className='rounded-2xl border border-border bg-white shadow-sm print:border-0 print:shadow-none'>
						<div className='border-b border-border px-6 py-5 print:px-0'>
							<div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
								<div>
									<div className='flex items-center gap-2'>
										<TableProperties className='size-4 text-care-blue' />
										<h2 className='font-heading text-base font-bold text-foreground'>Digital MAR sheet</h2>
									</div>
									<p className='mt-1 text-sm text-slate-600 print:hidden'>
										Click any scheduled MAR cell to prefill the administration form for that medication and slot.
									</p>
								</div>
								<div className='flex flex-wrap items-center gap-3 print:hidden'>
									<div className='flex rounded-lg border border-border p-1'>
										<button
											type='button'
											onClick={() => setMarView('daily')}
											className={`rounded-md px-3 py-1.5 text-sm font-medium ${
												marView === 'daily' ? 'bg-care-blue text-white' : 'text-slate-600'
											}`}>
											Daily
										</button>
										<button
											type='button'
											onClick={() => setMarView('monthly')}
											className={`rounded-md px-3 py-1.5 text-sm font-medium ${
												marView === 'monthly' ? 'bg-care-blue text-white' : 'text-slate-600'
											}`}>
											Monthly
										</button>
									</div>
									{marView === 'daily' ? (
										<Input
											type='date'
											value={marDate}
											onChange={(event) => setMarDate(event.target.value)}
											className='w-[12rem]'
										/>
									) : (
										<Input
											type='month'
											value={marDate.slice(0, 7)}
											onChange={(event) => setMarDate(`${event.target.value}-01`)}
											className='w-[12rem]'
										/>
									)}
								</div>
							</div>
						</div>

						<div className='overflow-auto px-6 py-6 print:px-0 print:py-4'>
							<table className='min-w-full border-separate border-spacing-0'>
								<thead>
									<tr>
										<th
											rowSpan={2}
											className='sticky left-0 z-20 border border-border bg-white px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 print:static'>
											Medication
										</th>
										{marSheet?.days.map((day) => (
											<th
												key={day.key}
												colSpan={scheduleSlots.length}
												className='border border-border bg-slate-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500'>
												{day.label}
											</th>
										))}
									</tr>
									<tr>
										{marSheet?.days.flatMap((day) =>
											scheduleSlots.map((slot) => (
												<th
													key={`${day.key}-${slot}`}
													className='border border-border bg-white px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500'>
													{slotLabels[slot]}
												</th>
											)),
										)}
									</tr>
								</thead>
								<tbody>
									{marSheet?.rows.map((row) => (
										<tr key={row.medication.id}>
											<td className='sticky left-0 z-10 border border-border bg-white px-4 py-3 align-top print:static'>
												<p className='text-sm font-semibold text-foreground'>{row.medication.name}</p>
												<p className='mt-1 text-xs text-slate-500'>
													{row.medication.doseAmount} {row.medication.doseUnit} · {row.medication.route}
												</p>
											</td>
											{marSheet.days.flatMap((day) =>
												scheduleSlots.map((slot) => {
													const cell = row.cells[day.key]?.[slot];
													return (
														<td key={`${row.medication.id}-${day.key}-${slot}`} className='border border-border p-1.5'>
															<button
																type='button'
																title={administrationTitle(cell?.administration ?? null)}
																disabled={
																	!canAdministerMedications || cell?.status === 'NOT_SCHEDULED'
																}
																onClick={() =>
																	prefillAdministrationFromCell(row.medication.id, day.key, slot)
																}
																className={`flex min-h-16 w-full flex-col items-center justify-center rounded-lg border px-2 py-2 text-center text-xs font-semibold transition-colors ${
																	cellClassName(cell?.status ?? 'NOT_SCHEDULED')
																} ${
																	canAdministerMedications && cell?.status !== 'NOT_SCHEDULED'
																		? 'hover:ring-2 hover:ring-care-blue/25'
																		: ''
																}`}>
																<span>{cellLabel(cell?.status ?? 'NOT_SCHEDULED')}</span>
																{cell?.administration?.actorUser ? (
																	<span className='mt-1 text-[10px] font-normal text-slate-500'>
																		{cell.administration.actorUser.firstName[0]}
																		{cell.administration.actorUser.lastName[0]}
																	</span>
																) : null}
															</button>
														</td>
													);
												}),
											)}
										</tr>
									))}
								</tbody>
							</table>
							{marSheet?.rows.length === 0 ? (
								<div className='px-2 py-10 text-sm text-slate-500'>
									No medication orders are active for this MAR range.
								</div>
							) : null}
						</div>
					</section>

					<div className='grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] print:hidden'>
						<section className='rounded-2xl border border-border bg-white shadow-sm'>
							<div className='border-b border-border px-6 py-5'>
								<div className='flex items-center gap-2'>
									<Pill className='size-4 text-care-blue' />
									<h2 className='font-heading text-base font-bold text-foreground'>Log administration</h2>
								</div>
								<p className='mt-1 text-sm text-slate-600'>
									Choose a medication and slot, or click a scheduled MAR cell to prefill this form.
								</p>
							</div>
							<div className='space-y-4 px-6 py-6'>
								<div className='space-y-2'>
									<Label>Medication</Label>
									<NativeSelect
										className='w-full'
										disabled={!canAdministerMedications}
										value={selectedMedicationId}
										onChange={(event) => loadMedication(event.target.value)}>
										<NativeSelectOption value='new'>Select a medication</NativeSelectOption>
										{medications.map((medication) => (
											<NativeSelectOption key={medication.id} value={medication.id}>
												{medication.name}
											</NativeSelectOption>
										))}
									</NativeSelect>
								</div>
								<div className='space-y-2'>
									<Label>Result</Label>
									<NativeSelect
										className='w-full'
										disabled={!canAdministerMedications || !selectedMedication}
										value={administrationForm.result}
										onChange={(event) =>
											setAdministrationForm((current) => ({
												...current,
												result: event.target.value as MedicationAdministrationResult,
											}))
										}>
										<NativeSelectOption value='GIVEN'>Given</NativeSelectOption>
										<NativeSelectOption value='MISSED'>Missed</NativeSelectOption>
										<NativeSelectOption value='REFUSED'>Refused</NativeSelectOption>
										<NativeSelectOption value='NA'>N/A</NativeSelectOption>
									</NativeSelect>
								</div>
								<div className='space-y-2'>
									<Label>MAR slot</Label>
									<NativeSelect
										className='w-full'
										disabled={!canAdministerMedications || !selectedMedication}
										value={administrationForm.slot}
										onChange={(event) =>
											setAdministrationForm((current) => ({
												...current,
												slot: event.target.value as MedicationScheduleSlot,
											}))
										}>
										{scheduleSlots.map((slot) => (
											<NativeSelectOption key={slot} value={slot}>
												{slotLabels[slot]}
											</NativeSelectOption>
										))}
									</NativeSelect>
								</div>
								<div className='space-y-2'>
									<Label>Scheduled for</Label>
									<Input
										type='datetime-local'
										disabled={!canAdministerMedications || !selectedMedication}
										value={administrationForm.scheduledFor}
										onChange={(event) =>
											setAdministrationForm((current) => ({
												...current,
												scheduledFor: event.target.value,
											}))
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label>Administered at</Label>
									<Input
										type='datetime-local'
										disabled={!canAdministerMedications || !selectedMedication}
										value={administrationForm.administeredAt}
										onChange={(event) =>
											setAdministrationForm((current) => ({
												...current,
												administeredAt: event.target.value,
											}))
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label>Notes</Label>
									<textarea
										className={textAreaClassName}
										disabled={!canAdministerMedications || !selectedMedication}
										value={administrationForm.notes}
										onChange={(event) =>
											setAdministrationForm((current) => ({
												...current,
												notes: event.target.value,
											}))
										}
									/>
								</div>
								{canAdministerMedications ? (
									<Button type='button' onClick={handleLogAdministration} disabled={!selectedMedication || isSaving}>
										Log administration
									</Button>
								) : null}
							</div>
						</section>

						<section className='rounded-2xl border border-border bg-white shadow-sm'>
							<div className='border-b border-border px-6 py-5'>
								<h2 className='font-heading text-base font-bold text-foreground'>Administration history</h2>
								<p className='mt-1 text-sm text-slate-600'>
									Append-only activity for the current MAR range.
								</p>
							</div>
							<div className='space-y-3 px-6 py-6'>
								{marSheet?.history.map((administration) => (
									<div key={administration.id} className='rounded-2xl border border-border p-4'>
										<div className='flex flex-wrap items-center justify-between gap-3'>
											<p className='text-sm font-semibold text-foreground'>
												{administration.result}{' '}
												{administration.slot ? `· ${slotLabels[administration.slot]}` : ''}
											</p>
											<p className='text-xs text-slate-500'>
												{formatDateTime(
													administration.administeredAt ??
														administration.scheduledFor ??
														administration.createdAt,
												)}
											</p>
										</div>
										{administration.actorUser ? (
											<p className='mt-2 text-xs text-slate-400'>
												Logged by {administration.actorUser.firstName}{' '}
												{administration.actorUser.lastName}
											</p>
										) : null}
										{administration.notes ? (
											<p className='mt-2 text-sm text-slate-600'>{administration.notes}</p>
										) : null}
									</div>
								))}
								{!marSheet?.history.length ? (
									<p className='text-sm text-slate-500'>No administration records in this MAR range yet.</p>
								) : null}
							</div>
						</section>
					</div>
				</div>
			</div>
		</BoundingBox>
	);
}
