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
	deletePatient,
	fetchCarePlans,
	fetchMedications,
	fetchPatientProfile,
	fetchVisits,
	getCurrentOrgContext,
	getOrgManagementError,
	hasOrgPermission,
	updatePatient,
	updatePatientProfile,
	type OrgContext,
	type PatientGender,
	type PatientProfile,
	type PatientStatus,
} from '@/lib/org-management';
import { cn } from '@/lib/utils';
import {
	AlertTriangle,
	ArrowLeft,
	CalendarClock,
	ChevronRight,
	ClipboardList,
	Pill,
	Plus,
	Route,
	Save,
	UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { use, useEffect, useState, type ReactNode } from 'react';

type SetupStepKey = 'profile' | 'care-plan' | 'medication' | 'rota';

type ContactForm = {
	name: string;
	relationship: string;
	phone: string;
	email: string;
	isPrimary: boolean;
};

type AllergyForm = {
	name: string;
	notes: string;
};

type PatientFormState = {
	firstName: string;
	lastName: string;
	dateOfBirth: string;
	gender: PatientGender;
	genderDescription: string;
	status: PatientStatus;
	addressLine1: string;
	addressLine2: string;
	city: string;
	postcode: string;
	country: string;
	emergencyContacts: ContactForm[];
	allergies: AllergyForm[];
	medicalSummary: string;
	careRequirements: string;
};

const textAreaClassName =
	'min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50';

const setupSteps: Array<{
	key: SetupStepKey;
	title: string;
	description: string;
	href: (patientId: string) => string;
	icon: typeof UserRound;
}> = [
	{
		key: 'profile',
		title: 'Profile',
		description: 'Complete the address, emergency contacts, allergies, and care requirements.',
		href: (patientId) => `/dashboard/patients/${patientId}?setup=profile`,
		icon: UserRound,
	},
	{
		key: 'care-plan',
		title: 'Care plan',
		description: 'Create or review the structured care plan for this patient.',
		href: (patientId) => `/dashboard/patients/${patientId}/care-plans`,
		icon: ClipboardList,
	},
	{
		key: 'medication',
		title: 'Medication',
		description: 'Add active medication orders and begin administration tracking.',
		href: (patientId) => `/dashboard/patients/${patientId}/medications`,
		icon: Pill,
	},
	{
		key: 'rota',
		title: 'Rota',
		description: 'Schedule patient visits and assign carers when the rota is ready.',
		href: (patientId) => `/dashboard/patients/${patientId}/rota`,
		icon: Route,
	},
];

function formatDate(date: string) {
	return new Date(date).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

function formatDateTime(date: string) {
	return new Date(date).toLocaleString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function formatAge(date: string) {
	const birthDate = new Date(date);
	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const hasHadBirthday =
		today.getMonth() > birthDate.getMonth() ||
		(today.getMonth() === birthDate.getMonth() &&
			today.getDate() >= birthDate.getDate());

	if (!hasHadBirthday) {
		age -= 1;
	}

	return age;
}

function emptyForm(): PatientFormState {
	return {
		firstName: '',
		lastName: '',
		dateOfBirth: '',
		gender: 'NOT_SPECIFIED',
		genderDescription: '',
		status: 'ACTIVE',
		addressLine1: '',
		addressLine2: '',
		city: '',
		postcode: '',
		country: 'United Kingdom',
		emergencyContacts: [
			{
				name: '',
				relationship: '',
				phone: '',
				email: '',
				isPrimary: true,
			},
		],
		allergies: [{ name: '', notes: '' }],
		medicalSummary: '',
		careRequirements: '',
	};
}

function toFormState(profile: PatientProfile): PatientFormState {
	return {
		firstName: profile.firstName,
		lastName: profile.lastName,
		dateOfBirth: profile.dateOfBirth.slice(0, 10),
		gender: profile.gender,
		genderDescription: profile.genderDescription ?? '',
		status: profile.status,
		addressLine1: profile.address?.line1 ?? '',
		addressLine2: profile.address?.line2 ?? '',
		city: profile.address?.city ?? '',
		postcode: profile.address?.postcode ?? '',
		country: profile.address?.country ?? 'United Kingdom',
		emergencyContacts:
			profile.emergencyContacts.length > 0
				? profile.emergencyContacts.map((contact) => ({
						name: contact.name,
						relationship: contact.relationship,
						phone: contact.phone,
						email: contact.email ?? '',
						isPrimary: contact.isPrimary,
				  }))
				: emptyForm().emergencyContacts,
		allergies:
			profile.allergies.length > 0
				? profile.allergies.map((allergy) => ({
						name: allergy.name,
						notes: allergy.notes ?? '',
				  }))
				: emptyForm().allergies,
		medicalSummary: profile.medicalSummary ?? '',
		careRequirements: profile.careRequirements ?? '',
	};
}

function StatusBadge({ status }: { status: PatientStatus }) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
				status === 'ACTIVE'
					? 'border border-success/20 bg-success/10 text-success'
					: 'border border-slate-200 bg-slate-100 text-slate-600',
			)}>
			{status === 'ACTIVE' ? 'Active' : 'Inactive'}
		</span>
	);
}

