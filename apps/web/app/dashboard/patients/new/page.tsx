'use client';

import { BoundingBox } from '@/components/dashboard/bounding-box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	NativeSelect,
	NativeSelectOption,
} from '@/components/ui/native-select';
import {
	createPatient,
	getCurrentOrgContext,
	getOrgManagementError,
	hasOrgPermission,
	type OrgContext,
	type PatientGender,
} from '@/lib/org-management';
import { ArrowLeft, ChevronRight, ClipboardList, Pill, Route, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';

const setupSteps = [
	{
		title: 'Profile',
		description: 'Address, emergency contacts, allergies, and care requirements.',
		icon: UserRound,
	},
	{
		title: 'Care plan',
		description: 'Create the first structured care plan when the patient is ready.',
		icon: ClipboardList,
	},
	{
		title: 'Medication',
		description: 'Add active medication orders and start administration logging.',
		icon: Pill,
	},
	{
		title: 'Rota',
		description: 'Schedule the first visits and assign carers when appropriate.',
		icon: Route,
	},
];

function FormSection({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<section className='rounded-2xl border border-border bg-white shadow-sm'>
			<div className='border-b border-border px-6 py-5'>
				<h2 className='font-heading text-base font-bold text-foreground'>{title}</h2>
				<p className='mt-1 text-sm text-slate-600'>{description}</p>
			</div>
			<div className='px-6 py-6'>{children}</div>
		</section>
	);
}

export default function AddPatientPage() {
	const router = useRouter();
	const [orgContext, setOrgContext] = useState<OrgContext | null>(null);
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [dateOfBirth, setDateOfBirth] = useState('');
	const [gender, setGender] = useState<PatientGender>('NOT_SPECIFIED');
	const [genderDescription, setGenderDescription] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				const context = await getCurrentOrgContext();
				if (!isMounted) {
					return;
				}

				setOrgContext(context);
				if (!hasOrgPermission(context, 'manage_patients')) {
					setErrorMessage('You do not have permission to create patients.');
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

	const canManagePatients = orgContext
		? hasOrgPermission(orgContext, 'manage_patients')
		: false;

	const canSubmit =
		canManagePatients &&
		firstName.trim().length > 0 &&
		lastName.trim().length > 0 &&
		dateOfBirth.length > 0;

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!orgContext || !canManagePatients || !canSubmit) {
			return;
		}

		try {
			setIsSubmitting(true);
			setErrorMessage('');

			const patient = await createPatient(orgContext.organizationId, {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				dateOfBirth,
				gender,
				genderDescription: gender === 'OTHER' ? genderDescription.trim() : undefined,
			});

			router.push(`/dashboard/patients/${patient.id}?setup=profile`);
		} catch (error) {
			setErrorMessage(getOrgManagementError(error, 'Unable to create this patient.'));
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<BoundingBox className='max-w-4xl'>
				<p className='text-sm text-slate-500'>Loading patient creation flow...</p>
			</BoundingBox>
		);
	}

	if (!canManagePatients) {
		return (
			<BoundingBox className='max-w-4xl'>
				<p className='text-sm font-semibold text-foreground'>
					{errorMessage || 'You do not have permission to create patients.'}
				</p>
				<Link
					href='/dashboard/patients'
					className='mt-3 inline-flex text-sm font-semibold text-care-blue hover:underline'>
					Back to Patients
				</Link>
			</BoundingBox>
		);
	}

	return (
		<BoundingBox className='max-w-5xl'>
			<nav aria-label='Breadcrumb' className='mb-6'>
				<ol className='flex items-center gap-1.5 text-sm'>
					<li>
						<Link href='/dashboard/patients' className='font-medium text-slate-500 hover:text-care-blue'>
							Patients
						</Link>
					</li>
					<li aria-hidden='true'>
						<ChevronRight className='size-3.5 text-slate-400' />
					</li>
					<li className='font-semibold text-foreground'>New patient</li>
				</ol>
			</nav>

			<div className='mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
				<div>
					<div className='flex items-center gap-3'>
						<Link
							href='/dashboard/patients'
							className='flex size-9 items-center justify-center rounded-lg border border-border text-slate-500 hover:bg-muted hover:text-foreground'
							aria-label='Back to Patients'>
							<ArrowLeft className='size-4' />
						</Link>
						<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
							Create patient record
						</h1>
					</div>
					<p className='mt-3 max-w-2xl text-sm leading-relaxed text-slate-600'>
						Start with the core patient profile the backend stores today. After
						creation, the dashboard moves straight into the staged setup flow for
						profile details, care planning, medication, and rota.
					</p>
				</div>
			</div>

			{errorMessage ? (
				<p className='mb-4 text-sm font-medium text-red-600'>{errorMessage}</p>
			) : null}

			<div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]'>
				<form className='space-y-6' onSubmit={handleSubmit}>
					<FormSection
						title='Core patient profile'
						description='Only persisted patient fields are collected here. Richer setup continues after the initial record is created.'>
						<div className='grid gap-5 md:grid-cols-2'>
							<div className='space-y-2'>
								<Label htmlFor='firstName'>First name</Label>
								<Input
									id='firstName'
									value={firstName}
									onChange={(event) => setFirstName(event.target.value)}
									placeholder='Aisha'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='lastName'>Last name</Label>
								<Input
									id='lastName'
									value={lastName}
									onChange={(event) => setLastName(event.target.value)}
									placeholder='Rahman'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='dateOfBirth'>Date of birth</Label>
								<Input
									id='dateOfBirth'
									type='date'
									value={dateOfBirth}
									onChange={(event) => setDateOfBirth(event.target.value)}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='gender'>Gender</Label>
								<NativeSelect
									id='gender'
									className='w-full'
									value={gender}
									onChange={(event) =>
										setGender(event.target.value as PatientGender)
									}>
									<NativeSelectOption value='NOT_SPECIFIED'>Not specified</NativeSelectOption>
									<NativeSelectOption value='MALE'>Male</NativeSelectOption>
									<NativeSelectOption value='FEMALE'>Female</NativeSelectOption>
									<NativeSelectOption value='OTHER'>Other</NativeSelectOption>
								</NativeSelect>
							</div>
							{gender === 'OTHER' ? (
								<div className='space-y-2 md:col-span-2'>
									<Label htmlFor='genderDescription'>Gender description</Label>
									<Input
										id='genderDescription'
										value={genderDescription}
										onChange={(event) => setGenderDescription(event.target.value)}
										placeholder='Describe the gender identity to record'
									/>
								</div>
							) : null}
						</div>
					</FormSection>

					<div className='flex items-center justify-end gap-3'>
						<Link href='/dashboard/patients'>
							<Button type='button' variant='outline' size='lg'>
								Cancel
							</Button>
						</Link>
						<Button type='submit' size='lg' disabled={!canSubmit || isSubmitting}>
							{isSubmitting ? 'Creating patient...' : 'Create and continue setup'}
						</Button>
					</div>
				</form>

				<aside className='rounded-2xl border border-border bg-white p-5 shadow-sm'>
					<h2 className='font-heading text-base font-bold text-foreground'>What happens next</h2>
					<p className='mt-2 text-sm leading-relaxed text-slate-600'>
						The initial save only creates the patient record. The setup flow then
						guides the team through the patient-specific work that follows.
					</p>
					<div className='mt-5 space-y-4'>
						{setupSteps.map((step, index) => (
							<div key={step.title} className='flex gap-3'>
								<div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-care-blue-light text-care-blue'>
									<span className='text-sm font-semibold'>{index + 1}</span>
								</div>
								<div>
									<div className='flex items-center gap-2'>
										<step.icon className='size-4 text-slate-400' />
										<p className='text-sm font-semibold text-foreground'>{step.title}</p>
									</div>
									<p className='mt-1 text-sm text-slate-600'>{step.description}</p>
								</div>
							</div>
						))}
					</div>
				</aside>
			</div>
		</BoundingBox>
	);
}
