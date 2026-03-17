import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type BadgeVariant =
	| 'in-progress'
	| 'running-late'
	| 'en-route'
	| 'pending'
	| 'accepted'
	| 'completed';

const variantStyles: Record<BadgeVariant, string> = {
	'in-progress': 'bg-emerald-50 text-emerald-600 border-emerald-200',
	'running-late': 'bg-amber-50 text-amber-600 border-amber-200',
	'en-route': 'bg-blue-50 text-care-blue border-blue-200',
	pending: 'bg-amber-50 text-amber-600 border-amber-200',
	accepted: 'bg-emerald-50 text-emerald-600 border-emerald-200',
	completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

const variantDotStyles: Record<BadgeVariant, string> = {
	'in-progress': 'bg-emerald-500',
	'running-late': 'bg-amber-500',
	'en-route': 'bg-care-blue',
	pending: 'bg-amber-500',
	accepted: 'bg-emerald-500',
	completed: 'bg-emerald-500',
};

interface StatusBadgeProps {
	variant: BadgeVariant;
	label: string;
	icon?: LucideIcon;
	className?: string;
}

export function StatusBadge({
	variant,
	label,
	icon: Icon,
	className,
}: StatusBadgeProps) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
				variantStyles[variant],
				className,
			)}>
			{Icon ? (
				<Icon className='size-3' />
			) : (
				<span
					className={cn('size-1.5 rounded-full', variantDotStyles[variant])}
				/>
			)}
			{label}
		</span>
	);
}
