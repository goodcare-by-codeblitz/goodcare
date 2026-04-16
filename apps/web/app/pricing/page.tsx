'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
	ArrowRight,
	Check,
	HelpCircle,
	Minus,
	Shield,
	X,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────
   Data
───────────────────────────────────────────────────────────────────────── */

const plans = [
	{
		name: 'Starter',
		tagline: 'For small agencies just getting started',
		monthlyPrice: 49,
		annualPrice: 39,
		highlight: false,
		badge: null,
		features: {
			patients: '20 patients',
			carers: '10 carers',
			branches: '1 branch',
			storage: '5 GB',
		},
		cta: 'Start free trial',
	},
	{
		name: 'Professional',
		tagline: 'The most popular choice for growing agencies',
		monthlyPrice: 99,
		annualPrice: 79,
		highlight: true,
		badge: 'Most popular',
		features: {
			patients: '100 patients',
			carers: 'Unlimited carers',
			branches: '3 branches',
			storage: '25 GB',
		},
		cta: 'Start free trial',
	},
	{
		name: 'Enterprise',
		tagline: 'For large multi-branch operations',
		monthlyPrice: null,
		annualPrice: null,
		highlight: false,
		badge: null,
		features: {
			patients: 'Unlimited patients',
			carers: 'Unlimited carers',
			branches: 'Unlimited branches',
			storage: 'Unlimited storage',
		},
		cta: 'Contact sales',
	},
];

type FeatureRow = {
	category: string;
	items: {
		label: string;
		starter: boolean | string;
		professional: boolean | string;
		enterprise: boolean | string;
	}[];
};

const featureTable: FeatureRow[] = [
	{
		category: 'Patient Management',
		items: [
			{
				label: 'Patient profiles & care plans',
				starter: true,
				professional: true,
				enterprise: true,
			},
			{
				label: 'Medical history & medication records',
				starter: true,
				professional: true,
				enterprise: true,
			},
			{
				label: 'Emergency contacts',
				starter: true,
				professional: true,
				enterprise: true,
			},
			{
				label: 'Digital MAR sheets',
				starter: false,
				professional: true,
				enterprise: true,
			},
			{
				label: 'Custom care plan templates',
				starter: false,
				professional: true,
				enterprise: true,
			},
		],
	},
	{
		category: 'Rota & Scheduling',
		items: [
			{
				label: 'Visit scheduling',
				starter: true,
				professional: true,
				enterprise: true,
			},
			{
				label: 'Carer assignment & reassignment',
				starter: true,
				professional: true,
				enterprise: true,
			},
			{
				label: 'Weekly rota view',
				starter: true,
				professional: true,
				enterprise: true,
			},
			{
				label: 'Travel time estimation',
				starter: false,
				professional: true,
				enterprise: true,
			},
			{
				label: 'Automated conflict detection',
				starter: false,
				professional: true,
				enterprise: true,
			},
		],
	},
	{
		category: 'Compliance & Audit',
		items: [
			{
				label: 'Audit trail (read-only)',
				starter: true,
				professional: true,
				enterprise: true,
			},
			{
				label: 'Incident reporting',
				starter: true,
				professional: true,
				enterprise: true,
			},
			{
				label: 'CQC inspection reports',
				starter: false,
				professional: true,
				enterprise: true,
			},
			{
				label: 'Custom compliance reports',
				starter: false,
				professional: false,
				enterprise: true,
			},
			{
				label: 'Dedicated compliance officer support',
				starter: false,
				professional: false,
				enterprise: true,
			},
		],
	},
	{
		category: 'Staff & Access',
		items: [
			{
				label: 'Role-based access control',
				starter: true,
				professional: true,
				enterprise: true,
			},
			{
				label: 'Carer mobile app',
				starter: true,
				professional: true,
				enterprise: true,
			},
			{
				label: 'Staff invitations & onboarding',
				starter: true,
				professional: true,
				enterprise: true,
			},
			{
				label: 'DBS & qualification tracking',
				starter: false,
				professional: true,
				enterprise: true,
			},
			{
				label: 'SSO / SAML',
				starter: false,
				professional: false,
				enterprise: true,
			},
		],
	},
	{
		category: 'Support',
		items: [
			{
				label: 'Email support',
				starter: true,
				professional: true,
				enterprise: true,
			},
			{
				label: 'Live chat support',
				starter: false,
				professional: true,
				enterprise: true,
			},
			{
				label: 'Phone support',
				starter: false,
				professional: false,
				enterprise: true,
			},
			{
				label: 'Dedicated account manager',
				starter: false,
				professional: false,
				enterprise: true,
			},
			{
				label: 'SLA guarantee',
				starter: '99.5%',
				professional: '99.9%',
				enterprise: '99.99%',
			},
		],
	},
];