function Section({
	title,
	description,
	children,
	action,
}: {
	title: string;
	description?: string;
	children: ReactNode;
	action?: ReactNode;
}) {
	return (
		<section className='rounded-2xl border border-border bg-white shadow-sm'>
			<div className='flex flex-col gap-3 border-b border-border px-6 py-5 sm:flex-row sm:items-start sm:justify-between'>
				<div>
					<h2 className='font-heading text-base font-bold text-foreground'>{title}</h2>
					{description ? <p className='mt-1 text-sm text-slate-600'>{description}</p> : null}
				</div>
				{action}
			</div>
			<div className='px-6 py-6'>{children}</div>
		</section>
	);
}

function SummaryCard({
	label,
	value,
	meta,
}: {
	label: string;
	value: string | number;
	meta: string;
}) {
	return (
		<div className='rounded-2xl border border-border bg-white px-5 py-4 shadow-sm'>
			<p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{label}</p>
			<p className='mt-2 text-2xl font-bold text-foreground'>{value}</p>
			<p className='mt-1 text-sm text-slate-500'>{meta}</p>
		</div>
	);
}

export default function PatientHubPage({
	params,
}: {
	params: Promise<{ patientId: string }>;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { patientId } = use(params);
	const activeSetupStep = (searchParams.get('setup') ?? 'profile') as SetupStepKey;
	const [orgContext, setOrgContext] = useState<OrgContext | null>(null);
	const [profile, setProfile] = useState<PatientProfile | null>(null);
	const [form, setForm] = useState<PatientFormState>(emptyForm());
	const [workflowCounts, setWorkflowCounts] = useState({
		carePlans: 0,
		medications: 0,
		visits: 0,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [confirmDelete, setConfirmDelete] = useState(false);

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				const context = await getCurrentOrgContext();
				if (!isMounted) {
					return;
				}

				setOrgContext(context);
				if (!hasOrgPermission(context, 'view_patients')) {
					setErrorMessage('You do not have permission to view patients.');
					return;
				}

				const [nextProfile, carePlansResult, medicationsResult, visitsResult] =
					await Promise.all([
						fetchPatientProfile(context.organizationId, patientId),
						hasOrgPermission(context, 'view_care_plans')
							? fetchCarePlans(context.organizationId, {
									patientId,
									page: 1,
									limit: 50,
							  })
							: Promise.resolve({ carePlans: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } }),
						hasOrgPermission(context, 'view_medications')
							? fetchMedications(context.organizationId, {
									patientId,
									page: 1,
									limit: 50,
							  })
							: Promise.resolve({ medications: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } }),
						hasOrgPermission(context, 'view_visits')
							? fetchVisits(context.organizationId, {
									patientId,
									page: 1,
									limit: 50,
							  })
							: Promise.resolve({ visits: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } }),
					]);

				if (!isMounted) {
					return;
				}

				setProfile(nextProfile);
				setForm(toFormState(nextProfile));
				setWorkflowCounts({
					carePlans: carePlansResult.pagination.total,
					medications: medicationsResult.pagination.total,
					visits: visitsResult.pagination.total,
				});
			} catch (error) {
				if (isMounted) {
					setErrorMessage(
						getOrgManagementError(error, 'Unable to load patient setup.'),
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
	}, [patientId]);

	const canManagePatients = orgContext
		? hasOrgPermission(orgContext, 'manage_patients')
		: false;

	const handleContactChange = (
		index: number,
		key: keyof ContactForm,
		value: string | boolean,
	) => {
		setForm((current) => ({
			...current,
			emergencyContacts: current.emergencyContacts.map((contact, contactIndex) =>
				contactIndex === index ? { ...contact, [key]: value } : contact,
			),
		}));
	};

	const handleAllergyChange = (index: number, key: keyof AllergyForm, value: string) => {
		setForm((current) => ({
			...current,
			allergies: current.allergies.map((allergy, allergyIndex) =>
				allergyIndex === index ? { ...allergy, [key]: value } : allergy,
			),
		}));
	};

	const handleSave = async () => {
		if (!orgContext || !profile || !canManagePatients) {
			return;
		}

		try {
			setIsSaving(true);
			setErrorMessage('');
			setSuccessMessage('');

			const [updatedPatient, updatedProfile] = await Promise.all([
				updatePatient(orgContext.organizationId, profile.id, {
					firstName: form.firstName.trim(),
					lastName: form.lastName.trim(),
					dateOfBirth: form.dateOfBirth,
					gender: form.gender,
					genderDescription:
						form.gender === 'OTHER' ? form.genderDescription.trim() : '',
					status: form.status,
				}),
				updatePatientProfile(orgContext.organizationId, profile.id, {
					address: form.addressLine1.trim()
						? {
								line1: form.addressLine1.trim(),
								line2: form.addressLine2.trim() || undefined,
								city: form.city.trim(),
								postcode: form.postcode.trim(),
								country: form.country.trim(),
						  }
						: null,
					emergencyContacts: form.emergencyContacts
						.map((contact) => ({
							name: contact.name.trim(),
							relationship: contact.relationship.trim(),
							phone: contact.phone.trim(),
							email: contact.email.trim() || undefined,
							isPrimary: contact.isPrimary,
						}))
						.filter(
							(contact) =>
								contact.name.length > 0 &&
								contact.relationship.length > 0 &&
								contact.phone.length > 0,
						),
					allergies: form.allergies
						.map((allergy) => ({
							name: allergy.name.trim(),
							notes: allergy.notes.trim() || undefined,
						}))
						.filter((allergy) => allergy.name.length > 0),
					medicalSummary: form.medicalSummary.trim() || null,
					careRequirements: form.careRequirements.trim() || null,
				}),
			]);

			const mergedProfile: PatientProfile = {
				...updatedProfile,
				firstName: updatedPatient.firstName,
				lastName: updatedPatient.lastName,
				dateOfBirth: updatedPatient.dateOfBirth,
				gender: updatedPatient.gender,
				genderDescription: updatedPatient.genderDescription,
				status: updatedPatient.status,
				createdAt: profile.createdAt,
				updatedAt: updatedPatient.updatedAt,
			};

			setProfile(mergedProfile);
			setForm(toFormState(mergedProfile));
			setSuccessMessage('Patient setup saved successfully.');
		} catch (error) {
			setErrorMessage(
				getOrgManagementError(error, 'Unable to save patient setup.'),
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!orgContext || !profile || !canManagePatients) {
			return;
		}

		try {
			setIsSaving(true);
			await deletePatient(orgContext.organizationId, profile.id);
			router.push('/dashboard/patients');
		} catch (error) {
			setErrorMessage(
				getOrgManagementError(error, 'Unable to delete this patient.'),
			);
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<BoundingBox className='max-w-6xl'>
				<p className='text-sm text-slate-500'>Loading patient setup...</p>
			</BoundingBox>
		);
	}

	if (!profile || !orgContext || !hasOrgPermission(orgContext, 'view_patients')) {
		return (
			<BoundingBox className='max-w-5xl'>
				<p className='text-sm font-semibold text-foreground'>
					{errorMessage || 'Patient not found.'}
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
		<BoundingBox className='max-w-7xl'>
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
					<li className='font-semibold text-foreground'>
						{profile.firstName} {profile.lastName}
					</li>
				</ol>
			</nav>

			<div className='mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
				<div>
					<div className='flex flex-wrap items-center gap-3'>
						<Link
							href='/dashboard/patients'
							className='flex size-9 items-center justify-center rounded-lg border border-border text-slate-500 hover:bg-muted hover:text-foreground'
							aria-label='Back to Patients'>
							<ArrowLeft className='size-4' />
						</Link>
						<h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
							{profile.firstName} {profile.lastName}
						</h1>
						<StatusBadge status={form.status} />
					</div>
					<p className='mt-3 max-w-3xl text-sm leading-relaxed text-slate-600'>
						This patient hub keeps the profile data alongside the patient-scoped
						workflows for care plans, medication, and rota. Profile details save here,
						while operational workflows stay in their dedicated modules.
					</p>
				</div>

				{canManagePatients ? (
					<div className='flex flex-wrap items-center gap-3'>
						<Button size='lg' onClick={handleSave} disabled={isSaving}>
							<Save className='size-4' />
							{isSaving ? 'Saving...' : 'Save patient setup'}
						</Button>
					</div>
				) : null}
			</div>

			<div className='mb-5 min-h-5'>
				{errorMessage ? <p className='text-sm font-medium text-red-600'>{errorMessage}</p> : null}
				{successMessage ? <p className='text-sm font-medium text-green-600'>{successMessage}</p> : null}
			</div>

			<div className='mb-6 grid gap-4 md:grid-cols-4'>
				<SummaryCard
					label='Age'
					value={formatAge(profile.dateOfBirth)}
					meta={`Born ${formatDate(profile.dateOfBirth)}`}
				/>
				<SummaryCard
					label='Care plans'
					value={workflowCounts.carePlans}
					meta='Structured plan versions linked to this patient'
				/>
				<SummaryCard
					label='Medications'
					value={workflowCounts.medications}
					meta='Current medication orders and records'
				/>
				<SummaryCard
					label='Visits'
					value={workflowCounts.visits}
					meta='Patient-scoped rota visits'
				/>
			</div>

			<Section
				title='Setup journey'
				description='Use the staged setup flow to move from profile details into patient-scoped operational workflows.'>
				<div className='grid gap-4 lg:grid-cols-4'>
					{setupSteps.map((step) => {
						const isActive = step.key === activeSetupStep;
						return (
							<Link
								key={step.key}
								href={step.href(profile.id)}
								className={cn(
									'rounded-2xl border px-4 py-4 transition-colors hover:border-care-blue/40 hover:bg-care-blue-light/40',
									isActive
										? 'border-care-blue bg-care-blue-light/50'
										: 'border-border bg-slate-50/70',
								)}>
								<div className='flex items-center gap-3'>
									<div className='flex size-10 items-center justify-center rounded-xl bg-white text-care-blue shadow-sm'>
										<step.icon className='size-5' />
									</div>
									<div>
										<p className='text-sm font-semibold text-foreground'>{step.title}</p>
										<p className='mt-1 text-sm text-slate-600'>{step.description}</p>
									</div>
								</div>
							</Link>
						);
					})}
				</div>
			</Section>

			<div className='mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]'>
				<div className='space-y-6'>
					<Section
						title='Core patient record'
						description='These are the persisted demographic fields on the patient itself.'>
						<div className='grid gap-5 md:grid-cols-2'>
							<div className='space-y-2'>
								<Label htmlFor='firstName'>First name</Label>
								<Input
									id='firstName'
									disabled={!canManagePatients}
									value={form.firstName}
									onChange={(event) =>
										setForm((current) => ({ ...current, firstName: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='lastName'>Last name</Label>
								<Input
									id='lastName'
									disabled={!canManagePatients}
									value={form.lastName}
									onChange={(event) =>
										setForm((current) => ({ ...current, lastName: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='dateOfBirth'>Date of birth</Label>
								<Input
									id='dateOfBirth'
									type='date'
									disabled={!canManagePatients}
									value={form.dateOfBirth}
									onChange={(event) =>
										setForm((current) => ({ ...current, dateOfBirth: event.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='status'>Status</Label>
								<NativeSelect
									id='status'
									className='w-full'
									disabled={!canManagePatients}
									value={form.status}
									onChange={(event) =>
										setForm((current) => ({
											...current,
											status: event.target.value as PatientStatus,
										}))
									}>
									<NativeSelectOption value='ACTIVE'>Active</NativeSelectOption>
									<NativeSelectOption value='INACTIVE'>Inactive</NativeSelectOption>
								</NativeSelect>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='gender'>Gender</Label>
								<NativeSelect
									id='gender'
									className='w-full'
									disabled={!canManagePatients}
									value={form.gender}
									onChange={(event) =>
										setForm((current) => ({
											...current,
											gender: event.target.value as PatientGender,
										}))
									}>
									<NativeSelectOption value='NOT_SPECIFIED'>Not specified</NativeSelectOption>
									<NativeSelectOption value='MALE'>Male</NativeSelectOption>
									<NativeSelectOption value='FEMALE'>Female</NativeSelectOption>
									<NativeSelectOption value='OTHER'>Other</NativeSelectOption>
								</NativeSelect>
							</div>
							{form.gender === 'OTHER' ? (
								<div className='space-y-2 md:col-span-2'>
									<Label htmlFor='genderDescription'>Gender description</Label>
									<Input
										id='genderDescription'
										disabled={!canManagePatients}
										value={form.genderDescription}
										onChange={(event) =>
											setForm((current) => ({
												...current,
												genderDescription: event.target.value,
											}))
										}
									/>
								</div>
							) : null}
						</div>
					</Section>

					<Section
						title='Address and contact safety net'
						description='These profile-adjacent details support onboarding, communication, and care delivery.'>
						<div className='space-y-6'>
							<div className='grid gap-5 md:grid-cols-2'>
								<div className='space-y-2 md:col-span-2'>
									<Label htmlFor='addressLine1'>Address line 1</Label>
									<Input
										id='addressLine1'
										disabled={!canManagePatients}
										value={form.addressLine1}
										onChange={(event) =>
											setForm((current) => ({ ...current, addressLine1: event.target.value }))
										}
									/>
								</div>
								<div className='space-y-2 md:col-span-2'>
									<Label htmlFor='addressLine2'>Address line 2</Label>
									<Input
										id='addressLine2'
										disabled={!canManagePatients}
										value={form.addressLine2}
										onChange={(event) =>
											setForm((current) => ({ ...current, addressLine2: event.target.value }))
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='city'>City</Label>
									<Input
										id='city'
										disabled={!canManagePatients}
										value={form.city}
										onChange={(event) =>
											setForm((current) => ({ ...current, city: event.target.value }))
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='postcode'>Postcode</Label>
									<Input
										id='postcode'
										disabled={!canManagePatients}
										value={form.postcode}
										onChange={(event) =>
											setForm((current) => ({ ...current, postcode: event.target.value }))
										}
									/>
								</div>
								<div className='space-y-2 md:col-span-2'>
									<Label htmlFor='country'>Country</Label>
									<Input
										id='country'
										disabled={!canManagePatients}
										value={form.country}
										onChange={(event) =>
											setForm((current) => ({ ...current, country: event.target.value }))
										}
									/>
								</div>
							</div>

							<div>
								<div className='mb-3 flex items-center justify-between gap-3'>
									<div>
										<h3 className='text-sm font-semibold text-foreground'>Emergency contacts</h3>
										<p className='text-sm text-slate-600'>
											Add the people the team should contact when urgent support is needed.
										</p>
									</div>
									{canManagePatients ? (
										<Button
											type='button'
											variant='outline'
											size='sm'
											onClick={() =>
												setForm((current) => ({
													...current,
													emergencyContacts: [
														...current.emergencyContacts,
														{
															name: '',
															relationship: '',
															phone: '',
															email: '',
															isPrimary: current.emergencyContacts.length === 0,
														},
													],
												}))
											}>
											<Plus className='size-4' />
											Add contact
										</Button>
									) : null}
								</div>

								<div className='space-y-4'>
									{form.emergencyContacts.map((contact, index) => (
										<div key={`${index}-${contact.name}`} className='rounded-2xl border border-border p-4'>
											<div className='mb-4 flex items-center justify-between gap-3'>
												<p className='text-sm font-semibold text-foreground'>
													Contact {index + 1}
												</p>
												{canManagePatients && form.emergencyContacts.length > 1 ? (
													<Button
														type='button'
														variant='ghost'
														size='sm'
														onClick={() =>
															setForm((current) => ({
																...current,
																emergencyContacts: current.emergencyContacts.filter(
																	(_, contactIndex) => contactIndex !== index,
																),
															}))
														}>
														Remove
													</Button>
												) : null}
											</div>
											<div className='grid gap-4 md:grid-cols-2'>
												<div className='space-y-2'>
													<Label>Name</Label>
													<Input
														disabled={!canManagePatients}
														value={contact.name}
														onChange={(event) =>
															handleContactChange(index, 'name', event.target.value)
														}
													/>
												</div>
												<div className='space-y-2'>
													<Label>Relationship</Label>
													<Input
														disabled={!canManagePatients}
														value={contact.relationship}
														onChange={(event) =>
															handleContactChange(index, 'relationship', event.target.value)
														}
													/>
												</div>
												<div className='space-y-2'>
													<Label>Phone</Label>
													<Input
														disabled={!canManagePatients}
														value={contact.phone}
														onChange={(event) =>
															handleContactChange(index, 'phone', event.target.value)
														}
													/>
												</div>
												<div className='space-y-2'>
													<Label>Email</Label>
													<Input
														disabled={!canManagePatients}
														value={contact.email}
														onChange={(event) =>
															handleContactChange(index, 'email', event.target.value)
														}
													/>
												</div>
												<label className='inline-flex items-center gap-2 text-sm text-slate-700 md:col-span-2'>
													<input
														type='checkbox'
														className='size-4 rounded border-border'
														disabled={!canManagePatients}
														checked={contact.isPrimary}
														onChange={(event) =>
															setForm((current) => ({
																...current,
																emergencyContacts: current.emergencyContacts.map(
																	(existingContact, contactIndex) => ({
																		...existingContact,
																		isPrimary:
																			contactIndex === index ? event.target.checked : false,
																	}),
																),
															}))
														}
													/>
													Primary emergency contact
												</label>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</Section>

					<Section
						title='Clinical context'
						description='Store the patient-wide narrative and care prompts that sit beside operational workflows.'>
						<div className='space-y-6'>
							<div>
								<div className='mb-3 flex items-center justify-between gap-3'>
									<div>
										<h3 className='text-sm font-semibold text-foreground'>Allergies</h3>
										<p className='text-sm text-slate-600'>
											Record known allergies separately from medication and care-plan workflows.
										</p>
									</div>
									{canManagePatients ? (
										<Button
											type='button'
											variant='outline'
											size='sm'
											onClick={() =>
												setForm((current) => ({
													...current,
													allergies: [...current.allergies, { name: '', notes: '' }],
												}))
											}>
											<Plus className='size-4' />
											Add allergy
										</Button>
									) : null}
								</div>

								<div className='space-y-4'>
									{form.allergies.map((allergy, index) => (
										<div key={`${index}-${allergy.name}`} className='rounded-2xl border border-border p-4'>
											<div className='mb-4 flex items-center justify-between gap-3'>
												<p className='text-sm font-semibold text-foreground'>
													Allergy {index + 1}
												</p>
												{canManagePatients && form.allergies.length > 1 ? (
													<Button
														type='button'
														variant='ghost'
														size='sm'
														onClick={() =>
															setForm((current) => ({
																...current,
																allergies: current.allergies.filter(
																	(_, allergyIndex) => allergyIndex !== index,
																),
															}))
														}>
														Remove
													</Button>
												) : null}
											</div>
											<div className='grid gap-4 md:grid-cols-2'>
												<div className='space-y-2'>
													<Label>Name</Label>
													<Input
														disabled={!canManagePatients}
														value={allergy.name}
														onChange={(event) =>
															handleAllergyChange(index, 'name', event.target.value)
														}
													/>
												</div>
												<div className='space-y-2'>
													<Label>Notes</Label>
													<Input
														disabled={!canManagePatients}
														value={allergy.notes}
														onChange={(event) =>
															handleAllergyChange(index, 'notes', event.target.value)
														}
													/>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>

							<div className='grid gap-5 lg:grid-cols-2'>
								<div className='space-y-2'>
									<Label htmlFor='medicalSummary'>Medical summary</Label>
									<textarea
										id='medicalSummary'
										className={textAreaClassName}
										disabled={!canManagePatients}
										value={form.medicalSummary}
										onChange={(event) =>
											setForm((current) => ({
												...current,
												medicalSummary: event.target.value,
											}))
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='careRequirements'>Care requirements</Label>
									<textarea
										id='careRequirements'
										className={textAreaClassName}
										disabled={!canManagePatients}
										value={form.careRequirements}
										onChange={(event) =>
											setForm((current) => ({
												...current,
												careRequirements: event.target.value,
											}))
										}
									/>
								</div>
							</div>
						</div>
					</Section>
				</div>

				<div className='space-y-6'>
					<Section
						title='Workflow shortcuts'
						description='These modules stay separate, but they are linked directly from the patient setup flow.'>
						<div className='space-y-3'>
							{setupSteps.slice(1).map((step) => (
								<Link
									key={step.key}
									href={step.href(profile.id)}
									className='flex items-center justify-between rounded-2xl border border-border bg-slate-50 px-4 py-4 hover:border-care-blue/40 hover:bg-care-blue-light/40'>
									<div className='flex items-center gap-3'>
										<div className='flex size-10 items-center justify-center rounded-xl bg-white text-care-blue shadow-sm'>
											<step.icon className='size-5' />
										</div>
										<div>
											<p className='text-sm font-semibold text-foreground'>{step.title}</p>
											<p className='text-sm text-slate-600'>{step.description}</p>
										</div>
									</div>
									<ChevronRight className='size-4 text-slate-400' />
								</Link>
							))}
						</div>
					</Section>

					<Section title='Record metadata'>
						<div className='space-y-3 text-sm text-slate-600'>
							<div className='flex items-start gap-3'>
								<CalendarClock className='mt-0.5 size-4 text-slate-400' />
								<div>
									<p className='font-semibold text-foreground'>Created</p>
									<p>{formatDateTime(profile.createdAt)}</p>
								</div>
							</div>
							<div className='flex items-start gap-3'>
								<CalendarClock className='mt-0.5 size-4 text-slate-400' />
								<div>
									<p className='font-semibold text-foreground'>Last updated</p>
									<p>{formatDateTime(profile.updatedAt)}</p>
								</div>
							</div>
						</div>
					</Section>

					<Section
						title='Danger zone'
						description='Soft deleting a patient removes them from active views and list screens.'
						action={
							canManagePatients ? (
								<Button
									type='button'
									variant={confirmDelete ? 'destructive' : 'outline'}
									onClick={() => {
										if (confirmDelete) {
											void handleDelete();
											return;
										}

										setConfirmDelete(true);
									}}
									disabled={isSaving}>
									<AlertTriangle className='size-4' />
									{confirmDelete ? 'Confirm delete' : 'Delete patient'}
								</Button>
							) : null
						}>
						<p className='text-sm text-slate-600'>
							Only users with patient management access can delete this record.
							If you press delete once, the next click confirms the action.
						</p>
					</Section>
				</div>
			</div>
		</BoundingBox>
	);
}
