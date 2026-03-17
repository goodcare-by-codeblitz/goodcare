'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';

interface DateTab {
	day: string;
	date: number;
}

interface DateTabsProps {
	tabs: DateTab[];
	defaultActive?: number;
	className?: string;
}

export function DateTabs({ tabs, defaultActive = 2, className }: DateTabsProps) {
	const [active, setActive] = useState(defaultActive);

	return (
		<div className={cn('flex border-b border-border', className)}>
			{tabs.map((tab, i) => {
				const isActive = i === active;
				return (
					<button
						key={i}
						onClick={() => setActive(i)}
						className={cn(
							'flex flex-col items-center justify-center border-b-2 px-4 py-3 transition-colors sm:px-6',
							isActive
								? 'border-care-blue bg-care-blue/5'
								: 'border-transparent hover:bg-muted',
						)}>
						<span
							className={cn(
								'text-xs font-bold uppercase',
								isActive ? 'text-care-blue' : 'text-muted-foreground',
							)}>
							{tab.day}
						</span>
						<span
							className={cn(
								'text-lg font-bold',
								isActive ? 'text-care-blue' : 'text-foreground',
							)}>
							{tab.date}
						</span>
					</button>
				);
			})}
		</div>
	);
}
