'use client';

import { BoundingBox } from '@/components/dashboard/bounding-box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	fetchPatients,
	getCurrentOrgContext,
	getOrgManagementError,
	hasOrgPermission,
	type OrgContext,
	type PatientListItem,
	type PatientStatus,
	type PaginationMeta,
} from '@/lib/org-management';
import { cn } from '@/lib/utils';
import {
	CalendarDays,
	Plus,
	Search,
	UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useEffect, useState } from 'react';

type FilterStatus = 'ALL' | PatientStatus;

function formatDate(date: string) {
	return new Date(date).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

function formatAge(date: string) {
	const birthDate = new Date(date);
	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const hasHadBirthday =
		today.getMonth() > birthDate.getMonth() ||
		(today.getMonth() === birthDate.getMonth() &&
			today.getDate() >= birthDate.getDate());

	if (!hasHadBirthday) {
		age -= 1;
	}

	return age;
}

function formatGender(gender: PatientListItem['gender']) {
	switch (gender) {
		case 'MALE':
			return 'Male';
		case 'FEMALE':
			return 'Female';
		case 'OTHER':
			return 'Other';
		default:
			return 'Not specified';
	}
}

function PatientStatusBadge({ status }: { status: PatientStatus }) {
	const styles: Record<PatientStatus, string> = {
		ACTIVE: 'border border-success/20 bg-success/10 text-success',
		INACTIVE: 'border border-slate-200 bg-slate-100 text-slate-600',
	};

	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
				styles[status],
			)}>
			{status === 'ACTIVE' ? 'Active' : 'Inactive'}
		</span>
	);
}

function SummaryCard({
	label,
	value,
	accentClassName,
}: {
	label: string;
	value: number;
	accentClassName?: string;
}) {
	return (
		<div className='px-5 py-4'>
			<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
				{label}
			</p>
			<p
				className={cn(
					'mt-1 text-2xl font-bold text-foreground',
					accentClassName,
				)}>
				{value}
			</p>
		</div>
	);
}

function PatientRow({ patient }: { patient: PatientListItem }) {
	return (
		<Link
			href={`/dashboard/patients/${patient.id}`}
			className='grid gap-4 px-6 py-4 transition-colors hover:bg-slate-50 md:grid-cols-[minmax(0,1.5fr)_8rem_8rem_7rem_7rem] md:items-center'>
			<div className='min-w-0'>
				<p className='truncate text-sm font-semibold text-foreground'>
					{patient.firstName} {patient.lastName}
				</p>
				<p className='mt-1 text-xs text-slate-500'>
					Added {formatDate(patient.createdAt)}
				</p>
			</div>
			<p className='text-sm text-slate-600'>
				{formatDate(patient.dateOfBirth)}
				<span className='block text-xs text-slate-400'>
					{formatAge(patient.dateOfBirth)} years
				</span>
			</p>
			<p className='text-sm text-slate-600'>{formatGender(patient.gender)}</p>
			<div>
				<PatientStatusBadge status={patient.status} />
			</div>
			<p className='text-sm text-care-blue'>View</p>
		</Link>
	);
}

