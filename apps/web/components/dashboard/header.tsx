import { Bell, Search } from 'lucide-react';
import Image from 'next/image';

export function Header() {
	return (
		<header className='flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-6 lg:px-10'>
			{/* Logo */}
			<Image src='/logo.svg' alt='Good Care' width={146} height={30} />

			{/* Right section */}
			<div className='flex items-center gap-4'>
				{/* Search */}
				<div className='hidden items-center rounded-lg bg-slate-100 sm:flex'>
					<div className='flex items-center justify-center pl-4'>
						<Search className='size-4 text-muted-foreground' />
					</div>
					<input
						type='text'
						placeholder='Search visits, carers, clients...'
						className='h-10 w-48 bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none lg:w-64'
					/>
				</div>

				{/* Mobile search */}
				<button className='flex size-10 items-center justify-center rounded-lg bg-slate-100 sm:hidden'>
					<Search className='size-4 text-muted-foreground' />
				</button>

				{/* Notifications */}
				<button className='flex size-10 items-center justify-center rounded-lg bg-slate-100 transition-colors hover:bg-slate-200'>
					<Bell className='size-4 text-muted-foreground' />
				</button>

				{/* Profile Avatar */}
				<div className='size-10 overflow-hidden rounded-full border-2 border-care-blue/20 bg-care-blue/10'>
					<div className='flex size-full items-center justify-center text-sm font-bold text-care-blue'>
						JD
					</div>
				</div>
			</div>
		</header>
	);
}
