'use client';

import { cn } from '@/lib/utils';

interface BarChartProps {
	data: { label: string; values: number[] }[];
	maxValue?: number;
	className?: string;
}

export function BarChart({ data, maxValue = 100, className }: BarChartProps) {
	return (
		<div className={cn('flex items-end gap-4 sm:gap-6', className)}>
			{data.map((item, i) => (
				<div key={i} className='flex flex-1 flex-col items-center gap-2'>
					<div className='flex h-32 w-full items-end justify-center gap-1'>
						{item.values.map((val, j) => (
							<div
								key={j}
								className={cn(
									'w-full max-w-4 rounded-t',
									j === 0 ? 'bg-care-blue/30' : 'bg-care-blue',
								)}
								style={{ height: `${(val / maxValue) * 100}%` }}
							/>
						))}
					</div>
					<span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
						{item.label}
					</span>
				</div>
			))}
		</div>
	);
}