export default function PatientsPage() {
	const [orgContext, setOrgContext] = useState<OrgContext | null>(null);
	const [patients, setPatients] = useState<PatientListItem[]>([]);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState<FilterStatus>('ALL');
	const [summary, setSummary] = useState({
		total: 0,
		active: 0,
		inactive: 0,
	});
	const [page, setPage] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const deferredSearch = useDeferredValue(search);

	useEffect(() => {
		setPage(1);
	}, [deferredSearch, status]);

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				setIsLoading(true);
				setErrorMessage('');

				const context = orgContext ?? (await getCurrentOrgContext());
				if (!isMounted) {
					return;
				}

				setOrgContext(context);

				if (!hasOrgPermission(context, 'view_patients')) {
					setPatients([]);
					setPagination(null);
					setSummary({ total: 0, active: 0, inactive: 0 });
					setErrorMessage('You do not have permission to view patients.');
					return;
				}

				const searchValue = deferredSearch.trim();
				const [listResult, totalResult, activeResult, inactiveResult] =
					await Promise.all([
						fetchPatients(context.organizationId, {
							page,
							limit: 10,
							...(searchValue ? { search: searchValue } : {}),
							...(status !== 'ALL' ? { status } : {}),
						}),
						fetchPatients(context.organizationId, { page: 1, limit: 1 }),
						fetchPatients(context.organizationId, {
							page: 1,
							limit: 1,
							status: 'ACTIVE',
						}),
						fetchPatients(context.organizationId, {
							page: 1,
							limit: 1,
							status: 'INACTIVE',
						}),
					]);

				if (!isMounted) {
					return;
				}

				setPatients(listResult.patients);
				setPagination(listResult.pagination);
				setSummary({
					total: totalResult.pagination.total,
					active: activeResult.pagination.total,
					inactive: inactiveResult.pagination.total,
				});
			} catch (error) {
				if (!isMounted) {
					return;
				}

				setErrorMessage(
					getOrgManagementError(error, 'Unable to load patients.'),
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
	}, [deferredSearch, orgContext, page, status]);

	const canManagePatients = orgContext
		? hasOrgPermission(orgContext, 'manage_patients')
		: false;

	return (
		<BoundingBox>
			<div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
				<div>
					<div className='flex items-center gap-3'>
						<div className='flex size-10 items-center justify-center rounded-xl bg-care-blue-light'>
							<UsersRound className='size-5 text-care-blue' aria-hidden='true' />
						</div>
						<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
							Patients
						</h1>
					</div>
					<p className='mt-3 max-w-2xl text-sm leading-relaxed text-slate-600'>
						Create and manage patient records using the core profile fields already
						supported by the platform.
					</p>
				</div>

				{canManagePatients ? (
					<Link href='/dashboard/patients/new' className='shrink-0'>
						<Button className='h-10 gap-2 bg-care-blue text-sm font-semibold shadow-md hover:bg-care-blue-hover'>
							<Plus className='size-4' aria-hidden='true' />
							Add Patient
						</Button>
					</Link>
				) : null}
			</div>

			<div className='mb-4 min-h-5'>
				{errorMessage ? (
					<p className='text-sm font-medium text-red-600'>{errorMessage}</p>
				) : null}
			</div>

			<div className='mb-6 grid grid-cols-1 divide-y divide-border rounded-xl border border-border bg-white shadow-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
				<SummaryCard label='Total Patients' value={summary.total} />
				<SummaryCard
					label='Active'
					value={summary.active}
					accentClassName='text-success'
				/>
				<SummaryCard
					label='Inactive'
					value={summary.inactive}
					accentClassName='text-slate-600'
				/>
			</div>

			<div className='rounded-xl border border-border bg-white shadow-sm'>
				<div className='flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between'>
					<div className='flex flex-wrap gap-2'>
						{(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((filter) => (
							<button
								key={filter}
								type='button'
								onClick={() => setStatus(filter)}
								className={cn(
									'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
									status === filter
										? 'bg-care-blue text-white shadow-sm'
										: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
								)}>
								{filter === 'ALL'
									? 'All'
									: filter.charAt(0) + filter.slice(1).toLowerCase()}
							</button>
						))}
					</div>
					<div className='relative w-full sm:w-72'>
						<Search
							className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400'
							aria-hidden='true'
						/>
						<Input
							type='search'
							placeholder='Search patient name...'
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className='h-9 pl-9 text-sm'
							aria-label='Search patients'
						/>
					</div>
				</div>

				<div className='hidden grid-cols-[minmax(0,1.5fr)_8rem_8rem_7rem_7rem] items-center gap-4 border-b border-border px-6 py-2.5 md:grid'>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Patient
					</span>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Date of Birth
					</span>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Gender
					</span>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Status
					</span>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Profile
					</span>
				</div>

				{isLoading ? (
					<div className='px-6 py-12 text-sm text-slate-500'>Loading patients...</div>
				) : patients.length > 0 ? (
					<ul role='list' className='divide-y divide-border'>
						{patients.map((patient) => (
							<li key={patient.id}>
								<PatientRow patient={patient} />
							</li>
						))}
					</ul>
				) : (
					<div className='flex flex-col items-center gap-2 px-6 py-12 text-center'>
						<CalendarDays className='size-8 text-slate-300' aria-hidden='true' />
						<p className='text-sm font-semibold text-foreground'>No patients found</p>
						<p className='text-xs text-slate-500'>
							Try a different search or add the first patient record.
						</p>
					</div>
				)}

				{pagination ? (
					<div className='flex flex-col gap-3 border-t border-border px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between'>
						<p className='text-slate-500'>
							Page {pagination.page} of {pagination.totalPages} · {pagination.total}{' '}
							patient{pagination.total === 1 ? '' : 's'}
						</p>
						<div className='flex items-center gap-2'>
							<Button
								type='button'
								variant='outline'
								onClick={() => setPage((current) => Math.max(1, current - 1))}
								disabled={pagination.page <= 1 || isLoading}>
								Previous
							</Button>
							<Button
								type='button'
								variant='outline'
								onClick={() =>
									setPage((current) =>
										Math.min(pagination.totalPages || current, current + 1),
									)
								}
								disabled={
									pagination.page >= pagination.totalPages || isLoading
								}>
								Next
							</Button>
						</div>
					</div>
				) : null}
			</div>
		</BoundingBox>
	);
}
