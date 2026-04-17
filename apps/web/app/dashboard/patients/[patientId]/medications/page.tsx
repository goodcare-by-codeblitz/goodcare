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
	fetchMedicationAdministrations,
	fetchMedications,
	fetchPatient,
	getCurrentOrgContext,
	getOrgManagementError,
	hasOrgPermission,
	updateMedication,
	type MedicationAdministrationRecord,
	type MedicationAdministrationResult,
	type MedicationRecord,
	type MedicationStatus,
	type OrgContext,
	type PatientDetail,
} from '@/lib/org-management';
import { ArrowLeft, ChevronRight, Pill, Plus } from 'lucide-react';
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
	scheduledFor: string;
	administeredAt: string;
	notes: string;
};

const textAreaClassName =
	'min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50';

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

function emptyAdministrationForm(): AdministrationForm {
	return {
		result: 'GIVEN',
		scheduledFor: '',
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

export default function PatientMedicationsPage({
	params,
}: {
	params: Promise<{ patientId: string }>;
}) {
	const { patientId } = use(params);
	const [orgContext, setOrgContext] = useState<OrgContext | null>(null);
	const [patient, setPatient] = useState<PatientDetail | null>(null);
	const [medications, setMedications] = useState<MedicationRecord[]>([]);
	const [selectedMedicationId, setSelectedMedicationId] = useState<string>('new');
	const [medicationForm, setMedicationForm] = useState<MedicationForm>(emptyMedicationForm());
	const [administrations, setAdministrations] = useState<MedicationAdministrationRecord[]>([]);
	const [administrationForm, setAdministrationForm] = useState<AdministrationForm>(emptyAdministrationForm());
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
				if (!hasOrgPermission(context, 'view_medications')) {
					setErrorMessage('You do not have permission to view medications.');
					return;
				}

				const [patientRecord, medicationResult] = await Promise.all([
					fetchPatient(context.organizationId, patientId),
					fetchMedications(context.organizationId, {
						patientId,
						page: 1,
						limit: 100,
					}),
				]);

				if (!isMounted) {
					return;
				}

				setPatient(patientRecord);
				setMedications(medicationResult.medications);
				if (medicationResult.medications.length > 0) {
					const firstMedication = medicationResult.medications[0];
					setSelectedMedicationId(firstMedication.id);
					setMedicationForm(toMedicationForm(firstMedication));
					const administrationResult = await fetchMedicationAdministrations(
						context.organizationId,
						patientId,
						firstMedication.id,
					);
					if (!isMounted) {
						return;
					}
					setAdministrations(administrationResult.administrations);
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
	}, [patientId]);

	const canManageMedications = orgContext
		? hasOrgPermission(orgContext, 'manage_medications')
		: false;
	const canAdministerMedications = orgContext
		? hasOrgPermission(orgContext, 'administer_medications')
		: false;

	const selectedMedication =
		selectedMedicationId === 'new'
			? null
			: medications.find((medication) => medication.id === selectedMedicationId) ?? null;

	const refreshMedications = async (context: OrgContext) => {
		const medicationResult = await fetchMedications(context.organizationId, {
			patientId,
			page: 1,
			limit: 100,
		});
		setMedications(medicationResult.medications);
		return medicationResult.medications;
	};

	const loadMedication = async (medicationId: string) => {
		if (medicationId === 'new') {
			setSelectedMedicationId('new');
			setMedicationForm(emptyMedicationForm());
			setAdministrations([]);
			return;
		}

		if (!orgContext) {
			return;
		}

		const medication = medications.find((entry) => entry.id === medicationId);
		if (!medication) {
			return;
		}

		setSelectedMedicationId(medicationId);
		setMedicationForm(toMedicationForm(medication));
		const administrationResult = await fetchMedicationAdministrations(
			orgContext.organizationId,
			patientId,
			medicationId,
		);
		setAdministrations(administrationResult.administrations);
	};

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
				await createMedication(orgContext.organizationId, patientId, {
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
			}

			const nextMedications = await refreshMedications(orgContext);
			if (selectedMedication) {
				await loadMedication(selectedMedication.id);
			} else if (nextMedications[0]) {
				await loadMedication(nextMedications[0].id);
			}

			setSuccessMessage(selectedMedication ? 'Medication updated.' : 'Medication created.');
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
			await refreshMedications(orgContext);
			setSelectedMedicationId('new');
			setMedicationForm(emptyMedicationForm());
			setAdministrations([]);
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
			await createMedicationAdministration(
				orgContext.organizationId,
				patientId,
				selectedMedication.id,
				{
					result: administrationForm.result,
					scheduledFor: administrationForm.scheduledFor
						? new Date(administrationForm.scheduledFor).toISOString()
						: undefined,
					administeredAt: administrationForm.administeredAt
						? new Date(administrationForm.administeredAt).toISOString()
						: undefined,
					notes: administrationForm.notes.trim() || undefined,
				},
			);
			const administrationResult = await fetchMedicationAdministrations(
				orgContext.organizationId,
				patientId,
				selectedMedication.id,
			);
			setAdministrations(administrationResult.administrations);
			setAdministrationForm(emptyAdministrationForm());
			setSuccessMessage('Administration logged.');
		} catch (error) {
			setErrorMessage(
				getOrgManagementError(error, 'Unable to log this administration.'),
			);
		} finally {
			setIsSaving(false);
		}
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
				<Link href={`/dashboard/patients/${patientId}`} className='mt-3 inline-flex text-sm font-semibold text-care-blue hover:underline'>
					Back to patient
				</Link>
			</BoundingBox>
		);
	}

	return (
		<BoundingBox className='max-w-7xl'>
			<nav aria-label='Breadcrumb' className='mb-6'>
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
					<li className='font-semibold text-foreground'>Medications</li>
				</ol>
			</nav>

			<div className='mb-8 flex flex-wrap items-center gap-3'>
				<Link
					href={`/dashboard/patients/${patient.id}`}
					className='flex size-9 items-center justify-center rounded-lg border border-border text-slate-500 hover:bg-muted hover:text-foreground'
					aria-label='Back to patient'>
					<ArrowLeft className='size-4' />
				</Link>
				<div>
					<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
						Medication for {patient.firstName} {patient.lastName}
					</h1>
					<p className='mt-2 text-sm text-slate-600'>
						Maintain the patient medication orders and record administration activity.
					</p>
				</div>
			</div>

			<div className='mb-5 min-h-5'>
				{errorMessage ? <p className='text-sm font-medium text-red-600'>{errorMessage}</p> : null}
				{successMessage ? <p className='text-sm font-medium text-green-600'>{successMessage}</p> : null}
			</div>

			<div className='grid gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]'>
				<section className='rounded-2xl border border-border bg-white shadow-sm'>
					<div className='flex items-center justify-between border-b border-border px-5 py-4'>
						<div>
							<h2 className='font-heading text-base font-bold text-foreground'>Medication orders</h2>
							<p className='mt-1 text-sm text-slate-600'>{medications.length} saved orders</p>
						</div>
						{canManageMedications ? (
							<Button type='button' variant='outline' size='sm' onClick={() => void loadMedication('new')}>
								<Plus className='size-4' />
								New
							</Button>
						) : null}
					</div>
					<div className='space-y-2 p-3'>
						{medications.map((medication) => (
							<button
								key={medication.id}
								type='button'
								onClick={() => void loadMedication(medication.id)}
								className={`w-full rounded-xl border px-4 py-3 text-left ${
									selectedMedicationId === medication.id
										? 'border-care-blue bg-care-blue-light/40'
										: 'border-border hover:bg-slate-50'
								}`}>
								<p className='text-sm font-semibold text-foreground'>{medication.name}</p>
								<p className='mt-1 text-sm text-slate-600'>
									{medication.doseAmount} {medication.doseUnit} • {medication.route}
								</p>
								<p className='mt-2 text-xs font-medium uppercase tracking-wide text-slate-400'>
									{medication.status} • Started {formatDate(medication.startDate)}
								</p>
							</button>
						))}
						{medications.length === 0 ? (
							<p className='px-2 py-4 text-sm text-slate-500'>No medication orders yet.</p>
						) : null}
					</div>
				</section>

				<div className='space-y-6'>
					<section className='rounded-2xl border border-border bg-white shadow-sm'>
						<div className='border-b border-border px-6 py-5'>
							<h2 className='font-heading text-base font-bold text-foreground'>
								{selectedMedication ? selectedMedication.name : 'New medication'}
							</h2>
							<p className='mt-1 text-sm text-slate-600'>
								Medication orders stay patient-scoped, while the top-level medication page gives the wider organization view.
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
									{(['morning', 'noon', 'evening', 'night', 'bedtime'] as const).map((slot) => (
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
											{slot}
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

					<section className='rounded-2xl border border-border bg-white shadow-sm'>
						<div className='border-b border-border px-6 py-5'>
							<div className='flex items-center gap-2'>
								<Pill className='size-4 text-care-blue' />
								<h2 className='font-heading text-base font-bold text-foreground'>Administration log</h2>
							</div>
							<p className='mt-1 text-sm text-slate-600'>
								Record medication activity without leaving the patient workflow.
							</p>
						</div>
						<div className='grid gap-5 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_20rem]'>
							<div className='space-y-3'>
								{administrations.map((administration) => (
									<div key={administration.id} className='rounded-2xl border border-border p-4'>
										<p className='text-sm font-semibold text-foreground'>
											{administration.result}
										</p>
										<p className='mt-1 text-sm text-slate-600'>
											Administered {formatDateTime(administration.administeredAt)}
										</p>
										<p className='mt-1 text-sm text-slate-500'>
											Scheduled {formatDateTime(administration.scheduledFor)}
										</p>
										{administration.actorUser ? (
											<p className='mt-2 text-xs text-slate-400'>
												Logged by {administration.actorUser.firstName} {administration.actorUser.lastName}
											</p>
										) : null}
										{administration.notes ? (
											<p className='mt-2 text-sm text-slate-600'>{administration.notes}</p>
										) : null}
									</div>
								))}
								{administrations.length === 0 ? (
									<p className='text-sm text-slate-500'>No administration records logged yet.</p>
								) : null}
							</div>
							<div className='space-y-4 rounded-2xl border border-border p-4'>
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
						</div>
					</section>
				</div>
			</div>
		</BoundingBox>
	);
}
