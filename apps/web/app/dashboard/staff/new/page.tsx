'use client';

import DashboardFooter from '@/components/dashboard/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
	ArrowLeft,
	ChevronRight,
	FileText,
	Info,
	Mail,
	Trash2,
	Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UploadedFile {
	id: string;
	name: string;
	size: string;
	expiryDate: string;
}

/* ------------------------------------------------------------------ */
/*  FormSection — reusable accessible card wrapper                     */
/* ------------------------------------------------------------------ */

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
				{description && (
					<p className='mt-1 text-sm text-slate-600'>{description}</p>
				)}
			</div>
			<div className='px-6 py-6'>{children}</div>
		</section>
	);
}

/* ------------------------------------------------------------------ */
/*  FileDropzone                                                       */
/* ------------------------------------------------------------------ */

function FileDropzone({ onFiles }: { onFiles: (files: FileList) => void }) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [dragOver, setDragOver] = useState(false);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setDragOver(false);
			if (e.dataTransfer.files.length > 0) {
				onFiles(e.dataTransfer.files);
			}
		},
		[onFiles],
	);

	return (
		<div
			role='button'
			tabIndex={0}
			aria-label='Upload qualification documents. Click or drag and drop PDF, JPG, or PNG files up to 10MB.'
			className={cn(
				'flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
				'focus-visible:border-care-blue focus-visible:ring-3 focus-visible:ring-care-blue/30 focus-visible:outline-none',
				dragOver
					? 'border-care-blue bg-care-blue-light'
					: 'border-slate-300 bg-slate-50 hover:border-care-blue hover:bg-care-blue-light/50',
			)}
			onClick={() => inputRef.current?.click()}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					inputRef.current?.click();
				}
			}}
			onDragOver={(e) => {
				e.preventDefault();
				setDragOver(true);
			}}
			onDragLeave={() => setDragOver(false)}
			onDrop={handleDrop}>
			<div className='flex size-12 items-center justify-center rounded-full bg-care-blue-light'>
				<Upload className='size-5 text-care-blue' aria-hidden='true' />
			</div>
			<div>
				<p className='text-sm font-semibold text-foreground'>
					Click to upload{' '}
					<span className='font-normal text-slate-600'>or drag and drop</span>
				</p>
				<p className='mt-1 text-xs text-slate-500'>
					PDF, JPG, or PNG (max 10MB)
				</p>
			</div>
			<input
				ref={inputRef}
				type='file'
				className='sr-only'
				accept='.pdf,.jpg,.jpeg,.png'
				multiple
				aria-hidden='true'
				tabIndex={-1}
				onChange={(e) => {
					if (e.target.files && e.target.files.length > 0) {
						onFiles(e.target.files);
					}
				}}
			/>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  UploadedFileCard                                                   */
/* ------------------------------------------------------------------ */

