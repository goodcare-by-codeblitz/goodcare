import clsx from 'clsx';
import { PropsWithChildren } from 'react';

type BoundingBoxProps = PropsWithChildren<{
	className?: string;
}>;

export function BoundingBox({ children, className }: BoundingBoxProps) {
	return (
		<div className={clsx('mx-auto max-w-10/12 p-4 lg:p-8', className)}>
			{children}
		</div>
	);
}
