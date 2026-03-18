'use client';

import { ActivityItem } from '@/components/dashboard/activity-item';
import { BarChart } from '@/components/dashboard/bar-chart';
import { DateTabs } from '@/components/dashboard/date-tabs';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { VisitRow } from '@/components/dashboard/visit-row';
import { Button } from '@/components/ui/button';
import {
	AlertTriangle,
	BarChart3,
	CalendarCheck,
	Car,
	CheckCircle2,
	ChevronDown,
	ClipboardList,
	Clock,
	Filter,
	Radio,
	RefreshCw,
	UserPlus,
	Users,
} from 'lucide-react';
import Link from 'next/link';
import { BoundingBox } from '../../components/dashboard/bounding-box';

const weekDays = [
	{ day: 'Mon', date: 12 },
	{ day: 'Tue', date: 13 },
	{ day: 'Wed', date: 14 },
	{ day: 'Thu', date: 15 },
	{ day: 'Fri', date: 16 },
	{ day: 'Sat', date: 17 },
	{ day: 'Sun', date: 18 },
];

const chartData = [
	{ label: 'Mon', values: [90, 60] },
	{ label: 'Tue', values: [50, 65] },
	{ label: 'Wed', values: [55, 80] },
	{ label: 'Thu', values: [60, 75] },
	{ label: 'Fri', values: [65, 90] },
	{ label: 'Sat', values: [35, 50] },
	{ label: 'Sun', values: [40, 55] },
];

