'use client';

import { BoundingBox } from '@/components/dashboard/bounding-box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
	AlertTriangle,
	ChevronRight,
	Search,
	UserPlus,
	Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CarerStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';

interface Carer {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	employmentType: string;
	status: CarerStatus;
	hireDate: string;
	experienceYears: number;
	avatarColor: string;
	complianceScore: number; // 0–100
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_CARERS: Carer[] = [
	{
		id: 'c1',
		firstName: 'Sarah',
		lastName: 'Jenkins',
		email: 'sarah.jenkins@sunrisecare.co.uk',
		employmentType: 'Full-Time',
		status: 'ACTIVE',
		hireDate: '2022-03-15',
		experienceYears: 4,
		avatarColor: '#6366f1',
		complianceScore: 100,
	},
	{
		id: 'c2',
		firstName: 'David',
		lastName: 'Chen',
		email: 'd.chen@sunrisecare.co.uk',
		employmentType: 'Part-Time',
		status: 'ACTIVE',
		hireDate: '2023-07-01',
		experienceYears: 2,
		avatarColor: '#0ea5e9',
		complianceScore: 67,
	},
	{
		id: 'c3',
		firstName: 'Elena',
		lastName: 'Rodriguez',
		email: 'e.rodriguez@sunrisecare.co.uk',
		employmentType: 'Full-Time',
		status: 'ACTIVE',
		hireDate: '2021-11-20',
		experienceYears: 6,
		avatarColor: '#10b981',
		complianceScore: 83,
	},
	{
		id: 'c4',
		firstName: 'Thomas',
		lastName: 'Wade',
		email: 'thomas.wade@sunrisecare.co.uk',
		employmentType: 'Bank',
		status: 'ON_LEAVE',
		hireDate: '2023-02-08',
		experienceYears: 3,
		avatarColor: '#f59e0b',
		complianceScore: 50,
	},
	{
		id: 'c5',
		firstName: 'Amara',
		lastName: 'Osei',
		email: 'a.osei@sunrisecare.co.uk',
		employmentType: 'Full-Time',
		status: 'ACTIVE',
		hireDate: '2024-01-15',
		experienceYears: 1,
		avatarColor: '#ec4899',
		complianceScore: 33,
	},
	{
		id: 'c6',
		firstName: 'Liam',
		lastName: 'Peterson',
		email: 'l.peterson@sunrisecare.co.uk',
		employmentType: 'Part-Time',
		status: 'SUSPENDED',
		hireDate: '2022-09-12',
		experienceYears: 3,
		avatarColor: '#64748b',
		complianceScore: 17,
	},
];

/* ------------------------------------------------------------------ */
/*  CarerStatusBadge                                                   */
/* ------------------------------------------------------------------ */

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
				'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
				styles[status],
			)}>
			{labels[status]}
		</span>
	);
}

/* ------------------------------------------------------------------ */
/*  ComplianceBar                                                      */
/* ------------------------------------------------------------------ */

