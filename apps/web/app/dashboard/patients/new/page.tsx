'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
	ChevronRight,
	Plus,
	ShieldCheck,
	Trash2,
	Upload,
	X,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────── */

interface EmergencyContact {
	id: string;
	name: string;
	relationship: string;
	phone: string;
	email: string;
}

/* ─────────────────────────────────────────────────────────────────────────
   Section wrapper
───────────────────────────────────────────────────────────────────────── */

function Section({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<div className='rounded-xl border border-[#e2e8f0] bg-white p-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]'>
			<div className='mb-6'>
				<h2 className='text-base font-bold text-[#0f172a]'>{title}</h2>
				{description && (
					<p className='mt-0.5 text-sm text-[#64748b]'>{description}</p>
				)}
			</div>
			{children}
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   Field helpers
───────────────────────────────────────────────────────────────────────── */

function Field({
	label,
	htmlFor,
	children,
	className = '',
}: {
	label: string;
	htmlFor?: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`flex flex-col gap-1.5 ${className}`}>
			<Label htmlFor={htmlFor} className='text-sm font-semibold text-[#1e293b]'>
				{label}
			</Label>
			{children}
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────── */

export default function AddNewPatientPage() {
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [contacts, setContacts] = useState<EmergencyContact[]>([
		{ id: '1', name: '', relationship: '', phone: '', email: '' },
	]);
	const [mobility, setMobility] = useState({
		wheelchair: false,
		walker: false,
		cane: false,
		bedBound: false,
	});

	function addContact() {
		setContacts((prev) => [
			...prev,
			{
				id: String(Date.now()),
				name: '',
				relationship: '',
				phone: '',
				email: '',
			},
		]);
	}

	function removeContact(id: string) {
		setContacts((prev) => prev.filter((c) => c.id !== id));
	}

	function updateContact(
		id: string,
		field: keyof EmergencyContact,
		value: string,
	) {
		setContacts((prev) =>
			prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
		);
	}

	function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) {
			setAvatarUrl(URL.createObjectURL(file));
		}
	}

	return (
		<div className='flex flex-col gap-0'>
			{/* Page Header */}
			<div className='border-b border-[#e2e8f0] bg-white px-8 py-5'>
				{/* Breadcrumbs */}
				<nav className='mb-3 flex items-center gap-1.5 text-sm text-[#64748b]'>
					<Link
						href='/dashboard/patients'
						className='hover:text-[#005fb8] transition-colors'>
						Patients
					</Link>
					<ChevronRight className='size-3.5 text-[#cbd5e1]' />
					<span className='font-medium text-[#1e293b]'>Add New Patient</span>
				</nav>
				<div className='flex items-start justify-between'>
					<div>
						<h1 className='text-[28px] font-black leading-tight text-[#0f172a]'>
							Register New Patient
						</h1>
						<p className='mt-1 text-sm text-[#64748b]'>
							Complete the form below to register a new patient in the system
						</p>
					</div>
				</div>
			</div>

			{/* Form */}
			<div className='flex flex-col gap-5 px-8 py-7'>
				{/* ── 1. Patient Profile ── */}
				<Section
					title='Patient Profile'
					description='Upload a photo and confirm the patient profile details'>
					<div className='flex items-center gap-6'>
						{/* Avatar */}
						<div className='relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc]'>
							{avatarUrl ? (
								<>
									<img
										src={avatarUrl}
										alt='Patient avatar'
										className='h-full w-full object-cover'
									/>
									<button
										type='button'
										onClick={() => setAvatarUrl(null)}
										className='absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm hover:bg-red-50'>
										<X className='size-3 text-[#ef4444]' />
									</button>
								</>
							) : (
								<Upload className='size-6 text-[#94a3b8]' />
							)}
						</div>

						{/* Upload text */}
						<div className='flex flex-col gap-1'>
							<p className='text-sm font-semibold text-[#1e293b]'>
								Upload Photo
							</p>
							<p className='text-xs text-[#94a3b8]'>
								JPG, PNG or GIF up to 5MB
							</p>
							<label className='mt-1 cursor-pointer text-xs font-semibold text-[#005fb8] hover:underline'>
								Select file
								<input
									type='file'
									accept='image/*'
									className='sr-only'
									onChange={handleAvatarChange}
								/>
							</label>
						</div>
					</div>
				</Section>

				{/* ── 2. Personal Information ── */}
				<Section
					title='Personal Information'
					description='Basic demographic and contact details for this patient'>
					<div className='grid grid-cols-2 gap-x-5 gap-y-5'>
						<Field label='First Name' htmlFor='firstName'>
							<Input
								id='firstName'
								placeholder='e.g. Robert'
								className='h-11 rounded-lg border-[#e2e8f0] bg-[#f8fafc] text-sm placeholder:text-[#cbd5e1]'
							/>
						</Field>

						<Field label='Last Name' htmlFor='lastName'>
							<Input
								id='lastName'
								placeholder='e.g. Miller'
								className='h-11 rounded-lg border-[#e2e8f0] bg-[#f8fafc] text-sm placeholder:text-[#cbd5e1]'
							/>
						</Field>

						<Field label='Date of Birth' htmlFor='dob'>
							<Input
								id='dob'
								type='date'
								className='h-11 rounded-lg border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#0f172a]'
							/>
						</Field>

						<Field label='Gender Identity' htmlFor='gender'>
							<select
								id='gender'
								className='h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a] focus:border-[#005fb8] focus:outline-none focus:ring-1 focus:ring-[#005fb8]'>
								<option value=''>Select…</option>
								<option value='male'>Male</option>
								<option value='female'>Female</option>
								<option value='non-binary'>Non-binary</option>
								<option value='prefer-not-to-say'>Prefer not to say</option>
							</select>
						</Field>

						<Field
							label='Residential Address'
							htmlFor='address'
							className='col-span-2'>
							<Input
								id='address'
								placeholder='e.g. 14 Oak Lane, Birmingham, B1 2AB'
								className='h-11 rounded-lg border-[#e2e8f0] bg-[#f8fafc] text-sm placeholder:text-[#cbd5e1]'
							/>
						</Field>
					</div>
				</Section>

				{/* ── 3. Emergency Contacts ── */}
				<Section
					title='Emergency Contacts'
					description='At least one emergency contact is required'>
					<div className='flex flex-col gap-4'>
						{contacts.map((contact, i) => (
							<div
								key={contact.id}
								className='relative rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-5'>
								{contacts.length > 1 && (
									<button
										type='button'
										onClick={() => removeContact(contact.id)}
										className='absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#94a3b8] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-[#ef4444]'>
										<Trash2 className='size-3.5' />
									</button>
								)}
								<p className='mb-4 text-xs font-bold uppercase tracking-wider text-[#94a3b8]'>
									Contact {i + 1}
								</p>
								<div className='grid grid-cols-2 gap-x-5 gap-y-4'>
									<Field label='Contact Name' htmlFor={`cname-${contact.id}`}>
										<Input
											id={`cname-${contact.id}`}
											placeholder='e.g. Sarah Miller'
											value={contact.name}
											onChange={(e) =>
												updateContact(contact.id, 'name', e.target.value)
											}
											className='h-11 rounded-lg border-[#e2e8f0] bg-white text-sm placeholder:text-[#cbd5e1]'
										/>
									</Field>
									<Field
										label='Relationship'
										htmlFor={`crel-${contact.id}`}>
										<Input
											id={`crel-${contact.id}`}
											placeholder='e.g. Daughter'
											value={contact.relationship}
											onChange={(e) =>
												updateContact(
													contact.id,
													'relationship',
													e.target.value,
												)
											}
											className='h-11 rounded-lg border-[#e2e8f0] bg-white text-sm placeholder:text-[#cbd5e1]'
										/>
									</Field>
									<Field
										label='Primary Phone'
										htmlFor={`cphone-${contact.id}`}>
										<Input
											id={`cphone-${contact.id}`}
											type='tel'
											placeholder='+44 7700 900000'
											value={contact.phone}
											onChange={(e) =>
												updateContact(contact.id, 'phone', e.target.value)
											}
											className='h-11 rounded-lg border-[#e2e8f0] bg-white text-sm placeholder:text-[#cbd5e1]'
										/>
									</Field>
									<Field
										label='Email Address'
										htmlFor={`cemail-${contact.id}`}>
										<Input
											id={`cemail-${contact.id}`}
											type='email'
											placeholder='contact@example.com'
											value={contact.email}
											onChange={(e) =>
												updateContact(contact.id, 'email', e.target.value)
											}
											className='h-11 rounded-lg border-[#e2e8f0] bg-white text-sm placeholder:text-[#cbd5e1]'
										/>
									</Field>
								</div>
							</div>
						))}

						<button
							type='button'
							onClick={addContact}
							className='flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#cbd5e1] bg-transparent py-3 text-sm font-semibold text-[#005fb8] transition-colors hover:border-[#005fb8] hover:bg-[#e7f1fb]'>
							<Plus className='size-4' />
							Add Another Contact
						</button>
					</div>
				</Section>

				{/* ── 4. Medical History Summary ── */}
				<Section
					title='Medical History Summary'
					description='Provide an overview of existing medical conditions and history'>
					<div className='flex flex-col gap-5'>
						<Field label='Current Diagnoses' htmlFor='diagnoses'>
							<textarea
								id='diagnoses'
								rows={3}
								placeholder='List known diagnoses separated by commas, e.g. Type 2 Diabetes, Hypertension'
								className='w-full resize-none rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#cbd5e1] focus:border-[#005fb8] focus:outline-none focus:ring-1 focus:ring-[#005fb8]'
							/>
						</Field>

						<Field label='Known Allergies' htmlFor='allergies'>
							<Input
								id='allergies'
								placeholder='e.g. Penicillin, Latex, Nuts'
								className='h-11 rounded-lg border-[#ef4444]/40 bg-[#fff5f5] text-sm placeholder:text-[#fca5a5] focus:border-[#ef4444] focus:ring-[#ef4444]'
							/>
							<p className='text-[11px] text-[#ef4444]'>
								Always verify allergies with the patient or GP before
								administering medication
							</p>
						</Field>

						<div className='grid grid-cols-2 gap-x-5 gap-y-5'>
							<Field label='Blood Type' htmlFor='bloodType'>
								<select
									id='bloodType'
									className='h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a] focus:border-[#005fb8] focus:outline-none focus:ring-1 focus:ring-[#005fb8]'>
									<option value=''>Unknown / Not recorded</option>
									{['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'].map(
										(t) => (
											<option key={t} value={t}>
												{t}
											</option>
										),
									)}
								</select>
							</Field>

							<Field label='Immunization Status' htmlFor='immunization'>
								<select
									id='immunization'
									className='h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a] focus:border-[#005fb8] focus:outline-none focus:ring-1 focus:ring-[#005fb8]'>
									<option value=''>Select…</option>
									<option value='up-to-date'>Up to date</option>
									<option value='partial'>Partially immunized</option>
									<option value='not-immunized'>Not immunized</option>
									<option value='unknown'>Unknown</option>
								</select>
							</Field>
						</div>
					</div>
				</Section>

				{/* ── 5. Care Requirements ── */}
				<Section
					title='Care Requirements'
					description='Outline the support and assistance this patient requires'>
					<div className='flex flex-col gap-5'>
						{/* Mobility */}
						<div className='flex flex-col gap-2'>
							<p className='text-sm font-semibold text-[#1e293b]'>
								Mobility Aids
							</p>
							<div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
								{(
									[
										['wheelchair', 'Wheelchair'],
										['walker', 'Walker / Frame'],
										['cane', 'Walking Cane'],
										['bedBound', 'Bed Bound'],
									] as const
								).map(([key, label]) => (
									<label
										key={key}
										className='flex cursor-pointer items-center gap-2.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 transition-colors has-[:checked]:border-[#005fb8] has-[:checked]:bg-[#e7f1fb]'>
										<Checkbox
											id={key}
											checked={mobility[key]}
											onCheckedChange={(v) =>
												setMobility((prev) => ({
													...prev,
													[key]: !!v,
												}))
											}
										/>
										<span className='text-sm text-[#1e293b]'>{label}</span>
									</label>
								))}
							</div>
						</div>

						{/* Dietary */}
						<Field label='Dietary Needs' htmlFor='dietary'>
							<textarea
								id='dietary'
								rows={2}
								placeholder='e.g. Halal, vegetarian, pureed foods, no nuts'
								className='w-full resize-none rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#cbd5e1] focus:border-[#005fb8] focus:outline-none focus:ring-1 focus:ring-[#005fb8]'
							/>
						</Field>

						{/* Special Instructions */}
						<Field label='Special Instructions' htmlFor='instructions'>
							<textarea
								id='instructions'
								rows={3}
								placeholder='Any additional care notes, cultural preferences, communication needs, or safeguarding considerations'
								className='w-full resize-none rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#cbd5e1] focus:border-[#005fb8] focus:outline-none focus:ring-1 focus:ring-[#005fb8]'
							/>
						</Field>
					</div>
				</Section>

				{/* ── Form Actions ── */}
				<div className='flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-white px-8 py-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]'>
					<Link href='/dashboard/patients'>
						<Button
							type='button'
							variant='outline'
							className='h-11 rounded-lg border-[#e2e8f0] px-6 text-sm font-semibold text-[#64748b] hover:bg-[#f8fafc]'>
							Cancel
						</Button>
					</Link>

					<Button
						type='submit'
						className='h-11 rounded-lg bg-[#005fb8] px-6 text-sm font-bold text-white shadow-[0px_4px_6px_-1px_rgba(0,95,184,0.2)] hover:bg-[#004d96]'>
						<ShieldCheck className='mr-2 size-4' />
						Create Patient Record
					</Button>
				</div>
			</div>
		</div>
	);
}
