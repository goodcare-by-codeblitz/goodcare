'use client';

import { BoundingBox } from '@/components/dashboard/bounding-box';
import { Input } from '@/components/ui/input';
import {
	NativeSelect,
	NativeSelectOption,
} from '@/components/ui/native-select';
import {
	fetchCarePlans,
	fetchPatients,
	getCurrentOrgContext,
	getOrgManagementError,
	hasOrgPermission,
	type CarePlanListItem,
	type CarePlanStatus,
	type OrgContext,
	type PatientListItem,
} from '@/lib/org-management';
import { ClipboardList, Search } from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useEffect, useState } from 'react';

type FilterStatus = 'ALL' | CarePlanStatus;

function formatDate(date: string) {
	return new Date(date).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

export default function CarePlansPage() {
	const [orgContext, setOrgContext] = useState<OrgContext | null>(null);
	const [patients, setPatients] = useState<PatientListItem[]>([]);
	const [carePlans, setCarePlans] = useState<CarePlanListItem[]>([]);
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
				if (!hasOrgPermission(context, 'view_care_plans')) {
					setErrorMessage('You do not have permission to view care plans.');
					return;
				}

				const [patientResult, carePlanResult] = await Promise.all([
					fetchPatients(context.organizationId, { page: 1, limit: 100 }),
					fetchCarePlans(context.organizationId, {
						page: 1,
						limit: 100,
						...(selectedPatientId !== 'ALL' ? { patientId: selectedPatientId } : {}),
						...(status !== 'ALL' ? { status } : {}),
					}),
				]);

				if (!isMounted) {
					return;
				}

				setPatients(patientResult.patients);
				setCarePlans(carePlanResult.carePlans);
			} catch (error) {
				if (isMounted) {
					setErrorMessage(getOrgManagementError(error, 'Unable to load care plans.'));
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

	const visibleCarePlans = carePlans.filter((carePlan) => {
		if (!deferredSearch.trim()) {
			return true;
		}

		const needle = deferredSearch.trim().toLowerCase();
		return (
			carePlan.summary.toLowerCase().includes(needle) ||
			`${carePlan.patient.firstName} ${carePlan.patient.lastName}`
				.toLowerCase()
				.includes(needle)
		);
	});

	if (isLoading) {
		return (
			<BoundingBox>
				<p className='text-sm text-slate-500'>Loading care plans...</p>
			</BoundingBox>
		);
	}

	if (!orgContext || !hasOrgPermission(orgContext, 'view_care_plans')) {
		return (
			<BoundingBox>
				<p className='text-sm font-semibold text-foreground'>
					{errorMessage || 'Care plans are unavailable.'}
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
							<ClipboardList className='size-5' />
						</div>
						<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
							Care Plans
						</h1>
					</div>
					<p className='mt-3 max-w-3xl text-sm leading-relaxed text-slate-600'>
						This organization-wide index stays focused on visibility. Editing and
						version creation happen inside each patient-scoped care-plan workflow.
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
						placeholder='Search care plans or patients'
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
					<NativeSelectOption value='DRAFT'>Draft</NativeSelectOption>
					<NativeSelectOption value='ACTIVE'>Active</NativeSelectOption>
					<NativeSelectOption value='SUPERSEDED'>Superseded</NativeSelectOption>
					<NativeSelectOption value='ARCHIVED'>Archived</NativeSelectOption>
				</NativeSelect>
			</div>

			<div className='overflow-hidden rounded-2xl border border-border bg-white shadow-sm'>
				<div className='hidden grid-cols-[minmax(0,1.2fr)_7rem_9rem_8rem] gap-4 border-b border-border px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid'>
					<span>Patient and summary</span>
					<span>Version</span>
					<span>Status</span>
					<span>Open</span>
				</div>
				{visibleCarePlans.map((carePlan) => (
					<Link
						key={carePlan.id}
						href={`/dashboard/patients/${carePlan.patientId}/care-plans`}
						className='grid gap-4 border-b border-border px-6 py-4 transition-colors hover:bg-slate-50 md:grid-cols-[minmax(0,1.2fr)_7rem_9rem_8rem] md:items-center'>
						<div className='min-w-0'>
							<p className='truncate text-sm font-semibold text-foreground'>
								{carePlan.patient.firstName} {carePlan.patient.lastName}
							</p>
							<p className='mt-1 line-clamp-2 text-sm text-slate-600'>{carePlan.summary}</p>
							<p className='mt-1 text-xs text-slate-400'>Updated {formatDate(carePlan.updatedAt)}</p>
						</div>
						<p className='text-sm text-slate-600'>v{carePlan.version}</p>
						<p className='text-sm text-slate-600'>{carePlan.status}</p>
						<p className='text-sm font-semibold text-care-blue'>Open workflow</p>
					</Link>
				))}
				{visibleCarePlans.length === 0 ? (
					<div className='px-6 py-10 text-sm text-slate-500'>No care plans match the current filters.</div>
				) : null}
			</div>
		</BoundingBox>
	);
}
