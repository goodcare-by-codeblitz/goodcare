import type { ReactNode } from 'react';

interface VisitRowProps {
	initials: string;
	avatarColor: string;
	name: string;
	detail: string;
	timeRange: string;
	category: string;
	badge: ReactNode;
}

export function VisitRow({
	initials,
	avatarColor,
	name,
	detail,
	timeRange,
	category,
	badge,
}: VisitRowProps) {
	return (
		<div className='flex items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-muted/50'>
			{/* Avatar */}
			<div
				className='flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white'
				style={{ backgroundColor: avatarColor }}>
				{initials}
			</div>

			{/* Info */}
			<div className='min-w-0 flex-1'>
				<p className='text-sm font-semibold text-foreground'>{name}</p>
				<p className='truncate text-xs text-muted-foreground'>{detail}</p>
			</div>

			{/* Time + Category */}
			<div className='hidden shrink-0 text-right sm:block'>
				<p className='text-sm font-semibold text-foreground'>{timeRange}</p>
				<p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
					{category}
				</p>
			</div>

			{/* Status Badge */}
			<div className='shrink-0'>{badge}</div>
		</div>
	);
}
