'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import {
	ArrowRight,
	Building2,
	CheckCircle2,
	Eye,
	EyeOff,
	HelpCircle,
	Lock,
	Mail,
	User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import slug from 'slug';
import {
	registerValidation,
	slugValidationSchema,
} from './register-validation';

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

function normalizeSlug(value: string) {
	return slug(value, { lower: true });
}

export default function RegisterPage() {
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [agencyName, setAgencyName] = useState('');
	const [slug, setSlug] = useState('');
	const [slugEdited, setSlugEdited] = useState(false);
	const [slugAvailability, setSlugAvailability] = useState<{
		status: 'idle' | 'checking' | 'available' | 'unavailable' | 'error';
		message: string;
		suggestions: string[];
	}>({ status: 'idle', message: '', suggestions: [] });
	const [showPassword, setShowPassword] = useState(false);
	const [agreed, setAgreed] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [formError, setFormError] = useState('');
	const [touched, setTouched] = useState<{
		email?: boolean;
		password?: boolean;
		organizationName?: boolean;
		slug?: boolean;
	}>({});

	const slugValidationResult = useMemo(
		() => slugValidationSchema.safeParse(slug),
		[slug],
	);
	const fieldErrors = useMemo(() => {
		const validationResult = registerValidation.safeParse({
			email,
			password,
			organizationName: agencyName,
			slug,
		});

		if (validationResult.success) {
			return {} as {
				email?: string;
				password?: string;
				organizationName?: string;
				slug?: string;
			};
		}

		const { fieldErrors } = validationResult.error.flatten();
		return {
			email: fieldErrors.email?.[0],
			password: fieldErrors.password?.[0],
			organizationName: fieldErrors.organizationName?.[0],
			slug: fieldErrors.slug?.[0],
		};
	}, [email, password, agencyName, slug]);

	const derivedSlugStatus = useMemo(() => {
		if (!slug) {
			return { status: 'idle', message: '' } as const;
		}

		if (!slugValidationResult.success) {
			return {
				status: 'invalid',
				message: slugValidationResult.error.issues[0].message,
			} as const;
		}

		if (!backendBaseUrl) {
			return {
				status: 'invalid',
				message: 'Missing NEXT_PUBLIC_BACKEND_BASE_URL in apps/web/.env',
			} as const;
		}

		if (slugAvailability.status === 'idle') {
			return {
				status: 'checking',
				message: 'Checking availability...',
			} as const;
		}

		if (slugAvailability.status === 'error') {
			return {
				status: 'invalid',
				message:
					slugAvailability.message || 'Unable to check slug availability',
			} as const;
		}

		return {
			status: slugAvailability.status,
			message: slugAvailability.message,
		} as const;
	}, [slug, slugAvailability, slugValidationResult]);

	function handleAgencyChange(val: string) {
		setAgencyName(val);
		if (!slugEdited) {
			setSlug(normalizeSlug(val));
		}
	}

	function handleSlugChange(val: string) {
		setSlugEdited(true);
		setSlug(normalizeSlug(val));
	}

	useEffect(() => {
		if (!slug) {
			return;
		}

		if (!slugValidationResult.success) {
			return;
		}

		if (!backendBaseUrl) {
			return;
		}

		const baseUrlWithoutTrailingSlash = backendBaseUrl.replace(/\/+$/, '');
		const timer = setTimeout(async () => {
			try {
				setSlugAvailability({
					status: 'checking',
					message: 'Checking availability...',
					suggestions: [],
				});
				const response = await axios.post(
					`${baseUrlWithoutTrailingSlash}/v1/auth/org-slug/check`,
					{
						organizationName: agencyName || undefined,
						slug: slugEdited ? slug : undefined,
					},
					{ withCredentials: false },
				);

				const { available, suggestedSlug, suggestions } = response.data ?? {};

				if (suggestedSlug && !slugEdited) {
					setSlug(suggestedSlug);
				}

				if (available) {
					setSlugAvailability({
						status: 'available',
						message: 'Available',
						suggestions: [],
					});
					return;
				}

				setSlugAvailability({
					status: 'unavailable',
					message: 'Slug already in use',
					suggestions: Array.isArray(suggestions) ? suggestions : [],
				});
			} catch (error) {
				setSlugAvailability({
					status: 'error',
					message: 'Unable to check slug availability',
					suggestions: [],
				});

				console.log(error);
			}
		}, 400);

		return () => clearTimeout(timer);
	}, [agencyName, slug, slugEdited, slugValidationResult]);

	const canSubmit =
		agreed &&
		derivedSlugStatus.status === 'available' &&
		slugValidationResult.success;
	const submissionMessage = useMemo(() => {
		if (!agreed) {
			return 'Please accept the Terms of Service to continue.';
		}

		if (derivedSlugStatus.status === 'checking') {
			return 'Checking slug availability. Please wait.';
		}

		if (derivedSlugStatus.status !== 'available') {
			return 'Please choose an available URL slug.';
		}

		return '';
	}, [agreed, derivedSlugStatus.status]);

	async function handleFormSubmit() {
		if (!canSubmit) {
			setFormError(submissionMessage);
			return false;
		}

		if (!backendBaseUrl) {
			setFormError('Missing NEXT_PUBLIC_BACKEND_BASE_URL in apps/web/.env');
			return false;
		}

		const trimmedName = fullName.trim();
		const [firstName, ...rest] = trimmedName.split(/\s+/);
		const lastName = rest.join(' ');

		if (!firstName || !lastName) {
			setFormError('Please enter both first and last name.');
			return false;
		}

		try {
			setFormError('');
			const response = await axios.post(
				`${backendBaseUrl.replace(/\/+$/, '')}/v1/auth/register`,
				{
					firstName,
					lastName,
					email,
					password,
					organizationName: agencyName,
					slug,
				},
				{ withCredentials: true },
			);

			if (response.status === 201 || response.status === 200) {
				return true;
			}

			setFormError('An unexpected error occurred. Please try again.');
			return false;
		} catch (error: unknown) {
			if (error instanceof Error) {
				setFormError(error.message);
			} else {
				setFormError('An unexpected error occurred. Please try again.');
			}
			return false;
		}
	}

	return (
		<div className='flex min-h-screen flex-col bg-page-bg'>
			{/* Header */}
			<header className='flex items-center justify-between border-b border-[#e2e8f0] bg-white px-6 py-3'>
				<Image src='/logo.svg' alt='Good Care Pro' width={140} height={28} />
				<button className='flex h-9 w-9 items-center justify-center rounded-lg bg-[#f8fafc] transition-colors hover:bg-[#e2e8f0]'>
					<HelpCircle className='size-4 text-[#64748b]' />
				</button>
			</header>

			{/* Main */}
			<main className='flex flex-1 items-center justify-center px-4 py-12'>
				<div className='w-full max-w-[480px]'>
					<div className='rounded-xl bg-white p-8 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.07),0px_2px_4px_-2px_rgba(0,0,0,0.05)]'>
						{submitted ? (
							<div className='flex flex-col items-center gap-4 py-8 text-center'>
								<CheckCircle2 className='size-14 text-success' />
								<h2 className='text-xl font-bold text-[#0f172a]'>
									Account Created!
								</h2>
								<p className='max-w-[320px] text-sm text-[#64748b]'>
									Welcome to Good Care Pro. Check your email to verify your
									account before logging in.
								</p>
								<Link
									href='/login'
									className='mt-2 text-sm font-semibold text-care-blue hover:underline'>
									Go to Login
								</Link>
							</div>
						) : (
							<>
								{/* Heading */}
								<div className='mb-7'>
									<h1 className='text-[28px] font-bold leading-tight text-[#0f172a]'>
										Create Account
									</h1>
									<p className='mt-1.5 text-sm text-[#64748b]'>
										Set up your organisation on Good Care Pro
									</p>
								</div>

								<form
									className='flex flex-col gap-5'
									onSubmit={async (e) => {
										e.preventDefault();
										setTouched({
											email: true,
											password: true,
											organizationName: true,
											slug: true,
										});

										const ok = await handleFormSubmit();
										if (ok) {
											setSubmitted(true);
										}
									}}>
									{/* Full Name */}
									<div className='flex flex-col gap-1.5'>
										<Label
											htmlFor='fullName'
											className='text-sm font-semibold text-[#1e293b]'>
											Full Name
										</Label>
										<div className='relative'>
											<User className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]' />
											<Input
												id='fullName'
												type='text'
												placeholder='Jane Smith'
												value={fullName}
												onChange={(e) => setFullName(e.target.value)}
												className='h-12 rounded-lg border-[#e2e8f0] bg-[#f8fafc] pl-10 text-sm placeholder:text-[#cbd5e1]'
											/>
										</div>
									</div>

									{/* Email */}
									<div className='flex flex-col gap-1.5'>
										<Label
											htmlFor='email'
											className='text-sm font-semibold text-[#1e293b]'>
											Email Address
										</Label>
										<div className='relative'>
											<Mail className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]' />
											<Input
												id='email'
												type='email'
												placeholder='jane@agency.co.uk'
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												onBlur={() =>
													setTouched((prev) => ({ ...prev, email: true }))
												}
												className='h-12 rounded-lg border-[#e2e8f0] bg-[#f8fafc] pl-10 text-sm placeholder:text-[#cbd5e1]'
											/>
										</div>
										{touched.email && fieldErrors.email && (
											<p className='text-xs text-red-600'>
												{fieldErrors.email}
											</p>
										)}
									</div>

									{/* Agency Name + Slug */}
									<div className='flex gap-3'>
										<div className='flex flex-1 flex-col gap-1.5'>
											<Label
												htmlFor='agencyName'
												className='text-sm font-semibold text-[#1e293b]'>
												Agency Name
											</Label>
											<div className='relative'>
												<Building2 className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]' />
												<Input
													id='agencyName'
													type='text'
													placeholder='Sunrise Care'
													value={agencyName}
													onChange={(e) => handleAgencyChange(e.target.value)}
													onBlur={() =>
														setTouched((prev) => ({
															...prev,
															organizationName: true,
														}))
													}
													className='h-12 rounded-lg border-[#e2e8f0] bg-[#f8fafc] pl-10 text-sm placeholder:text-[#cbd5e1]'
												/>
											</div>
											{touched.organizationName &&
												fieldErrors.organizationName && (
													<p className='text-xs text-red-600'>
														{fieldErrors.organizationName}
													</p>
												)}
										</div>
										<div className='flex flex-1 flex-col gap-1.5'>
											<Label
												htmlFor='slug'
												className='text-sm font-semibold text-[#1e293b]'>
												URL Slug
											</Label>
											<Input
												id='slug'
												type='text'
												placeholder='sunrise-care'
												value={slug}
												onChange={(e) => handleSlugChange(e.target.value)}
												onBlur={() =>
													setTouched((prev) => ({ ...prev, slug: true }))
												}
												className='h-12 rounded-lg border-[#e2e8f0] bg-[#f8fafc] font-mono text-sm placeholder:text-[#cbd5e1]'
											/>
											{touched.slug && fieldErrors.slug && (
												<p className='text-xs text-red-600'>
													{fieldErrors.slug}
												</p>
											)}
										</div>
									</div>

									{/* URL preview */}
									{slug && (
										<div className='flex flex-col gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5'>
											<div className='flex items-center gap-1.5'>
												<span className='text-xs text-[#94a3b8]'>
													goodcarepro.co.uk/
												</span>
												<span className='text-xs font-semibold text-care-blue'>
													{slug}
												</span>
												<div className='ml-auto flex items-center gap-1.5'>
													<span
														className={
															derivedSlugStatus.status === 'available'
																? 'h-1.5 w-1.5 rounded-full bg-success'
																: derivedSlugStatus.status === 'unavailable' ||
																	  derivedSlugStatus.status === 'invalid'
																	? 'h-1.5 w-1.5 rounded-full bg-error'
																	: 'h-1.5 w-1.5 rounded-full bg-warning'
														}
													/>
													<span
														className={
															derivedSlugStatus.status === 'available'
																? 'text-[11px] font-medium text-success'
																: derivedSlugStatus.status === 'unavailable' ||
																	  derivedSlugStatus.status === 'invalid'
																	? 'text-[11px] font-medium text-error'
																	: 'text-[11px] font-medium text-warning'
														}>
														{derivedSlugStatus.message || 'Checking...'}
													</span>
												</div>
											</div>
											{derivedSlugStatus.status === 'unavailable' &&
												slugAvailability.suggestions.length > 0 && (
													<div className='flex flex-wrap gap-2'>
														{slugAvailability.suggestions.map((suggestion) => (
															<button
																type='button'
																key={suggestion}
																onClick={() => {
																	setSlugEdited(true);
																	setSlug(suggestion);
																}}
																className='rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0f172a] hover:border-care-blue'>
																{suggestion}
															</button>
														))}
													</div>
												)}
										</div>
									)}

									{/* Password */}
									<div className='flex flex-col gap-1.5'>
										<Label
											htmlFor='password'
											className='text-sm font-semibold text-[#1e293b]'>
											Password
										</Label>
										<div className='relative'>
											<Lock className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]' />
											<Input
												id='password'
												type={showPassword ? 'text' : 'password'}
												placeholder='••••••••'
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												onBlur={() =>
													setTouched((prev) => ({ ...prev, password: true }))
												}
												className='h-12 rounded-lg border-[#e2e8f0] bg-[#f8fafc] pl-10 pr-10 text-sm placeholder:text-[#cbd5e1]'
											/>
											<button
												type='button'
												onClick={() => setShowPassword(!showPassword)}
												className='absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]'
												aria-label={
													showPassword ? 'Hide password' : 'Show password'
												}>
												{showPassword ? (
													<EyeOff className='size-4' />
												) : (
													<Eye className='size-4' />
												)}
											</button>
										</div>
										<p className='text-[11px] text-[#94a3b8]'>
											Minimum 8 characters with at least one number
										</p>
										{touched.password && fieldErrors.password && (
											<p className='text-xs text-red-600'>
												{fieldErrors.password}
											</p>
										)}
									</div>

									{/* Terms */}
									<div className='flex items-start gap-2.5'>
										<Checkbox
											id='terms'
											checked={agreed}
											onCheckedChange={(v) => setAgreed(!!v)}
											className='mt-0.5'
										/>
										<Label
											htmlFor='terms'
											className='text-sm leading-snug text-[#64748b]'>
											I agree to the{' '}
											<Link
												href='#'
												className='font-semibold text-care-blue hover:underline'>
												Terms of Service
											</Link>{' '}
											and{' '}
											<Link
												href='#'
												className='font-semibold text-care-blue hover:underline'>
												Privacy Policy
											</Link>
										</Label>
									</div>

									{/* Submit */}
									<Button
										type='submit'
										disabled={!canSubmit}
										className='mt-1 h-12 w-full rounded-lg bg-care-blue text-sm font-bold text-white shadow-[0px_4px_6px_-1px_rgba(0,95,184,0.2)] hover:bg-care-blue-dark'>
										Sign Up
										<ArrowRight className='ml-2 size-4' />
									</Button>
									{formError && (
										<p className='text-xs text-red-600'>{formError}</p>
									)}
								</form>
							</>
						)}
					</div>

					{!submitted && (
						<p className='mt-6 text-center text-sm text-[#64748b]'>
							Already have an account?{' '}
							<Link
								href='/login'
								className='font-semibold text-care-blue hover:underline'>
								Log In
							</Link>
						</p>
					)}
				</div>
			</main>

			{/* Copyright */}
			<footer className='py-6 text-center text-xs text-[#94a3b8]'>
				&copy; 2026 Good Care Pro. All rights reserved.
			</footer>
		</div>
	);
}
