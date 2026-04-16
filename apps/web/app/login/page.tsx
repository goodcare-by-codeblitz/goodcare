'use client';

import DashboardFooter from '@/components/dashboard/footer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	broadcastAuthEvent,
	buildBaseAppUrl,
	buildOrgAppUrl,
} from '@/lib/auth-session';
import { useSessionStore } from '@/lib/stores/session-store';
import axios from 'axios';
import clsx from 'clsx';
import {
	ArrowRight,
	Eye,
	EyeOff,
	HelpCircle,
	Lock,
	Mail,
	ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { loginSchema } from './login-validation';

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [keepLoggedIn, setKeepLoggedIn] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [fieldErrors, setFieldErrors] = useState<{
		email?: string;
		password?: string;
	}>({});
	const [touched, setTouched] = useState<{
		email?: boolean;
		password?: boolean;
	}>({});

	const setOrganizations = useSessionStore((state) => state.setOrganisations);

	const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setErrorMessage('');
		setSuccessMessage('');

		if (!backendBaseUrl) {
			setErrorMessage('Missing NEXT_PUBLIC_BACKEND_BASE_URL in apps/web/.env');
			return;
		}

		try {
			setTouched({ email: true, password: true });
			setIsSubmitting(true);
			const baseUrlWithoutTrailingSlash = backendBaseUrl.replace(/\/+$/, '');
			const response = await axios.post(
				`${baseUrlWithoutTrailingSlash}/v1/auth/login`,
				{
					email,
					password,
				},
				{
					withCredentials: true,
				},
			);
			const { organizations } = response.data;

			setOrganizations(organizations); // Store organizations in Zustand
			broadcastAuthEvent('login');

			if (organizations.length === 0) {
				setErrorMessage(
					'Your account is not associated with any organization. Please contact your administrator.',
				);
				return;
			}

			if (organizations.length === 1) {
				setSuccessMessage(response.data?.message ?? 'Login successful');
				const org = organizations[0];
				const dashboardUrl = buildOrgAppUrl(org.slug, '/dashboard');

				if (!dashboardUrl) {
					setErrorMessage(
						'Missing NEXT_PUBLIC_APP_BASE_DOMAIN in apps/web/.env',
					);
					return;
				}

				window.location.replace(dashboardUrl);
				return;
			}

			const selectOrgUrl = buildBaseAppUrl('/select-org');
			if (!selectOrgUrl) {
				setErrorMessage('Missing NEXT_PUBLIC_APP_BASE_DOMAIN in apps/web/.env');
				return;
			}

			window.location.replace(selectOrgUrl);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const serverError = error.response?.data?.error;
				setErrorMessage(
					typeof serverError === 'string' ? serverError : error.message,
				);
				return;
			}
			setErrorMessage('Unexpected error while logging in');
		} finally {
			setIsSubmitting(false);
		}
	};

	useEffect(() => {
		const validationResult = loginSchema.safeParse({ email, password });
		if (!validationResult.success) {
			const { fieldErrors } = validationResult.error.flatten();
			setFieldErrors({
				email: fieldErrors.email?.[0],
				password: fieldErrors.password?.[0],
			});
			setErrorMessage('');
		} else {
			setFieldErrors({});
		}
	}, [email, password]);

	return (
		<div className='flex min-h-screen flex-col bg-page-bg'>
			{/* Header */}
			<header className='flex items-center justify-between border-b border-border bg-white px-6 py-3'>
				<Image src='/logo.svg' alt='Good Care' width={146} height={30} />
				<button className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-border'>
					<HelpCircle className='size-4 text-muted-foreground' />
				</button>
			</header>

			{/* Main */}
			<main className='flex flex-1 items-center justify-center px-6 py-12'>
				<div className='flex w-full max-w-[1200px] min-h-[700px] overflow-hidden rounded-xl border border-border bg-white shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]'>
					{/* Left Panel - Hero */}
					<div className='relative hidden flex-1 lg:flex'>
						<div className='absolute inset-0 bg-care-blue' />
						<Image
							src='/hero-login.png'
							alt=''
							fill
							className='object-cover opacity-40'
							priority
						/>
						<div className='absolute inset-0 bg-linear-to-t from-care-blue via-care-blue/40 to-transparent' />

						<div className='relative flex h-full w-full flex-col justify-between p-12'>
							{/* Logo (white version) */}
							<div>
								<Image
									src='/logo.svg'
									alt='Good Care'
									width={146}
									height={30}
									className='brightness-0 invert'
								/>
							</div>

							{/* Hero Text + Badges */}
							<div className='flex flex-col gap-6'>
								<div className='flex flex-col gap-6'>
									<h1 className='text-4xl font-bold leading-tight text-white'>
										Empowering Quality
										<br />
										Patient Care.
									</h1>
									<p className='max-w-[448px] text-lg leading-7 text-white/90'>
										Access your comprehensive care management dashboard. Secure,
										HIPAA-compliant, and designed for healthcare professionals.
									</p>
								</div>

								{/* Compliance Badges */}
								<div className='flex gap-4 pt-6'>
									<div className='flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm'>
										<ShieldCheck className='size-3.5 text-white' />
										<span className='text-xs font-semibold uppercase tracking-wider text-white'>
											HIPAA Compliant
										</span>
									</div>
									<div className='flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm'>
										<Lock className='size-3.5 text-white' />
										<span className='text-xs font-semibold uppercase tracking-wider text-white'>
											AES-256 Encrypted
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right Panel - Form */}
					<div className='flex flex-1 flex-col justify-center p-10 sm:p-16 lg:p-20'>
						{/* Heading */}
						<div className='pb-10'>
							<div className='flex flex-col gap-2'>
								<h2 className='text-[30px] font-bold leading-9 text-foreground'>
									Welcome back
								</h2>
								<p className='text-base text-muted-foreground'>
									Please enter your professional credentials to continue.
								</p>
							</div>
						</div>

						{/* Form */}
						<form className='flex flex-col gap-4' onSubmit={handleLogin}>
							{/* Email Field */}
							<div className='flex flex-col gap-2'>
								<Label
									htmlFor='email'
									className='text-sm font-semibold text-slate-700'>
									Email or Username
								</Label>
								<div className='relative'>
									<Mail className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
									<Input
										id='email'
										type='email'
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										onBlur={() => setTouched((t) => ({ ...t, email: true }))}
										placeholder='name@healthcare.org'
										className='h-12 rounded-lg border-border bg-muted pl-10 pr-4 text-base placeholder:text-slate-400'
									/>
								</div>
								<div className='h-4'>
									{fieldErrors.email && (
										<p
											className={clsx(
												'min-h-[5px] text-sm font-medium',
												touched.email && fieldErrors.email
													? 'text-red-600 visible'
													: 'text-transparent ',
											)}>
											{fieldErrors.email}
										</p>
									)}
								</div>
							</div>

							{/* Password Field */}
							<div className='flex flex-col gap-2'>
								<div className='flex items-center justify-between'>
									<Label
										htmlFor='password'
										className='text-sm font-semibold text-slate-700'>
										Password
									</Label>
									<Link
										href='/forgot-password'
										className='text-sm font-medium text-care-blue hover:underline'>
										Forgot password?
									</Link>
								</div>
								<div className='relative'>
									<Lock className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
									<Input
										id='password'
										type={showPassword ? 'text' : 'password'}
										value={password}
										placeholder='........'
										className='h-12 rounded-lg border-border bg-muted pl-10 pr-12 text-base placeholder:text-slate-400'
										onChange={(e) => setPassword(e.target.value)}
										onBlur={() => setTouched((t) => ({ ...t, password: true }))}
									/>
									<button
										type='button'
										onClick={() => setShowPassword(!showPassword)}
										className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
										aria-label={
											showPassword ? 'Hide password' : 'Show password'
										}>
										{showPassword ? (
											<EyeOff className='size-5' />
										) : (
											<Eye className='size-5' />
										)}
									</button>
								</div>

								<div className='h-4'>
									{fieldErrors.password && (
										<p
											className={clsx(
												'min-h-[5px] text-sm font-medium',
												touched.password && fieldErrors.password
													? 'text-red-600 visible'
													: 'text-transparent ',
											)}>
											{fieldErrors.password}
										</p>
									)}
								</div>
							</div>

							{/* Remember Me */}
							<div className='flex items-center gap-2'>
								<Checkbox
									id='remember'
									checked={keepLoggedIn}
									onCheckedChange={(checked) =>
										setKeepLoggedIn(checked === true)
									}
								/>
								<Label
									htmlFor='remember'
									className='text-sm font-normal text-slate-600'>
									Keep me logged in on this device
								</Label>
							</div>

							<div className='h-4'>
								{errorMessage && (
									<p className='text-sm font-medium text-red-600'>
										{errorMessage}
									</p>
								)}
								{successMessage && (
									<p className='text-sm font-medium text-green-600'>
										{successMessage}
									</p>
								)}
							</div>

							{/* Submit Button */}
							<Button
								type='submit'
								disabled={isSubmitting}
								className='h-14 w-full rounded-lg bg-care-blue text-base font-bold text-white shadow-[0px_10px_15px_-3px_rgba(0,95,184,0.2),0px_4px_6px_-4px_rgba(0,95,184,0.2)] hover:bg-care-blue-hover'>
								{isSubmitting ? 'Signing in...' : 'Secure Login'}
								<ArrowRight className='ml-2 size-4' />
							</Button>
						</form>

						{/* Footer Badges */}
						<div className='pt-12'>
							<div className='flex items-center justify-between border-t border-slate-100 pt-8'>
								<div className='flex items-center gap-4'>
									<div className='flex items-center gap-1.5 opacity-60'>
										<ShieldCheck className='size-3 text-slate-700' />
										<span className='text-[10px] font-bold uppercase leading-[10px] tracking-wider text-slate-700'>
											HIPAA
											<br />
											Verified
										</span>
									</div>
									<div className='h-6 w-px bg-border' />
									<div className='flex items-center gap-1.5 opacity-60'>
										<ShieldCheck className='size-3 text-slate-700' />
										<span className='text-[10px] font-bold uppercase leading-[10px] tracking-wider text-slate-700'>
											SSL
											<br />
											Certified
										</span>
									</div>
								</div>
								<DashboardFooter />
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
