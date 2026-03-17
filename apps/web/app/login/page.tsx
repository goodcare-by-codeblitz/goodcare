'use client';

import DashboardFooter from '@/components/dashboard/footer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useState } from 'react';

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false);

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
					{/* Left Panel — Hero */}
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
									<h1 className='text-4xl font-bold leading-[1.25] text-white'>
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

					{/* Right Panel — Form */}
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
						<form
							className='flex flex-col gap-6'
							onSubmit={(e) => e.preventDefault()}>
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
										placeholder='name@healthcare.org'
										className='h-12 rounded-lg border-border bg-muted pl-10 pr-4 text-base placeholder:text-slate-400'
									/>
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
										placeholder='••••••••'
										className='h-12 rounded-lg border-border bg-muted pl-10 pr-12 text-base placeholder:text-slate-400'
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
							</div>

							{/* Remember Me */}
							<div className='flex items-center gap-2'>
								<Checkbox id='remember' />
								<Label
									htmlFor='remember'
									className='text-sm font-normal text-slate-600'>
									Keep me logged in on this device
								</Label>
							</div>

							{/* Submit Button */}
							<Button
								type='submit'
								className='h-14 w-full rounded-lg bg-care-blue text-base font-bold text-white shadow-[0px_10px_15px_-3px_rgba(0,95,184,0.2),0px_4px_6px_-4px_rgba(0,95,184,0.2)] hover:bg-care-blue-hover'>
								Secure Login
								<ArrowRight className='ml-2 size-[18px]' />
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
								<span className='text-xs text-slate-400'>
									&copy; 2026 Good Care Pro.
								</span>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