function ComplianceBar({ score }: { score: number }) {
	const color =
		score >= 80 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-error';
	const textColor =
		score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-error';
	return (
		<div className='flex items-center gap-2'>
			<div
				className='h-1.5 w-16 overflow-hidden rounded-full bg-slate-100'
				role='progressbar'
				aria-valuenow={score}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={`Compliance ${score}%`}>
				<div
					className={cn('h-full rounded-full transition-all', color)}
					style={{ width: `${score}%` }}
				/>
			</div>
			<span className={cn('text-xs font-semibold tabular-nums', textColor)}>
				{score}%
			</span>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  CarerRow                                                           */
/* ------------------------------------------------------------------ */

function CarerRow({ carer }: { carer: Carer }) {
	const initials = `${carer.firstName[0]}${carer.lastName[0]}`.toUpperCase();
	return (
		<Link
			href={`/dashboard/staff/${carer.id}`}
			className='group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none'
			aria-label={`View profile of ${carer.firstName} ${carer.lastName}`}>
			{/* Avatar */}
			<span
				className='inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white'
				style={{ backgroundColor: carer.avatarColor }}
				aria-hidden='true'>
				{initials}
			</span>

			{/* Name + email */}
			<div className='min-w-0 flex-1'>
				<p className='truncate text-sm font-semibold text-foreground'>
					{carer.firstName} {carer.lastName}
				</p>
				<p className='truncate text-xs text-slate-500'>{carer.email}</p>
			</div>

			{/* Employment type */}
			<p className='hidden w-24 shrink-0 text-xs font-medium text-slate-600 sm:block'>
				{carer.employmentType}
			</p>

			{/* Compliance */}
			<div className='hidden md:block'>
				<ComplianceBar score={carer.complianceScore} />
			</div>

			{/* Status */}
			<div className='hidden sm:block'>
				<CarerStatusBadge status={carer.status} />
			</div>

			{/* Hire date */}
			<p className='hidden w-24 shrink-0 text-xs text-slate-400 xl:block'>
				{new Date(carer.hireDate).toLocaleDateString('en-GB', {
					day: 'numeric',
					month: 'short',
					year: 'numeric',
				})}
			</p>

			<ChevronRight className='size-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500' />
		</Link>
	);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

type FilterStatus = 'ALL' | CarerStatus;

export default function StaffPage() {
	const [search, setSearch] = useState('');
	const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

	const filtered = MOCK_CARERS.filter((c) => {
		const q = search.toLowerCase();
		const matchesSearch =
			`${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
			c.email.toLowerCase().includes(q) ||
			c.employmentType.toLowerCase().includes(q);
		const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
		return matchesSearch && matchesStatus;
	});

	const counts = {
		ACTIVE: MOCK_CARERS.filter((c) => c.status === 'ACTIVE').length,
		ON_LEAVE: MOCK_CARERS.filter((c) => c.status === 'ON_LEAVE').length,
		SUSPENDED: MOCK_CARERS.filter((c) => c.status === 'SUSPENDED').length,
	};

	const lowCompliance = MOCK_CARERS.filter(
		(c) => c.status === 'ACTIVE' && c.complianceScore < 80,
	).length;

	return (
		<BoundingBox>
			{/* Page header */}
			<div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
				<div>
					<div className='flex items-center gap-3'>
						<div className='flex size-10 items-center justify-center rounded-xl bg-care-blue-light'>
							<Users className='size-5 text-care-blue' aria-hidden='true' />
						</div>
						<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
							Staff Management
						</h1>
					</div>
					<p className='mt-3 max-w-xl text-sm leading-relaxed text-slate-600'>
						Manage your care professionals — view employment status, track
						compliance, and update profiles.
					</p>
				</div>

				<Link href='/dashboard/staff/new' className='shrink-0'>
					<Button className='h-10 gap-2 bg-care-blue text-sm font-semibold shadow-md hover:bg-care-blue-hover'>
						<UserPlus className='size-4' aria-hidden='true' />
						Add Carer
					</Button>
				</Link>
			</div>

			{/* Summary strip */}
			<div className='mb-6 grid grid-cols-2 divide-x divide-border rounded-xl border border-border bg-white shadow-sm sm:grid-cols-4'>
				<div className='px-5 py-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
						Total Staff
					</p>
					<p className='mt-1 text-2xl font-bold text-foreground'>
						{MOCK_CARERS.length}
					</p>
				</div>
				<div className='px-5 py-4'>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
						Active
					</p>
					<p className='mt-1 text-2xl font-bold text-success'>
						{counts.ACTIVE}
					</p>
				</div>
				<div className='border-t border-border px-5 py-4 sm:border-t-0'>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
						On Leave
					</p>
					<p className='mt-1 text-2xl font-bold text-care-blue'>
						{counts.ON_LEAVE}
					</p>
				</div>
				<div className='border-t border-border px-5 py-4 sm:border-t-0'>
					<p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
						Compliance Alerts
					</p>
					<p
						className={cn(
							'mt-1 text-2xl font-bold',
							lowCompliance > 0 ? 'text-warning' : 'text-success',
						)}>
						{lowCompliance}
					</p>
				</div>
			</div>

			{/* Compliance alert banner */}
			{lowCompliance > 0 && (
				<div
					className='mb-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4'
					role='alert'>
					<AlertTriangle
						className='mt-0.5 size-5 shrink-0 text-warning'
						aria-hidden='true'
					/>
					<div>
						<p className='text-sm font-bold text-foreground'>
							{lowCompliance} active carer
							{lowCompliance > 1 ? 's have' : ' has'} incomplete compliance
						</p>
						<p className='mt-0.5 text-sm text-slate-600'>
							Review their profiles to ensure all required qualifications and
							certificates are up to date.
						</p>
					</div>
				</div>
			)}

			{/* List card */}
			<div className='rounded-xl border border-border bg-white shadow-sm'>
				{/* Filters */}
				<div className='flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between'>
					<div className='flex flex-wrap gap-2'>
						{(['ALL', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED'] as const).map((s) => (
							<button
								key={s}
								type='button'
								onClick={() => setFilterStatus(s)}
								className={cn(
									'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
									filterStatus === s
										? 'bg-care-blue text-white shadow-sm'
										: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
								)}>
								{s === 'ALL'
									? 'All'
									: s === 'ON_LEAVE'
										? 'On Leave'
										: s.charAt(0) + s.slice(1).toLowerCase()}
							</button>
						))}
					</div>
					<div className='relative w-full sm:w-64'>
						<Search
							className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400'
							aria-hidden='true'
						/>
						<Input
							type='search'
							placeholder='Search name or email…'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='h-9 pl-9 text-sm'
							aria-label='Search carers'
						/>
					</div>
				</div>

				{/* Column headers */}
				<div className='hidden grid-cols-[auto_1fr_6rem_7rem_6rem_6rem_1.5rem] items-center gap-4 border-b border-border px-6 py-2.5 xl:grid'>
					<span className='w-10' />
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Carer
					</span>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Type
					</span>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Compliance
					</span>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Status
					</span>
					<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
						Hired
					</span>
					<span />
				</div>

				{/* Rows */}
				{filtered.length > 0 ? (
					<ul role='list' className='divide-y divide-border'>
						{filtered.map((carer) => (
							<li key={carer.id}>
								<CarerRow carer={carer} />
							</li>
						))}
					</ul>
				) : (
					<div className='flex flex-col items-center gap-2 px-6 py-12 text-center'>
						<Search className='size-8 text-slate-300' aria-hidden='true' />
						<p className='text-sm font-semibold text-foreground'>
							No carers found
						</p>
						<p className='text-xs text-slate-500'>
							Try a different name or adjust the filter.
						</p>
					</div>
				)}
			</div>
		</BoundingBox>
	);
}