/* ─────────────────────────────────────────────────────────────────────────
   Feature cell
───────────────────────────────────────────────────────────────────────── */

function Cell({ value }: { value: boolean | string }) {
	if (typeof value === 'string') {
		return (
			<span className='text-sm font-semibold text-[#0f172a]'>{value}</span>
		);
	}
	if (value) {
		return (
			<span className='flex h-5 w-5 items-center justify-center rounded-full bg-[#dcfce7]'>
				<Check className='size-3 stroke-[3] text-[#16a34a]' />
			</span>
		);
	}
	return <Minus className='size-4 text-[#cbd5e1]' />;
}

/* ─────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────── */

export default function PricingPage() {
	const [annual, setAnnual] = useState(false);

	return (
		<div className='fixed inset-0 overflow-y-auto bg-white'>
			{/* Nav */}
			<header className='sticky top-0 z-40 border-b border-[#e2e8f0] bg-white/95 backdrop-blur-sm'>
				<div className='mx-auto flex max-w-6xl items-center justify-between px-6 py-4'>
					<Link href='/'>
						<Image
							src='/logo.svg'
							alt='Good Care Pro'
							width={140}
							height={28}
						/>
					</Link>
					<div className='flex items-center gap-3'>
						<Link
							href='/login'
							className='text-sm font-semibold text-[#64748b] hover:text-[#0f172a]'>
							Log in
						</Link>
						<Link
							href='/register'
							className='flex h-9 items-center rounded-lg bg-[#005fb8] px-4 text-sm font-bold text-white hover:bg-[#004d96]'>
							Get started free
						</Link>
					</div>
				</div>
			</header>

			{/* Hero */}
			<section className='bg-white px-6 pb-16 pt-20 text-center'>
				<div className='mx-auto max-w-2xl'>
					<p className='mb-2 text-sm font-bold uppercase tracking-widest text-[#005fb8]'>
						Pricing
					</p>
					<h1 className='mb-5 text-5xl font-black leading-tight text-[#0f172a]'>
						Simple, transparent pricing
					</h1>
					<p className='mb-8 text-[18px] text-[#64748b]'>
						No hidden fees. No setup costs. Cancel anytime.
						<br />
						Start with a 14-day free trial on any plan.
					</p>

					{/* Billing toggle */}
					<div className='inline-flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-1'>
						<button
							onClick={() => setAnnual(false)}
							className={cn(
								'rounded-lg px-5 py-2 text-sm font-semibold transition-all',
								!annual
									? 'bg-white text-[#0f172a] shadow-sm'
									: 'text-[#64748b] hover:text-[#0f172a]',
							)}>
							Monthly
						</button>
						<button
							onClick={() => setAnnual(true)}
							className={cn(
								'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all',
								annual
									? 'bg-white text-[#0f172a] shadow-sm'
									: 'text-[#64748b] hover:text-[#0f172a]',
							)}>
							Annual
							<span className='rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-bold text-[#16a34a]'>
								Save 20%
							</span>
						</button>
					</div>
				</div>
			</section>

			{/* Plan cards */}
			<section className='bg-[#f8fafc] px-6 py-12'>
				<div className='mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3'>
					{plans.map((plan) => (
						<div
							key={plan.name}
							className={cn(
								'flex flex-col rounded-2xl border bg-white p-7',
								plan.highlight
									? 'border-[#005fb8] shadow-[0px_4px_24px_rgba(0,95,184,0.15)] ring-2 ring-[#005fb8]/20'
									: 'border-[#e2e8f0] shadow-[0px_1px_3px_rgba(0,0,0,0.06)]',
							)}>
							{/* Badge */}
							{plan.badge ? (
								<span className='mb-3 self-start rounded-full bg-[#005fb8] px-3 py-1 text-[11px] font-bold text-white'>
									{plan.badge}
								</span>
							) : (
								<div className='mb-3 h-6' />
							)}

							<p className='text-xl font-black text-[#0f172a]'>{plan.name}</p>
							<p className='mt-1 text-sm text-[#64748b]'>{plan.tagline}</p>

							{/* Price */}
							<div className='my-6 border-y border-[#f1f5f9] py-6'>
								{plan.monthlyPrice ? (
									<div className='flex items-end gap-1'>
										<span className='text-5xl font-black text-[#0f172a]'>
											£{annual ? plan.annualPrice : plan.monthlyPrice}
										</span>
										<span className='mb-1.5 text-sm text-[#94a3b8]'>/mo</span>
									</div>
								) : (
									<span className='text-4xl font-black text-[#0f172a]'>
										Custom
									</span>
								)}
								{annual && plan.monthlyPrice && (
									<p className='mt-1 text-xs text-[#64748b]'>
										Billed annually (£
										{(plan.annualPrice! * 12).toLocaleString()}/yr)
									</p>
								)}
							</div>

							{/* Key features */}
							<ul className='mb-8 flex flex-col gap-2.5'>
								{Object.values(plan.features).map((f) => (
									<li key={f} className='flex items-center gap-2.5'>
										<span className='flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#dcfce7]'>
											<Check className='size-2.5 stroke-[3] text-[#16a34a]' />
										</span>
										<span className='text-sm text-[#1e293b]'>{f}</span>
									</li>
								))}
							</ul>

							{/* CTA */}
							<div className='mt-auto'>
								<Link
									href={
										plan.name === 'Enterprise'
											? 'mailto:sales@goodcarepro.co.uk'
											: '/register'
									}
									className={cn(
										'flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all',
										plan.highlight
											? 'bg-[#005fb8] text-white shadow-[0px_4px_12px_rgba(0,95,184,0.25)] hover:bg-[#004d96]'
											: 'border border-[#e2e8f0] text-[#1e293b] hover:bg-[#f8fafc]',
									)}>
									{plan.cta}
									<ArrowRight className='size-3.5' />
								</Link>
								{plan.name !== 'Enterprise' && (
									<p className='mt-2 text-center text-xs text-[#94a3b8]'>
										14-day free trial · No credit card
									</p>
								)}
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Full comparison table */}
			<section className='bg-white px-6 py-20'>
				<div className='mx-auto max-w-5xl'>
					<h2 className='mb-10 text-center text-3xl font-black text-[#0f172a]'>
						Full feature comparison
					</h2>

					<div className='overflow-x-auto rounded-xl border border-[#e2e8f0]'>
						<table className='w-full border-collapse text-sm'>
							{/* Header */}
							<thead>
								<tr className='border-b border-[#e2e8f0]'>
									<th className='w-[40%] px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#94a3b8]'>
										Feature
									</th>
									{plans.map((p) => (
										<th
											key={p.name}
											className={cn(
												'px-4 py-4 text-center text-sm font-bold text-[#0f172a]',
												p.highlight && 'bg-[#eff6ff]',
											)}>
											{p.name}
										</th>
									))}
								</tr>
							</thead>

							<tbody>
								{featureTable.map((section) => (
									<>
										{/* Category header */}
										<tr
											key={`cat-${section.category}`}
											className='border-t-2 border-[#e2e8f0]'>
											<td
												colSpan={4}
												className='bg-[#f8fafc] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#64748b]'>
												{section.category}
											</td>
										</tr>
										{/* Feature rows */}
										{section.items.map((item) => (
											<tr
												key={item.label}
												className='border-t border-[#f1f5f9] transition-colors hover:bg-[#fafafa]'>
												<td className='px-6 py-3.5 text-sm text-[#1e293b]'>
													{item.label}
												</td>
												<td className='px-4 py-3.5 text-center'>
													<div className='flex justify-center'>
														<Cell value={item.starter} />
													</div>
												</td>
												<td className='bg-[#eff6ff]/40 px-4 py-3.5 text-center'>
													<div className='flex justify-center'>
														<Cell value={item.professional} />
													</div>
												</td>
												<td className='px-4 py-3.5 text-center'>
													<div className='flex justify-center'>
														<Cell value={item.enterprise} />
													</div>
												</td>
											</tr>
										))}
									</>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			{/* FAQ */}
			<section className='bg-[#f8fafc] px-6 py-20'>
				<div className='mx-auto max-w-2xl'>
					<h2 className='mb-10 text-center text-3xl font-black text-[#0f172a]'>
						Frequently asked questions
					</h2>
					<div className='flex flex-col gap-5'>
						{[
							{
								q: 'Can I change plans at any time?',
								a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.",
							},
							{
								q: 'Is there a setup fee?',
								a: 'No. There are no setup fees, onboarding fees, or hidden charges. You only pay the monthly or annual subscription.',
							},
							{
								q: 'What happens when my patient limit is reached?',
								a: "You'll receive a notification when you reach 80% of your patient limit. You can upgrade at any time to accommodate more patients.",
							},
							{
								q: 'Is my data secure?',
								a: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We store all data within the UK and are fully UK GDPR compliant.',
							},
							{
								q: 'Do you offer discounts for charities or NHS-affiliated organisations?',
								a: 'Yes. Please contact us at sales@goodcarepro.co.uk to discuss charitable or NHS pricing.',
							},
						].map((faq) => (
							<div
								key={faq.q}
								className='rounded-xl border border-[#e2e8f0] bg-white p-6'>
								<div className='flex items-start gap-3'>
									<HelpCircle className='mt-0.5 size-4 shrink-0 text-[#005fb8]' />
									<div>
										<p className='font-bold text-[#0f172a]'>{faq.q}</p>
										<p className='mt-1.5 text-sm leading-relaxed text-[#64748b]'>
											{faq.a}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className='bg-white px-6 py-20'>
				<div className='mx-auto max-w-xl text-center'>
					<Shield className='mx-auto mb-4 size-10 text-[#005fb8]' />
					<h2 className='mb-4 text-3xl font-black text-[#0f172a]'>
						Start your free trial today
					</h2>
					<p className='mb-8 text-[17px] text-[#64748b]'>
						14 days, full access, no credit card needed. See why 340+ agencies
						choose Good Care Pro.
					</p>
					<Link
						href='/register'
						className='inline-flex h-12 items-center gap-2 rounded-xl bg-[#005fb8] px-8 text-base font-bold text-white shadow-[0px_4px_12px_rgba(0,95,184,0.3)] hover:bg-[#004d96]'>
						Get started free
						<ArrowRight className='size-4' />
					</Link>
					<p className='mt-4 text-sm text-[#94a3b8]'>
						Questions? Email{' '}
						<a
							href='mailto:hello@goodcarepro.co.uk'
							className='text-[#005fb8] hover:underline'>
							hello@goodcarepro.co.uk
						</a>
					</p>
				</div>
			</section>

			{/* Footer */}
			<footer className='border-t border-[#e2e8f0] px-6 py-8'>
				<div className='mx-auto flex max-w-5xl items-center justify-between'>
					<p className='text-xs text-[#94a3b8]'>
						&copy; 2026 Good Care Pro Ltd. All rights reserved.
					</p>
					<Link
						href='/'
						className='text-xs font-semibold text-[#64748b] hover:text-[#0f172a]'>
						← Back to home
					</Link>
				</div>
			</footer>
		</div>
	);
}
