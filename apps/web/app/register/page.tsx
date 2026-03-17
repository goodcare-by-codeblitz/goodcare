'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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

function toSlug(s: string) {
	return s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

export default function RegisterPage() {
	const [agencyName, setAgencyName] = useState('');
	const [slug, setSlug] = useState('');
	const [slugEdited, setSlugEdited] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [agreed, setAgreed] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	function handleAgencyChange(val: string) {
		setAgencyName(val);
		if (!slugEdited) {
			setSlug(toSlug(val));
		}
	}

	function handleSlugChange(val: string) {
		setSlugEdited(true);
		setSlug(toSlug(val));
	}

	return (
		<div className='flex min-h-screen flex-col bg-[#f5f7f8]'>
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
								<CheckCircle2 className='size-14 text-[#10b981]' />
								<h2 className='text-xl font-bold text-[#0f172a]'>
									Account Created!
								</h2>
								<p className='max-w-[320px] text-sm text-[#64748b]'>
									Welcome to Good Care Pro. Check your email to verify your
									account before logging in.
								</p>
								<Link
									href='/login'
									className='mt-2 text-sm font-semibold text-[#005fb8] hover:underline'>
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
									onSubmit={(e) => {
										e.preventDefault();
										setSubmitted(true);
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
												className='h-12 rounded-lg border-[#e2e8f0] bg-[#f8fafc] pl-10 text-sm placeholder:text-[#cbd5e1]'
											/>
										</div>
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
													className='h-12 rounded-lg border-[#e2e8f0] bg-[#f8fafc] pl-10 text-sm placeholder:text-[#cbd5e1]'
												/>
											</div>
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
												className='h-12 rounded-lg border-[#e2e8f0] bg-[#f8fafc] font-mono text-sm placeholder:text-[#cbd5e1]'
											/>
										</div>
									</div>

									{/* URL preview */}
									{slug && (
										<div className='flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5'>
											<span className='text-xs text-[#94a3b8]'>
												goodcarepro.co.uk/
											</span>
											<span className='text-xs font-semibold text-[#005fb8]'>
												{slug}
											</span>
											<div className='ml-auto flex items-center gap-1.5'>
												<span className='h-1.5 w-1.5 rounded-full bg-[#10b981]' />
												<span className='text-[11px] font-medium text-[#10b981]'>
													Available
												</span>
											</div>
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
												className='font-semibold text-[#005fb8] hover:underline'>
												Terms of Service
											</Link>{' '}
											and{' '}
											<Link
												href='#'
												className='font-semibold text-[#005fb8] hover:underline'>
												Privacy Policy
											</Link>
										</Label>
									</div>

									{/* Submit */}
									<Button
										type='submit'
										className='mt-1 h-12 w-full rounded-lg bg-[#005fb8] text-sm font-bold text-white shadow-[0px_4px_6px_-1px_rgba(0,95,184,0.2)] hover:bg-[#004d96]'>
										Sign Up
										<ArrowRight className='ml-2 size-4' />
									</Button>
								</form>
							</>
						)}
					</div>

					{!submitted && (
						<p className='mt-6 text-center text-sm text-[#64748b]'>
							Already have an account?{' '}
							<Link
								href='/login'
								className='font-semibold text-[#005fb8] hover:underline'>
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