export default function DashboardPage() {
	return (
		<BoundingBox className='flex flex-col gap-8 p-4 lg:p-8 lg:pl-4 '>
			{/* Stats Overview */}
			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
				<StatCard
					title="Today's Visits"
					value='142'
					change={{ value: '+5.2% vs yesterday', trend: 'up' }}
					icon={CalendarCheck}
					iconClassName='text-care-blue'
				/>
				<StatCard
					title='Completion Rate'
					value='98.4%'
					change={{ value: '-0.2%', trend: 'down' }}
					icon={CheckCircle2}
					iconClassName='text-success'
				/>
				<StatCard
					title='On-Time Performance'
					value='92.1%'
					change={{ value: '+1.5%', trend: 'up' }}
					icon={Clock}
					iconClassName='text-warning'
				/>
				<StatCard
					title='Active Carers'
					value='38'
					subtitle='94% of total staff'
					icon={Users}
					iconClassName='text-muted-foreground'
				/>
			</div>

			{/* Weekly Rota Management Header */}
			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h2 className='text-xl font-bold tracking-tight text-foreground'>
						Weekly Rota Management
					</h2>
					<p className='text-sm text-muted-foreground'>
						Managing 482 shifts for the current period
					</p>
				</div>
				<div className='flex gap-3'>
					<Button variant='outline' className='gap-2'>
						<Filter className='size-3.5' />
						Filter
					</Button>
					<Button className='gap-2 bg-care-blue shadow-md hover:bg-care-blue-hover'>
						<UserPlus className='size-3.5' />
						Invite Carer
					</Button>
				</div>
			</div>

			{/* Main Rota Card */}
			<div className='overflow-hidden rounded-xl border border-border bg-white shadow-sm'>
				{/* Date Tabs */}
				<DateTabs tabs={weekDays} defaultActive={2} />

				{/* Content: Visit Status + Recent Completions */}
				<div className='flex flex-col lg:flex-row'>
					{/* Left: Real-time Visit Status */}
					<div className='flex-1 border-b p-4 lg:border-b-0 lg:border-r lg:p-4'>
						<div className='mb-4 flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								<Radio className='size-4 text-care-blue' />
								<span className='text-sm font-bold text-foreground'>
									Real-time Visit Status
								</span>
							</div>
							<span className='text-xs font-medium text-muted-foreground'>
								Live Updating...
							</span>
						</div>

						<div className='flex flex-col divide-y divide-border'>
							<VisitRow
								initials='SJ'
								avatarColor='#6366f1'
								name='Sarah Jenkins'
								detail='Visiting: Robert Miller (ID: 4022)'
								timeRange='08:00 - 09:30'
								category='Morning Routine'
								badge={
									<StatusBadge variant='in-progress' label='In-Progress' />
								}
							/>
							<VisitRow
								initials='DC'
								avatarColor='#64748b'
								name='David Chen'
								detail='Visiting: Mary Higgins (ID: 1085)'
								timeRange='08:15 - 08:45'
								category='Medication Only'
								badge={
									<StatusBadge
										variant='running-late'
										label='Running Late'
										icon={AlertTriangle}
									/>
								}
							/>
							<VisitRow
								initials='ER'
								avatarColor='#0ea5e9'
								name='Elena Rodriguez'
								detail='Traveling to: John Dow (ID: 2941)'
								timeRange='09:00 - 10:00'
								category='Personal Care'
								badge={
									<StatusBadge variant='en-route' label='En-Route' icon={Car} />
								}
							/>
						</div>
					</div>

					{/* Right: Recent Completions + Alert */}
					<div className='w-full p-4 lg:w-80 xl:w-96'>
						<div className='mb-4 flex items-center justify-between'>
							<span className='text-sm font-bold text-foreground'>
								Recent Completions
							</span>
							<Link
								href='#'
								className='text-xs font-semibold text-care-blue hover:underline'>
								View All
							</Link>
						</div>

						<div className='flex flex-col'>
							<ActivityItem
								dotColor='green'
								title='Visit Completed - 07:45 AM'
								description='Thomas Wade (Carer) finished morning visit for Mrs. Kemp. Notes submitted.'
							/>
							<ActivityItem
								dotColor='blue'
								title='Medication Logged - 07:30 AM'
								description='Sarah Jenkins confirmed Level 2 medication administration for Mr. Miller.'
							/>
							<ActivityItem
								dotColor='blue'
								title='Check-out - 07:15 AM'
								description='James Porter checked out from 22 Oak St. Duration: 45 mins.'
								isLast
							/>
						</div>

						{/* Compliance Alert */}
						<div className='mt-4 rounded-lg border border-warning/30 bg-warning/5 p-4'>
							<p className='text-xs font-bold uppercase tracking-wider text-warning'>
								Compliance Alert
							</p>
							<p className='mt-1 text-xs leading-relaxed text-slate-600'>
								3 training certificates for North Sector staff expire in the
								next 14 days.{' '}
								<Link
									href='#'
									className='font-semibold text-foreground underline'>
									Review Compliance
								</Link>
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom Row: Onboarding + Chart */}
			<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
				{/* Carer Onboarding Status */}
				<div className='rounded-xl border border-border bg-white p-6 shadow-sm'>
					<div className='mb-6 flex items-center gap-2'>
						<ClipboardList className='size-5 text-foreground' />
						<h3 className='text-sm font-bold text-foreground'>
							Carer Onboarding Status
						</h3>
					</div>

					{/* Table */}
					<div className='overflow-x-auto'>
						<table className='w-full text-sm'>
							<thead>
								<tr className='border-b border-border text-left'>
									<th className='pb-3 pr-4 font-semibold text-muted-foreground'>
										Name
									</th>
									<th className='pb-3 pr-4 font-semibold text-muted-foreground'>
										Status
									</th>
									<th className='hidden pb-3 pr-4 font-semibold text-muted-foreground sm:table-cell'>
										Invitation Sent
									</th>
									<th className='pb-3 font-semibold text-muted-foreground'>
										Action
									</th>
								</tr>
							</thead>
							<tbody>
								<tr className='border-b border-border'>
									<td className='py-4 pr-4 font-medium text-foreground'>
										Liam Peterson
									</td>
									<td className='py-4 pr-4'>
										<StatusBadge variant='pending' label='Pending' />
									</td>
									<td className='hidden py-4 pr-4 text-muted-foreground sm:table-cell'>
										2 hours ago
									</td>
									<td className='py-4'>
										<button className='text-muted-foreground transition-colors hover:text-foreground'>
											<RefreshCw className='size-4' />
										</button>
									</td>
								</tr>
								<tr>
									<td className='py-4 pr-4 font-medium text-foreground'>
										Sophia Green
									</td>
									<td className='py-4 pr-4'>
										<StatusBadge variant='accepted' label='Accepted' />
									</td>
									<td className='hidden py-4 pr-4 text-muted-foreground sm:table-cell'>
										Yesterday
									</td>
									<td className='py-4'>
										<Link
											href='#'
											className='text-sm font-semibold text-care-blue hover:underline'>
											Setup Profile
										</Link>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{/* Operational Efficiency */}
				<div className='rounded-xl border border-border bg-white p-6 shadow-sm'>
					<div className='mb-6 flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<BarChart3 className='size-5 text-foreground' />
							<h3 className='text-sm font-bold text-foreground'>
								Operational Efficiency (Last 7 Days)
							</h3>
						</div>
						<button className='flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted'>
							By Sector
							<ChevronDown className='size-3' />
						</button>
					</div>

					<BarChart data={chartData} />
				</div>
			</div>
		</BoundingBox>
	);
}
