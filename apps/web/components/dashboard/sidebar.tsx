'use client';

import { cn } from '@/lib/utils';
import {
	CalendarDays,
	ChevronLeft,
	ClipboardList,
	LayoutDashboard,
	LogOut,
	MonitorPlay,
	Pill,
	Settings,
	ShieldUser,
	UserRound,
	Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const topNav = [
	{ icon: LayoutDashboard, href: '/dashboard', label: 'Dashboard' },
	{ icon: CalendarDays, href: '/dashboard/rota', label: 'Visits & Roster' },
	{ icon: Users, href: '/dashboard/staff', label: 'Staff Management' },
	{
		icon: ShieldUser,
		href: '/dashboard/settings/team',
		label: 'Team Management',
	},
	{ icon: Pill, href: '/dashboard/medication', label: 'Medication & eMAR' },
	{ icon: ClipboardList, href: '/dashboard/care-plans', label: 'Care Plans' },
	{ icon: UserRound, href: '/dashboard/clients', label: 'Clients' },
	{
		icon: MonitorPlay,
		href: '/dashboard/monitoring',
		label: 'Live Monitoring',
	},
];

export function Sidebar() {
	const pathname = usePathname();
	const [expanded, setExpanded] = useState(true);

	return (
		<aside
			className={cn(
				'flex h-full shrink-0 flex-col border-r border-border bg-white transition-[width] duration-200 ease-in-out',
				expanded ? 'w-64' : 'w-[72px]',
			)}>
			{/* Top nav */}
			<nav className='flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-4 py-4'>
				{topNav.map((item) => {
					const isActive =
						item.href === '/dashboard'
							? pathname === '/dashboard'
							: pathname.startsWith(item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							title={item.label}
							className={cn(
								'flex h-12 items-center gap-2 rounded-lg px-2.5 transition-colors',
								isActive
									? 'bg-[#0284c7] text-white shadow-sm'
									: 'text-gray-600 hover:bg-muted hover:text-foreground',
								!expanded && 'justify-center px-0',
							)}>
							<item.icon className='size-5 shrink-0' />
							{expanded && (
								<span className='truncate text-base font-medium'>
									{item.label}
								</span>
							)}
						</Link>
					);
				})}
			</nav>

			{/* Bottom section */}
			<div className='flex flex-col gap-4 overflow-x-hidden px-4 pb-4'>
				{/* System Status Card — only in expanded */}
				{expanded && (
					<div className='rounded-xl border border-slate-100 bg-muted p-4'>
						<p className='text-xs font-semibold uppercase text-muted-foreground'>
							System Status
						</p>
						<div className='mt-2 flex items-center gap-2'>
							<span className='size-2 rounded-full bg-success' />
							<span className='text-xs text-slate-700'>
								All services operational
							</span>
						</div>
					</div>
				)}

				{/* Organization Settings */}
				<Link
					href='/dashboard/settings'
					title='Organization Settings'
					className={cn(
						'flex h-12 items-center gap-2 rounded-lg px-2.5 text-gray-600 transition-colors hover:bg-muted hover:text-foreground',
						!expanded && 'justify-center px-0',
					)}>
					<Settings className='size-5 shrink-0' />
					{expanded && (
						<span className='truncate text-base font-medium'>
							Organization Settings
						</span>
					)}
				</Link>

				{/* Log Out */}
				<button
					className={cn(
						'flex h-12 items-center gap-2 rounded-lg bg-[#0284c7] px-2.5 text-white shadow-sm transition-colors hover:bg-care-blue-hover',
						expanded ? 'justify-between' : 'justify-center px-0',
					)}>
					{expanded && <span className='text-base font-medium'>Log Out</span>}
					<LogOut className='size-5 shrink-0' />
				</button>

				{/* Collapse toggle */}
				<button
					onClick={() => setExpanded(!expanded)}
					className={cn(
						'flex h-10 items-center gap-2 rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
						!expanded && 'justify-center px-0',
					)}
					title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}>
					<ChevronLeft
						className={cn(
							'size-5 shrink-0 transition-transform duration-200',
							!expanded && 'rotate-180',
						)}
					/>
					{expanded && <span className='text-sm font-medium'>Collapse</span>}
				</button>
			</div>
		</aside>
	);
}