function UploadedFileCard({
	file,
	onRemove,
	onExpiryChange,
}: {
	file: UploadedFile;
	onRemove: () => void;
	onExpiryChange: (date: string) => void;
}) {
	return (
		<div
			className='flex flex-col gap-4 rounded-lg border border-border bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between'
			role='group'
			aria-label={`Uploaded file: ${file.name}`}>
			<div className='flex items-center gap-3'>
				<div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-care-blue-light'>
					<FileText className='size-5 text-care-blue' aria-hidden='true' />
				</div>
				<div className='min-w-0'>
					<p className='truncate text-sm font-semibold text-foreground'>
						{file.name}
					</p>
					<p className='text-xs text-slate-500'>{file.size}</p>
				</div>
			</div>
			<div className='flex items-center gap-3'>
				<div className='flex flex-col gap-1'>
					<Label
						htmlFor={`expiry-${file.id}`}
						className='text-xs font-medium text-slate-600'>
						Expiry Date
					</Label>
					<Input
						id={`expiry-${file.id}`}
						type='date'
						value={file.expiryDate}
						onChange={(e) => onExpiryChange(e.target.value)}
						className='h-9 w-40 text-sm'
						aria-describedby={`expiry-help-${file.id}`}
					/>
					<span id={`expiry-help-${file.id}`} className='sr-only'>
						Set the expiry date for {file.name}
					</span>
				</div>
				<button
					type='button'
					onClick={onRemove}
					className='mt-5 flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-error/10 hover:text-error focus-visible:ring-2 focus-visible:ring-error/50 focus-visible:outline-none'
					aria-label={`Remove ${file.name}`}>
					<Trash2 className='size-4' />
				</button>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function AddCarerPage() {
	const [files, setFiles] = useState<UploadedFile[]>([
		{
			id: '1',
			name: 'DBS_Certificate_2024.pdf',
			size: '2.4 MB',
			expiryDate: '2027-03-15',
		},
		{
			id: '2',
			name: 'First_Aid_Level3.pdf',
			size: '1.8 MB',
			expiryDate: '2026-09-22',
		},
	]);

	const handleAddFiles = useCallback((fileList: FileList) => {
		const newFiles: UploadedFile[] = Array.from(fileList).map((f, i) => ({
			id: `${Date.now()}-${i}`,
			name: f.name,
			size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
			expiryDate: '',
		}));
		setFiles((prev) => [...prev, ...newFiles]);
	}, []);

	const handleRemoveFile = useCallback((id: string) => {
		setFiles((prev) => prev.filter((f) => f.id !== id));
	}, []);

	const handleExpiryChange = useCallback((id: string, date: string) => {
		setFiles((prev) =>
			prev.map((f) => (f.id === id ? { ...f, expiryDate: date } : f)),
		);
	}, []);

	return (
		<div className='mx-auto max-w-6/12 p-4'>
			{/* Breadcrumb */}
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

			{/* Page header */}
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
					Enter the details for the new care professional. An invitation email
					will be sent so they can complete their profile and begin onboarding.
				</p>
			</div>

			<form
				onSubmit={(e) => e.preventDefault()}
				className='flex flex-col gap-6'
				noValidate>
				{/* ---- Personal Information ---- */}
				<FormSection
					id='personal'
					title='Personal Information'
					description='Basic contact details for the care professional.'>
					<div className='grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2'>
						<div className='flex flex-col gap-2'>
							<Label htmlFor='firstName'>
								First Name{' '}
								<span className='text-error' aria-hidden='true'>
									*
								</span>
							</Label>
							<Input
								id='firstName'
								placeholder='e.g. Sarah'
								required
								aria-required='true'
								autoComplete='given-name'
								className='h-10'
							/>
						</div>
						<div className='flex flex-col gap-2'>
							<Label htmlFor='lastName'>
								Last Name{' '}
								<span className='text-error' aria-hidden='true'>
									*
								</span>
							</Label>
							<Input
								id='lastName'
								placeholder='e.g. Jenkins'
								required
								aria-required='true'
								autoComplete='family-name'
								className='h-10'
							/>
						</div>
						<div className='flex flex-col gap-2'>
							<Label htmlFor='email'>
								Email Address{' '}
								<span className='text-error' aria-hidden='true'>
									*
								</span>
							</Label>
							<Input
								id='email'
								type='email'
								placeholder='e.g. sarah@example.com'
								required
								aria-required='true'
								autoComplete='email'
								className='h-10'
							/>
						</div>
						<div className='flex flex-col gap-2'>
							<Label htmlFor='phone'>Phone Number</Label>
							<Input
								id='phone'
								type='tel'
								placeholder='e.g. 07700 900000'
								autoComplete='tel'
								className='h-10'
							/>
						</div>
					</div>
				</FormSection>

				{/* ---- Residential Address ---- */}
				<FormSection
					id='address'
					title='Residential Address'
					description='Home address used for travel-time calculations and rota planning.'>
					<div className='flex flex-col gap-5'>
						<div className='flex flex-col gap-2'>
							<Label htmlFor='address1'>Address Line 1</Label>
							<Input
								id='address1'
								placeholder='e.g. 14 Elm Street'
								autoComplete='address-line1'
								className='h-10'
							/>
						</div>
						<div className='grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2'>
							<div className='flex flex-col gap-2'>
								<Label htmlFor='city'>City</Label>
								<Input
									id='city'
									placeholder='e.g. Manchester'
									autoComplete='address-level2'
									className='h-10'
								/>
							</div>
							<div className='flex flex-col gap-2'>
								<Label htmlFor='postcode'>Postcode</Label>
								<Input
									id='postcode'
									placeholder='e.g. M1 1AA'
									autoComplete='postal-code'
									className='h-10'
								/>
							</div>
						</div>
					</div>
				</FormSection>

				{/* ---- Qualifications & Compliance ---- */}
				<FormSection
					id='qualifications'
					title='Qualifications & Compliance'
					description='Upload certificates, DBS checks, and training records. Set expiry dates to receive renewal reminders.'>
					<div className='flex flex-col gap-5'>
						<FileDropzone onFiles={handleAddFiles} />

						{files.length > 0 && (
							<div
								className='flex flex-col gap-3'
								role='list'
								aria-label='Uploaded documents'>
								{files.map((file) => (
									<div key={file.id} role='listitem'>
										<UploadedFileCard
											file={file}
											onRemove={() => handleRemoveFile(file.id)}
											onExpiryChange={(date) =>
												handleExpiryChange(file.id, date)
											}
										/>
									</div>
								))}
							</div>
						)}
					</div>
				</FormSection>

				{/* ---- Invitation workflow info ---- */}
				<div
					className='flex gap-3 rounded-xl border border-care-blue/20 bg-care-blue-light p-5'
					role='note'>
					<Info
						className='mt-0.5 size-5 shrink-0 text-care-blue'
						aria-hidden='true'
					/>
					<div>
						<p className='text-sm font-bold text-foreground'>
							Invitation Workflow
						</p>
						<p className='mt-1 text-sm leading-relaxed text-slate-700'>
							After submitting, the care professional will receive an email
							invitation to create their account. They&apos;ll complete their
							profile, upload any remaining documents, and set their
							availability — all before their first shift.
						</p>
					</div>
				</div>

				{/* ---- Actions ---- */}
				<div className='flex flex-col-reverse gap-3 border-b border-border pt-6 pb-6 sm:flex-row sm:justify-end'>
					<Link
						href='/dashboard/staff'
						className='inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'>
						Cancel
					</Link>
					<Button
						type='submit'
						size='lg'
						className='h-11 gap-2 bg-care-blue px-6 text-sm font-semibold shadow-md hover:bg-care-blue-hover'>
						<Mail className='size-4' aria-hidden='true' />
						Invite Care Professional
					</Button>
				</div>
			</form>
		</div>
	);
}
