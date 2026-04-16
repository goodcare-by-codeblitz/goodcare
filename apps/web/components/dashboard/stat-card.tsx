import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
	title: string;
	value: string;
	change?: {
		value: string;
		trend: 'up' | 'down' | 'neutral';
	};
	subtitle?: string;
	icon: LucideIcon;
	iconClassName?: string;
	className?: string;
}

export function StatCard({
	title,
	value,
	change,
	subtitle,
	icon: Icon,
	iconClassName,
	className,
}: StatCardProps) {
	return (
		<div
			className={cn(
				'flex flex-col gap-1 rounded-xl border border-border bg-white p-5 shadow-sm',
				className,
			)}>
			<div className='flex items-start justify-between'>
				<span className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
					{title}
				</span>
				<Icon className={cn('size-5', iconClassName)} />
			</div>
			<span className='text-2xl font-bold text-foreground'>{value}</span>
			{change && (
				<div className='flex items-center gap-1 pt-1'>
					{change.trend === 'up' ? (
						<TrendingUp className='size-3 text-success' />
					) : change.trend === 'down' ? (
						<TrendingDown className='size-3 text-error' />
					) : null}
					<span
						className={cn(
							'text-xs font-bold',
							change.trend === 'up' && 'text-success',
							change.trend === 'down' && 'text-error',
							change.trend === 'neutral' && 'text-muted-foreground',
						)}>
						{change.value}
					</span>
				</div>
			)}
			{subtitle && (
				<span className='pt-1 text-xs font-medium text-muted-foreground'>
					{subtitle}
				</span>
			)}
		</div>
	);
}
