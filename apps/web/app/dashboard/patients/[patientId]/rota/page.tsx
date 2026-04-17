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
	assignVisitCarer,
	createVisit,
	deleteVisit,
	fetchCarers,
	fetchPatient,
	fetchVisits,
	getCurrentOrgContext,
	getOrgManagementError,
	hasOrgPermission,
	unassignVisitCarer,
	updateVisit,
	type CarerListItem,
	type OrgContext,
	type PatientDetail,
	type VisitRecord,
	type VisitStatus,
} from '@/lib/org-management';
import { ArrowLeft, CalendarClock, ChevronRight, Plus, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';

type VisitForm = {
	scheduledStart: string;
	scheduledEnd: string;
	status: VisitStatus;
	actualStart: string;
	actualEnd: string;
};

function emptyVisitForm(): VisitForm {
	return {
		scheduledStart: '',
		scheduledEnd: '',
		status: 'SCHEDULED',
		actualStart: '',
		actualEnd: '',
	};
}

function toVisitForm(visit: VisitRecord): VisitForm {
	return {
		scheduledStart: visit.scheduledStart.slice(0, 16),
		scheduledEnd: visit.scheduledEnd.slice(0, 16),
		status: visit.status,
		actualStart: visit.actualStart ? visit.actualStart.slice(0, 16) : '',
		actualEnd: visit.actualEnd ? visit.actualEnd.slice(0, 16) : '',
	};
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

export default function PatientRotaPage({
	params,
}: {
	params: Promise<{ patientId: string }>;
}) {
	const { patientId } = use(params);
	const [orgContext, setOrgContext] = useState<OrgContext | null>(null);
	const [patient, setPatient] = useState<PatientDetail | null>(null);
	const [visits, setVisits] = useState<VisitRecord[]>([]);
	const [carers, setCarers] = useState<CarerListItem[]>([]);
	const [selectedVisitId, setSelectedVisitId] = useState<string>('new');
	const [selectedCarerId, setSelectedCarerId] = useState('');
	const [visitForm, setVisitForm] = useState<VisitForm>(emptyVisitForm());
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
				if (!hasOrgPermission(context, 'view_visits')) {
					setErrorMessage('You do not have permission to view rota visits.');
					return;
				}

				const [patientRecord, visitResult, carerResult] = await Promise.all([
					fetchPatient(context.organizationId, patientId),
					fetchVisits(context.organizationId, {
						patientId,
						page: 1,
						limit: 100,
					}),
					fetchCarers(context.organizationId, {
						page: 1,
						limit: 100,
					}),
				]);

				if (!isMounted) {
					return;
				}

				setPatient(patientRecord);
				setVisits(visitResult.visits);
				setCarers(carerResult);
				if (visitResult.visits.length > 0) {
					setSelectedVisitId(visitResult.visits[0].id);
					setVisitForm(toVisitForm(visitResult.visits[0]));
				}
			} catch (error) {
				if (isMounted) {
					setErrorMessage(
						getOrgManagementError(error, 'Unable to load the patient rota workflow.'),
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

	const canManageVisits = orgContext
		? hasOrgPermission(orgContext, 'manage_visits')
		: false;
	const canAssignVisits = orgContext
		? hasOrgPermission(orgContext, 'assign_visits')
		: false;

	const selectedVisit =
		selectedVisitId === 'new'
			? null
			: visits.find((visit) => visit.id === selectedVisitId) ?? null;

	const refreshVisits = async (context: OrgContext) => {
		const visitResult = await fetchVisits(context.organizationId, {
			patientId,
			page: 1,
			limit: 100,
		});
		setVisits(visitResult.visits);
		return visitResult.visits;
	};

	const loadVisit = (visitId: string) => {
		if (visitId === 'new') {
			setSelectedVisitId('new');
			setVisitForm(emptyVisitForm());
			return;
		}

		const visit = visits.find((entry) => entry.id === visitId);
		if (!visit) {
			return;
		}

		setSelectedVisitId(visitId);
		setVisitForm(toVisitForm(visit));
	};

	const handleSaveVisit = async () => {
		if (!orgContext || !canManageVisits) {
			return;
		}

		try {
			setIsSaving(true);
			setErrorMessage('');
			setSuccessMessage('');

			if (selectedVisit) {
				await updateVisit(orgContext.organizationId, selectedVisit.id, {
					scheduledStart: new Date(visitForm.scheduledStart).toISOString(),
					scheduledEnd: new Date(visitForm.scheduledEnd).toISOString(),
					actualStart: visitForm.actualStart
						? new Date(visitForm.actualStart).toISOString()
						: undefined,
					actualEnd: visitForm.actualEnd
						? new Date(visitForm.actualEnd).toISOString()
						: undefined,
					status: visitForm.status,
				});
			} else {
				await createVisit(orgContext.organizationId, {
					patientId,
					scheduledStart: new Date(visitForm.scheduledStart).toISOString(),
					scheduledEnd: new Date(visitForm.scheduledEnd).toISOString(),
					status: visitForm.status,
				});
			}

			const nextVisits = await refreshVisits(orgContext);
			if (selectedVisit) {
				loadVisit(selectedVisit.id);
			} else if (nextVisits[0]) {
				loadVisit(nextVisits[0].id);
			}
			setSuccessMessage(selectedVisit ? 'Visit updated.' : 'Visit created.');
		} catch (error) {
			setErrorMessage(getOrgManagementError(error, 'Unable to save this visit.'));
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteVisit = async () => {
		if (!orgContext || !selectedVisit || !canManageVisits) {
			return;
		}

		try {
			setIsSaving(true);
			await deleteVisit(orgContext.organizationId, selectedVisit.id);
			await refreshVisits(orgContext);
			setSelectedVisitId('new');
			setVisitForm(emptyVisitForm());
			setSuccessMessage('Visit deleted.');
		} catch (error) {
			setErrorMessage(getOrgManagementError(error, 'Unable to delete this visit.'));
		} finally {
			setIsSaving(false);
		}
	};

	const handleAssignCarer = async () => {
		if (!orgContext || !selectedVisit || !selectedCarerId || !canAssignVisits) {
			return;
		}

		try {
			setIsSaving(true);
			await assignVisitCarer(orgContext.organizationId, selectedVisit.id, selectedCarerId);
			await refreshVisits(orgContext);
			setSelectedCarerId('');
			setSuccessMessage('Carer assigned.');
		} catch (error) {
			setErrorMessage(getOrgManagementError(error, 'Unable to assign this carer.'));
		} finally {
			setIsSaving(false);
		}
	};

	const handleUnassignCarer = async (carerId: string) => {
		if (!orgContext || !selectedVisit || !canAssignVisits) {
			return;
		}

		try {
			setIsSaving(true);
			await unassignVisitCarer(orgContext.organizationId, selectedVisit.id, carerId);
			await refreshVisits(orgContext);
			setSuccessMessage('Carer unassigned.');
		} catch (error) {
			setErrorMessage(getOrgManagementError(error, 'Unable to unassign this carer.'));
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<BoundingBox className='max-w-7xl'>
				<p className='text-sm text-slate-500'>Loading rota...</p>
			</BoundingBox>
		);
	}

	if (!patient || !orgContext || !hasOrgPermission(orgContext, 'view_visits')) {
		return (
			<BoundingBox className='max-w-5xl'>
				<p className='text-sm font-semibold text-foreground'>
					{errorMessage || 'Rota is not available for this patient.'}
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
					<li className='font-semibold text-foreground'>Rota</li>
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
						Rota for {patient.firstName} {patient.lastName}
					</h1>
					<p className='mt-2 text-sm text-slate-600'>
						Plan patient visits and keep staffing assignments close to the patient record.
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
							<h2 className='font-heading text-base font-bold text-foreground'>Visits</h2>
							<p className='mt-1 text-sm text-slate-600'>{visits.length} scheduled visits</p>
						</div>
						{canManageVisits ? (
							<Button type='button' variant='outline' size='sm' onClick={() => loadVisit('new')}>
								<Plus className='size-4' />
								New
							</Button>
						) : null}
					</div>
					<div className='space-y-2 p-3'>
						{visits.map((visit) => (
							<button
								key={visit.id}
								type='button'
								onClick={() => loadVisit(visit.id)}
								className={`w-full rounded-xl border px-4 py-3 text-left ${
									selectedVisitId === visit.id
										? 'border-care-blue bg-care-blue-light/40'
										: 'border-border hover:bg-slate-50'
								}`}>
								<p className='text-sm font-semibold text-foreground'>{visit.status}</p>
								<p className='mt-1 text-sm text-slate-600'>{formatDateTime(visit.scheduledStart)}</p>
								<p className='mt-2 text-xs font-medium uppercase tracking-wide text-slate-400'>
									{visit.assignments.length} active assignments
								</p>
							</button>
						))}
						{visits.length === 0 ? (
							<p className='px-2 py-4 text-sm text-slate-500'>No visits scheduled yet.</p>
						) : null}
					</div>
				</section>

				<div className='space-y-6'>
					<section className='rounded-2xl border border-border bg-white shadow-sm'>
						<div className='border-b border-border px-6 py-5'>
							<h2 className='font-heading text-base font-bold text-foreground'>
								{selectedVisit ? 'Visit details' : 'New visit'}
							</h2>
							<p className='mt-1 text-sm text-slate-600'>
								Keep visit scheduling and assignment inside the patient-scoped rota workflow.
							</p>
						</div>
						<div className='grid gap-5 px-6 py-6 md:grid-cols-2'>
							<div className='space-y-2'>
								<Label>Scheduled start</Label>
								<Input
									type='datetime-local'
									disabled={!canManageVisits}
									value={visitForm.scheduledStart}
									onChange={(event) =>
										setVisitForm((current) => ({ ...current, scheduledStart: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label>Scheduled end</Label>
								<Input
									type='datetime-local'
									disabled={!canManageVisits}
									value={visitForm.scheduledEnd}
									onChange={(event) =>
										setVisitForm((current) => ({ ...current, scheduledEnd: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label>Status</Label>
								<NativeSelect
									className='w-full'
									disabled={!canManageVisits}
									value={visitForm.status}
									onChange={(event) =>
										setVisitForm((current) => ({
											...current,
											status: event.target.value as VisitStatus,
										}))
									}>
									<NativeSelectOption value='SCHEDULED'>Scheduled</NativeSelectOption>
									<NativeSelectOption value='IN_PROGRESS'>In progress</NativeSelectOption>
									<NativeSelectOption value='COMPLETED'>Completed</NativeSelectOption>
									<NativeSelectOption value='CANCELLED'>Cancelled</NativeSelectOption>
									<NativeSelectOption value='NO_SHOW'>No show</NativeSelectOption>
								</NativeSelect>
							</div>
							<div className='space-y-2'>
								<Label>Actual start</Label>
								<Input
									type='datetime-local'
									disabled={!canManageVisits}
									value={visitForm.actualStart}
									onChange={(event) =>
										setVisitForm((current) => ({ ...current, actualStart: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label>Actual end</Label>
								<Input
									type='datetime-local'
									disabled={!canManageVisits}
									value={visitForm.actualEnd}
									onChange={(event) =>
										setVisitForm((current) => ({ ...current, actualEnd: event.target.value }))
									}
								/>
							</div>
						</div>
						<div className='flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4'>
							{selectedVisit && canManageVisits ? (
								<Button type='button' variant='destructive' onClick={handleDeleteVisit} disabled={isSaving}>
									Delete visit
								</Button>
							) : null}
							{canManageVisits ? (
								<Button type='button' onClick={handleSaveVisit} disabled={isSaving}>
									{isSaving ? 'Saving...' : selectedVisit ? 'Save visit' : 'Create visit'}
								</Button>
							) : null}
						</div>
					</section>

					<section className='rounded-2xl border border-border bg-white shadow-sm'>
						<div className='border-b border-border px-6 py-5'>
							<div className='flex items-center gap-2'>
								<UsersRound className='size-4 text-care-blue' />
								<h2 className='font-heading text-base font-bold text-foreground'>Assignments</h2>
							</div>
							<p className='mt-1 text-sm text-slate-600'>
								Assignment actions respect the separate `assign_visits` permission.
							</p>
						</div>
						<div className='grid gap-5 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_18rem]'>
							<div className='space-y-3'>
								{selectedVisit?.assignments.map((assignment) => (
									<div key={assignment.id} className='flex items-center justify-between rounded-2xl border border-border p-4'>
										<div>
											<p className='text-sm font-semibold text-foreground'>
												{assignment.carer.organizationUser.user.firstName} {assignment.carer.organizationUser.user.lastName}
											</p>
											<p className='mt-1 text-sm text-slate-600'>
												Assigned to visit
											</p>
										</div>
										{canAssignVisits ? (
											<Button
												type='button'
												variant='outline'
												size='sm'
												onClick={() => void handleUnassignCarer(assignment.carer.id)}
												disabled={isSaving}>
												Remove
											</Button>
										) : null}
									</div>
								))}
								{selectedVisit?.assignments.length ? null : (
									<p className='text-sm text-slate-500'>No carers assigned yet.</p>
								)}
							</div>
							<div className='rounded-2xl border border-border p-4'>
								<div className='space-y-2'>
									<Label>Assign carer</Label>
									<NativeSelect
										className='w-full'
										disabled={!selectedVisit || !canAssignVisits}
										value={selectedCarerId}
										onChange={(event) => setSelectedCarerId(event.target.value)}>
										<NativeSelectOption value=''>Select a carer</NativeSelectOption>
										{carers.map((carer) => (
											<NativeSelectOption key={carer.id} value={carer.id}>
												{carer.firstName} {carer.lastName}
											</NativeSelectOption>
										))}
									</NativeSelect>
								</div>
								<div className='mt-4 flex items-center gap-2 text-sm text-slate-500'>
									<CalendarClock className='size-4' />
									<span>Assignments only appear on saved visits.</span>
								</div>
								{canAssignVisits ? (
									<Button type='button' className='mt-4' onClick={handleAssignCarer} disabled={!selectedVisit || !selectedCarerId || isSaving}>
										Assign carer
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
