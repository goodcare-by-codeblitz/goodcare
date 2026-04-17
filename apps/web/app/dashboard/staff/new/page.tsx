'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	createCarerInvite,
	getCurrentOrgContext,
	getOrgManagementError,
} from '@/lib/org-management';
import { ArrowLeft, ChevronRight, Info, Mail, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function FormSection({
	title,
	description,
	children,
	id,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
	id: string;
}) {
	return (
		<section
			aria-labelledby={`${id}-heading`}
			className='rounded-xl border border-border bg-white shadow-sm'>
			<div className='border-b border-border px-6 py-5'>
				<h2
					id={`${id}-heading`}
					className='font-heading text-base font-bold text-foreground'>
					{title}
				</h2>
				{description ? <p className='mt-1 text-sm text-slate-600'>{description}</p> : null}
			</div>
			<div className='px-6 py-6'>{children}</div>
		</section>
	);
}

export default function AddCarerPage() {
	const router = useRouter();
	const [organizationId, setOrganizationId] = useState<string | null>(null);
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				setIsLoading(true);
				setErrorMessage('');
				const org = await getCurrentOrgContext();
				if (isMounted) {
					setOrganizationId(org.organizationId);
				}
			} catch (error) {
				if (isMounted) {
					setErrorMessage(
						getOrgManagementError(error, 'Unable to load the current organization.'),
					);
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		void load();

		return () => {
			isMounted = false;
		};
	}, []);

	const canSubmit =
		Boolean(organizationId) &&
		Boolean(firstName.trim()) &&
		Boolean(lastName.trim()) &&
		Boolean(email.trim());

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!organizationId) {
			return;
		}

		try {
			setIsSubmitting(true);
			setErrorMessage('');
			await createCarerInvite(organizationId, {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim(),
			});
			router.push('/dashboard/staff');
		} catch (error) {
			setErrorMessage(
				getOrgManagementError(error, 'Unable to send carer invitation.'),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='mx-auto max-w-6/12 p-4'>
			<nav aria-label='Breadcrumb' className='mb-6'>
				<ol className='flex items-center gap-1.5 text-sm'>
					<li>
						<Link
							href='/dashboard/staff'
							className='font-medium text-slate-500 transition-colors hover:text-care-blue'>
							Staff Management
						</Link>
					</li>
					<li aria-hidden='true'>
						<ChevronRight className='size-3.5 text-slate-400' />
					</li>
					<li>
						<span className='font-semibold text-foreground' aria-current='page'>
							Add New Carer
						</span>
					</li>
				</ol>
			</nav>

			<div className='mb-8'>
				<div className='flex items-center gap-3'>
					<Link
						href='/dashboard/staff'
						className='flex size-9 items-center justify-center rounded-lg border border-border text-slate-500 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-care-blue/50 focus-visible:outline-none'
						aria-label='Back to Staff Management'>
						<ArrowLeft className='size-4' />
					</Link>
					<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
						Add New Care Professional
					</h1>
				</div>
				<p className='mt-3 max-w-xl text-sm leading-relaxed text-slate-600'>
					Send a dedicated carer invitation. This flow is separate from team admin
					and manager invites.
				</p>
			</div>

			<form onSubmit={handleSubmit} className='flex flex-col gap-6' noValidate>
				<FormSection
					id='personal'
					title='Invitation Details'
					description='We will send an invite to this carer so they can activate their access.'>
					<div className='grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2'>
						<div className='flex flex-col gap-2'>
							<Label htmlFor='firstName'>First Name</Label>
							<Input
								id='firstName'
								value={firstName}
								onChange={(event) => setFirstName(event.target.value)}
								placeholder='e.g. Sarah'
								autoComplete='given-name'
								className='h-10'
							/>
						</div>
						<div className='flex flex-col gap-2'>
							<Label htmlFor='lastName'>Last Name</Label>
							<Input
								id='lastName'
								value={lastName}
								onChange={(event) => setLastName(event.target.value)}
								placeholder='e.g. Jenkins'
								autoComplete='family-name'
								className='h-10'
							/>
						</div>
						<div className='flex flex-col gap-2 sm:col-span-2'>
							<Label htmlFor='email'>Email Address</Label>
							<Input
								id='email'
								type='email'
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder='e.g. sarah@example.com'
								autoComplete='email'
								className='h-10'
							/>
						</div>
						<div className='flex flex-col gap-2 sm:col-span-2'>
							<Label htmlFor='phone'>Phone Number</Label>
							<Input
								id='phone'
								type='tel'
								value={phone}
								onChange={(event) => setPhone(event.target.value)}
								placeholder='e.g. 07700 900000'
								autoComplete='tel'
								className='h-10'
							/>
							<p className='text-xs text-slate-500'>
								Phone is kept here for reference in the form, but only name and email
								are sent in this invitation-focused pass.
							</p>
						</div>
					</div>
				</FormSection>

				<div
					className='flex gap-3 rounded-xl border border-warning/30 bg-warning/5 p-5'
					role='note'>
					<Shield
						className='mt-0.5 size-5 shrink-0 text-warning'
						aria-hidden='true'
					/>
					<div>
						<p className='text-sm font-bold text-foreground'>Current Scope</p>
						<p className='mt-1 text-sm leading-relaxed text-slate-700'>
							Address details, compliance documents, and qualifications are not saved
							by this invite flow yet. They will be collected in a later onboarding
							step.
						</p>
					</div>
				</div>

				<div
					className='flex gap-3 rounded-xl border border-care-blue/20 bg-care-blue-light p-5'
					role='note'>
					<Info
						className='mt-0.5 size-5 shrink-0 text-care-blue'
						aria-hidden='true'
					/>
					<div>
						<p className='text-sm font-bold text-foreground'>Invitation Workflow</p>
						<p className='mt-1 text-sm leading-relaxed text-slate-700'>
							The carer will receive an email invitation and will be onboarded with
							the caregiver access path, separate from team admin and manager roles.
						</p>
					</div>
				</div>

				<div className='min-h-5'>
					{errorMessage ? (
						<p className='text-sm font-medium text-red-600'>{errorMessage}</p>
					) : null}
				</div>

				<div className='flex flex-col-reverse gap-3 border-b border-border pb-6 pt-6 sm:flex-row sm:justify-end'>
					<Link
						href='/dashboard/staff'
						className='inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'>
						Cancel
					</Link>
					<Button
						type='submit'
						size='lg'
						disabled={!canSubmit || isSubmitting || isLoading}
						className='h-11 gap-2 bg-care-blue px-6 text-sm font-semibold shadow-md hover:bg-care-blue-hover'>
						<Mail className='size-4' aria-hidden='true' />
						{isSubmitting ? 'Sending Invitation...' : 'Invite Care Professional'}
					</Button>
				</div>
			</form>
		</div>
	);
}
