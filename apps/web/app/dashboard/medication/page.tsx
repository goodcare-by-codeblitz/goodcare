'use client';

import { BoundingBox } from '@/components/dashboard/bounding-box';
import { Input } from '@/components/ui/input';
import {
	NativeSelect,
	NativeSelectOption,
} from '@/components/ui/native-select';
import {
	fetchMedications,
	fetchPatients,
	getCurrentOrgContext,
	getOrgManagementError,
	hasOrgPermission,
	type MedicationRecord,
	type MedicationStatus,
	type OrgContext,
	type PatientListItem,
} from '@/lib/org-management';
import { Pill, Search } from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useEffect, useState } from 'react';

type FilterStatus = 'ALL' | MedicationStatus;

function formatDate(date: string) {
	return new Date(date).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

export default function MedicationPage() {
	const [orgContext, setOrgContext] = useState<OrgContext | null>(null);
	const [patients, setPatients] = useState<PatientListItem[]>([]);
	const [medications, setMedications] = useState<MedicationRecord[]>([]);
	const [selectedPatientId, setSelectedPatientId] = useState('ALL');
	const [status, setStatus] = useState<FilterStatus>('ALL');
	const [search, setSearch] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const deferredSearch = useDeferredValue(search);

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

				const [patientResult, medicationResult] = await Promise.all([
					fetchPatients(context.organizationId, { page: 1, limit: 100 }),
					fetchMedications(context.organizationId, {
						page: 1,
						limit: 100,
						...(selectedPatientId !== 'ALL' ? { patientId: selectedPatientId } : {}),
						...(status !== 'ALL' ? { status } : {}),
						...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
					}),
				]);

				if (!isMounted) {
					return;
				}

				setPatients(patientResult.patients);
				setMedications(medicationResult.medications);
			} catch (error) {
				if (isMounted) {
					setErrorMessage(getOrgManagementError(error, 'Unable to load medications.'));
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
	}, [selectedPatientId, status, deferredSearch]);

	if (isLoading) {
		return (
			<BoundingBox>
				<p className='text-sm text-slate-500'>Loading medication records...</p>
			</BoundingBox>
		);
	}

	if (!orgContext || !hasOrgPermission(orgContext, 'view_medications')) {
		return (
			<BoundingBox>
				<p className='text-sm font-semibold text-foreground'>
					{errorMessage || 'Medication records are unavailable.'}
				</p>
			</BoundingBox>
		);
	}

	return (
		<BoundingBox>
			<div className='mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
				<div>
					<div className='flex items-center gap-3'>
						<div className='flex size-10 items-center justify-center rounded-xl bg-care-blue-light text-care-blue'>
							<Pill className='size-5' />
						</div>
						<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
							Medication &amp; eMAR
						</h1>
					</div>
					<p className='mt-3 max-w-3xl text-sm leading-relaxed text-slate-600'>
						This organization-wide view keeps medication visibility broad, while
						each patient retains their own medication workflow and administration log.
					</p>
				</div>
			</div>

			{errorMessage ? <p className='mb-4 text-sm font-medium text-red-600'>{errorMessage}</p> : null}

			<div className='mb-6 grid gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_16rem_12rem]'>
				<div className='relative'>
					<Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400' />
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className='pl-9'
						placeholder='Search medication or patient'
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
					<NativeSelectOption value='ACTIVE'>Active</NativeSelectOption>
					<NativeSelectOption value='PRN'>PRN</NativeSelectOption>
					<NativeSelectOption value='DISCONTINUED'>Discontinued</NativeSelectOption>
				</NativeSelect>
			</div>

			<div className='overflow-hidden rounded-2xl border border-border bg-white shadow-sm'>
				<div className='hidden grid-cols-[minmax(0,1.1fr)_10rem_10rem_8rem] gap-4 border-b border-border px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid'>
					<span>Medication</span>
					<span>Patient</span>
					<span>Status</span>
					<span>Open</span>
				</div>
				{medications.map((medication) => (
					<Link
						key={medication.id}
						href={`/dashboard/patients/${medication.patientId}/medications`}
						className='grid gap-4 border-b border-border px-6 py-4 transition-colors hover:bg-slate-50 md:grid-cols-[minmax(0,1.1fr)_10rem_10rem_8rem] md:items-center'>
						<div className='min-w-0'>
							<p className='truncate text-sm font-semibold text-foreground'>{medication.name}</p>
							<p className='mt-1 text-sm text-slate-600'>
								{medication.doseAmount} {medication.doseUnit} • {medication.route}
							</p>
							<p className='mt-1 text-xs text-slate-400'>Started {formatDate(medication.startDate)}</p>
						</div>
						<p className='text-sm text-slate-600'>
							{medication.patient.firstName} {medication.patient.lastName}
						</p>
						<p className='text-sm text-slate-600'>{medication.status}</p>
						<p className='text-sm font-semibold text-care-blue'>Open workflow</p>
					</Link>
				))}
				{medications.length === 0 ? (
					<div className='px-6 py-10 text-sm text-slate-500'>No medications match the current filters.</div>
				) : null}
			</div>
		</BoundingBox>
	);
}
