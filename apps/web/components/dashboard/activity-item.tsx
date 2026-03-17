import { cn } from '@/lib/utils';

interface ActivityItemProps {
	dotColor?: 'blue' | 'green';
	title: string;
	description: string;
	isLast?: boolean;
}

export function ActivityItem({
	dotColor = 'blue',
	title,
	description,
	isLast = false,
}: ActivityItemProps) {
	return (
		<div className='flex gap-3'>
			{/* Timeline dot + line */}
			<div className='flex flex-col items-center'>
				<div
					className={cn(
						'mt-1.5 size-2 shrink-0 rounded-full',
						dotColor === 'green' ? 'bg-success' : 'bg-care-blue',
					)}
				/>
				{!isLast && <div className='mt-1 w-px flex-1 bg-border' />}
			</div>

			{/* Content */}
			<div className={cn('pb-4', isLast && 'pb-0')}>
				<p className='text-sm font-semibold text-foreground'>{title}</p>
				<p className='text-xs leading-relaxed text-muted-foreground'>
					{description}
				</p>
			</div>
		</div>
	);
}
