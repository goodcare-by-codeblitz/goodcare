'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, Shield, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function CarerInviteAcceptedPage() {
	const searchParams = useSearchParams();
	const [platformMessage, setPlatformMessage] = useState('');
	const organizationName = searchParams.get('org') ?? 'Good Care';
	const inviteeName = searchParams.get('name') ?? 'Your account';
	const email = searchParams.get('email') ?? '';

	const handlePlaceholderDownload = (platform: 'ios' | 'android') => {
		setPlatformMessage(
			platform === 'ios'
				? 'The iPhone App Store link is coming soon. Your manager will share mobile install instructions in the meantime.'
				: 'The Android Play Store link is coming soon. Your manager will share mobile install instructions in the meantime.',
		);
	};

	const emailLine = useMemo(() => {
		if (!email) {
			return null;
		}

		return `The invite for ${email} has been accepted successfully.`;
	}, [email]);

	return (
		<div className='flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10'>
			<div className='w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-white shadow-sm'>
				<div className='border-b border-border bg-care-blue px-8 py-8 text-white'>
					<div className='flex items-center gap-3'>
						<div className='flex size-12 items-center justify-center rounded-2xl bg-white/15'>
							<Shield className='size-6' aria-hidden='true' />
						</div>
						<div>
							<p className='text-sm font-semibold uppercase tracking-[0.2em] text-white/75'>
								Invitation accepted
							</p>
							<h1 className='mt-1 text-2xl font-bold'>
								Welcome to {organizationName}
							</h1>
						</div>
					</div>
				</div>

				<div className='space-y-6 px-8 py-8'>
					<div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5'>
						<div className='flex items-start gap-3'>
							<CheckCircle2 className='mt-0.5 size-5 shrink-0 text-emerald-700' />
							<div>
								<p className='text-sm font-semibold text-foreground'>
									{inviteeName} is ready for the carer mobile app.
								</p>
								<p className='mt-2 text-sm leading-relaxed text-slate-700'>
									Your carer invitation has been accepted and linked to the staff
									record. Carers use the mobile app rather than the web management
									dashboard.
								</p>
								{emailLine ? (
									<p className='mt-2 text-sm leading-relaxed text-slate-700'>
										{emailLine}
									</p>
								) : null}
							</div>
						</div>
					</div>

					<div className='rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5'>
						<p className='text-sm font-semibold text-foreground'>
							Download the carer mobile app
						</p>
						<p className='mt-2 text-sm leading-relaxed text-slate-700'>
							Choose a platform below. Store links are placeholder buttons for now,
							so your manager can continue onboarding while the final app-store
							listings are being prepared.
						</p>
						<div className='mt-4 flex flex-col gap-3 sm:flex-row'>
							<Button
								type='button'
								onClick={() => handlePlaceholderDownload('ios')}
								className='gap-2'>
								<Smartphone className='size-4' aria-hidden='true' />
								Download on iPhone
							</Button>
							<Button
								type='button'
								variant='outline'
								onClick={() => handlePlaceholderDownload('android')}
								className='gap-2'>
								<Download className='size-4' aria-hidden='true' />
								Download on Android
							</Button>
						</div>
						{platformMessage ? (
							<p className='mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
								{platformMessage}
							</p>
						) : null}
					</div>

					<div className='flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end'>
						<Link href='/' className='sm:mr-auto'>
							<Button variant='outline'>Back home</Button>
						</Link>
						<Button
							type='button'
							onClick={() => handlePlaceholderDownload('ios')}
							className='gap-2'>
							Try iPhone download
							<Download className='size-4' aria-hidden='true' />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
