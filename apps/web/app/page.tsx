'use client';

import { broadcastAuthEvent, buildBaseAppUrl } from '@/lib/auth-session';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/lib/stores/session-store';
import axios from 'axios';
import {
	Activity,
	AlertTriangle,
	ArrowRight,
	Bell,
	CalendarDays,
	Check,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	ClipboardList,
	Clock,
	FileText,
	Home,
	Lock,
	MapPin,
	Menu,
	MoreHorizontal,
	Pill,
	Plus,
	Search,
	Settings,
	Shield,
	Star,
	TrendingDown,
	TrendingUp,
	UserCheck,
	Users,
	X,
	Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ─────────────────────────────────────────────────────────────────────────
   Global animations
───────────────────────────────────────────────────────────────────────── */

const ANIMATIONS = `
@keyframes float-y {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer-cta {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(0,95,184,0.30); }
  70%  { box-shadow: 0 0 0 12px rgba(0,95,184,0); }
  100% { box-shadow: 0 0 0 0 rgba(0,95,184,0); }
}
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes bar-grow {
  from { width: 0; }
}
.anim-float   { animation: float-y 5.5s ease-in-out infinite; }
.anim-fade0   { animation: fade-up 0.6s cubic-bezier(.22,1,.36,1) both; }
.anim-fade1   { animation: fade-up 0.6s cubic-bezier(.22,1,.36,1) 0.1s both; }
.anim-fade2   { animation: fade-up 0.6s cubic-bezier(.22,1,.36,1) 0.22s both; }
.anim-fade3   { animation: fade-up 0.6s cubic-bezier(.22,1,.36,1) 0.34s both; }
.anim-fade4   { animation: fade-up 0.6s cubic-bezier(.22,1,.36,1) 0.46s both; }
.anim-cta {
  background: linear-gradient(120deg, #0053a8 0%, #1a7de0 45%, #0053a8 100%);
  background-size: 200% 200%;
  animation: shimmer-cta 3.5s ease infinite;
}
.anim-pulse { animation: pulse-ring 2.8s ease-out infinite; }
.anim-marquee { animation: marquee 30s linear infinite; }
`;

/* ─────────────────────────────────────────────────────────────────────────
   Shared tiny utilities for mockups
───────────────────────────────────────────────────────────────────────── */

function Avatar({
	initials,
	color = 'bg-[#005fb8]',
	size = 'h-5 w-5',
	text = 'text-[6px]',
}: {
	initials: string;
	color?: string;
	size?: string;
	text?: string;
}) {
	return (
		<div
			className={cn(
				'flex shrink-0 items-center justify-center rounded-full font-bold text-white',
				size,
				color,
				text,
			)}>
			{initials}
		</div>
	);
}

function Badge({
	label,
	variant,
}: {
	label: string;
	variant: 'green' | 'blue' | 'amber' | 'red' | 'slate';
}) {
	const styles = {
		green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		blue: 'bg-blue-50 text-blue-700 border-blue-200',
		amber: 'bg-amber-50 text-amber-700 border-amber-200',
		red: 'bg-red-50 text-red-700 border-red-200',
		slate: 'bg-slate-100 text-slate-500 border-slate-200',
	};
	return (
		<span
			className={cn(
				'rounded border px-1 py-px text-[6px] font-semibold leading-none',
				styles[variant],
			)}>
			{label}
		</span>
	);
}

function Sparkline({
	data,
	color = '#005fb8',
}: {
	data: number[];
	color?: string;
}) {
	const max = Math.max(...data);
	const min = Math.min(...data);
	const range = max - min || 1;
	const w = 36;
	const h = 16;
	const pts = data
		.map(
			(v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`,
		)
		.join(' ');
	return (
		<svg width={w} height={h} className='overflow-visible'>
			<polyline
				points={pts}
				fill='none'
				stroke={color}
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
		</svg>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   SVG Mockups — crisp, static, pixel-perfect representations
───────────────────────────────────────────────────────────────────────── */

function DashboardMockup() {
	const kpis = [
		{
			x: 80,
			vw: 48,
			lw: 72,
			trend: '#dcfce7',
			pts: '220,112 229,106 238,110 247,103 256,106 265,99',
		},
		{
			x: 284,
			vw: 28,
			lw: 64,
			trend: '#dcfce7',
			pts: '424,110 433,105 442,108 451,102 460,105 469,98',
		},
		{
			x: 488,
			vw: 18,
			lw: 60,
			trend: '#fef3c7',
			pts: '628,108 637,113 646,110 655,115 664,112 673,116',
		},
		{
			x: 692,
			vw: 44,
			lw: 68,
			trend: '#dcfce7',
			pts: '832,111 841,106 850,109 859,102 868,106 877,99',
		},
	];
	const rows = [
		{ av: '#dbeafe', badge: '#dcfce7', nw: 78, tw: 30 },
		{ av: '#fce7f3', badge: '#dcfce7', nw: 68, tw: 26 },
		{ av: '#d1fae5', badge: '#bfdbfe', nw: 58, tw: 28 },
		{ av: '#fef3c7', badge: '#f1f5f9', nw: 64, tw: 32 },
		{ av: '#fee2e2', badge: '#f1f5f9', nw: 72, tw: 24 },
	];
	return (
		<svg
			viewBox='0 0 900 510'
			className='h-full w-full'
			xmlns='http://www.w3.org/2000/svg'>
			{/* Sidebar */}
			<rect width='64' height='510' fill='#0c1c30' />
			<rect x='14' y='13' width='36' height='8' rx='4' fill='#1a3d6e' />
			<rect x='14' y='13' width='9' height='8' rx='4' fill='#005fb8' />
			<rect x='8' y='44' width='48' height='20' rx='5' fill='#1b3a5c' />
			{[48, 70, 92, 114, 136, 158].map((y, i) => (
				<g key={y}>
					<rect
						x='14'
						y={y}
						width='10'
						height='10'
						rx='2.5'
						fill={i === 0 ? '#3b82f6' : '#162b40'}
					/>
					<rect
						x='30'
						y={y + 2}
						width={[22, 20, 16, 24, 18, 20][i]}
						height='6'
						rx='2'
						fill={i === 0 ? '#1d3f64' : '#0f2336'}
					/>
				</g>
			))}
			<line x1='14' y1='480' x2='50' y2='480' stroke='#1a2e45' />
			<circle cx='32' cy='496' r='10' fill='#152840' />
			<rect x='26' y='493' width='12' height='5' rx='2.5' fill='#1c3350' />
			{/* Main bg */}
			<rect x='64' width='836' height='510' fill='#f8fafc' />
			{/* Topbar */}
			<rect x='64' width='836' height='40' fill='white' />
			<line x1='64' y1='40.5' x2='900' y2='40.5' stroke='#e2e8f0' />
			<rect x='80' y='12' width='78' height='9' rx='3' fill='#0f172a' />
			<rect x='80' y='27' width='52' height='5.5' rx='2' fill='#e2e8f0' />
			<rect
				x='558'
				y='10'
				width='112'
				height='20'
				rx='5'
				fill='#f1f5f9'
				stroke='#e2e8f0'
				strokeWidth='1'
			/>
			<rect x='571' y='16' width='48' height='6' rx='2' fill='#dde4ed' />
			<rect
				x='684'
				y='10'
				width='20'
				height='20'
				rx='5'
				fill='#f1f5f9'
				stroke='#e2e8f0'
				strokeWidth='1'
			/>
			<rect x='689' y='15' width='10' height='9' rx='2' fill='#c8d4e0' />
			<circle cx='704' cy='11' r='4' fill='#ef4444' />
			<circle cx='740' cy='20' r='11' fill='#dbeafe' />
			<rect x='734' y='17' width='12' height='6' rx='3' fill='#93c5fd' />
			{/* KPI cards */}
			{kpis.map((k) => (
				<g key={k.x}>
					<rect
						x={k.x}
						y='52'
						width='192'
						height='70'
						rx='8'
						fill='white'
						stroke='#e2e8f0'
						strokeWidth='1'
					/>
					<rect
						x={k.x + 12}
						y='64'
						width={k.vw}
						height='15'
						rx='3.5'
						fill='#0f172a'
					/>
					<rect
						x={k.x + 12}
						y='86'
						width={k.lw}
						height='5.5'
						rx='2'
						fill='#e2e8f0'
					/>
					<rect
						x={k.x + 12}
						y='98'
						width='34'
						height='5'
						rx='2.5'
						fill={k.trend}
					/>
					<polyline
						points={k.pts}
						fill='none'
						stroke={k.trend === '#dcfce7' ? '#10b981' : '#f59e0b'}
						strokeWidth='1.5'
						strokeLinecap='round'
						strokeLinejoin='round'
					/>
				</g>
			))}
			{/* Visit list */}
			<rect
				x='80'
				y='134'
				width='488'
				height='360'
				rx='8'
				fill='white'
				stroke='#e2e8f0'
				strokeWidth='1'
			/>
			<rect x='96' y='148' width='96' height='7.5' rx='3' fill='#0f172a' />
			<rect x='496' y='144' width='56' height='14' rx='5' fill='#f1f5f9' />
			<rect x='505' y='148' width='38' height='6' rx='2' fill='#94a3b8' />
			<line
				x1='80'
				y1='168.5'
				x2='568'
				y2='168.5'
				stroke='#f1f5f9'
				strokeWidth='1.5'
			/>
			{rows.map((r, i) => {
				const y = 177 + i * 38;
				return (
					<g key={i}>
						<circle cx='98' cy={y + 12} r='9' fill={r.av} />
						<rect
							x='114'
							y={y + 5}
							width={r.nw}
							height='7.5'
							rx='2.5'
							fill='#1e293b'
							opacity={0.82}
						/>
						<rect
							x='114'
							y={y + 18}
							width={r.tw}
							height='5'
							rx='2'
							fill='#e2e8f0'
						/>
						<rect
							x='244'
							y={y + 19}
							width='48'
							height='5'
							rx='2'
							fill='#e2e8f0'
							opacity={0.8}
						/>
						<rect
							x='322'
							y={y + 8}
							width='82'
							height='6'
							rx='2'
							fill='#e2e8f0'
							opacity={0.75}
						/>
						<rect
							x='426'
							y={y + 8}
							width='50'
							height='6'
							rx='2'
							fill='#e2e8f0'
							opacity={0.6}
						/>
						<rect
							x='482'
							y={y + 5}
							width='54'
							height='14'
							rx='6'
							fill={r.badge}
						/>
						{i < 4 && (
							<line
								x1='80'
								y1={y + 36.5}
								x2='568'
								y2={y + 36.5}
								stroke='#f8fafc'
								strokeWidth='1.5'
							/>
						)}
					</g>
				);
			})}
			{/* Right column */}
			<rect
				x='580'
				y='134'
				width='304'
				height='106'
				rx='8'
				fill='white'
				stroke='#e2e8f0'
				strokeWidth='1'
			/>
			<rect x='596' y='148' width='92' height='7.5' rx='3' fill='#0f172a' />
			<rect x='596' y='165' width='272' height='6' rx='3' fill='#f1f5f9' />
			<rect x='596' y='165' width='214' height='6' rx='3' fill='#005fb8' />
			<rect x='596' y='178' width='52' height='5' rx='2' fill='#e2e8f0' />
			<rect x='654' y='178' width='34' height='5' rx='2' fill='#dcfce7' />
			<rect x='818' y='146' width='50' height='22' rx='6' fill='#eff6ff' />
			<rect
				x='826'
				y='152'
				width='34'
				height='10'
				rx='3'
				fill='#3b82f6'
				opacity={0.5}
			/>
			<rect x='596' y='198' width='38' height='5.5' rx='2' fill='#e2e8f0' />
			<rect x='640' y='198' width='30' height='5.5' rx='2' fill='#dcfce7' />
			<rect
				x='580'
				y='252'
				width='304'
				height='72'
				rx='8'
				fill='#fffbeb'
				stroke='#fde68a'
				strokeWidth='1'
			/>
			<rect
				x='596'
				y='264'
				width='58'
				height='6.5'
				rx='2.5'
				fill='#92400e'
				opacity={0.75}
			/>
			<rect
				x='596'
				y='276'
				width='140'
				height='5'
				rx='2'
				fill='#fcd34d'
				opacity={0.9}
			/>
			<rect
				x='596'
				y='286'
				width='110'
				height='5'
				rx='2'
				fill='#fcd34d'
				opacity={0.65}
			/>
			<rect
				x='596'
				y='296'
				width='80'
				height='5'
				rx='2'
				fill='#fcd34d'
				opacity={0.45}
			/>
			<rect
				x='596'
				y='308'
				width='44'
				height='12'
				rx='4'
				fill='#fbbf24'
				opacity={0.4}
			/>
			<rect
				x='580'
				y='336'
				width='304'
				height='158'
				rx='8'
				fill='white'
				stroke='#e2e8f0'
				strokeWidth='1'
			/>
			<rect x='596' y='350' width='82' height='7.5' rx='3' fill='#0f172a' />
			{(
				[
					[88, 54, '#dcfce7', '#10b981'],
					[100, 62, '#dbeafe', '#3b82f6'],
					[76, 48, '#fef3c7', '#f59e0b'],
				] as const
			).map(([nw, tw, bg, border], i) => {
				const ay = 370 + i * 42;
				return (
					<g key={i}>
						<circle
							cx='598'
							cy={ay + 4}
							r='4'
							fill={bg}
							stroke={border}
							strokeWidth='1.5'
						/>
						<rect
							x='610'
							y={ay}
							width={nw}
							height='6.5'
							rx='2.5'
							fill='#1e293b'
							opacity={0.75}
						/>
						<rect
							x='610'
							y={ay + 11}
							width={tw}
							height='4.5'
							rx='2'
							fill='#e2e8f0'
						/>
						{i < 2 && (
							<line
								x1='580'
								y1={ay + 24}
								x2='884'
								y2={ay + 24}
								stroke='#f8fafc'
							/>
						)}
					</g>
				);
			})}
		</svg>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   RotaMockup — SVG weekly scheduling grid
───────────────────────────────────────────────────────────────────────── */

function RotaMockup() {
	const cW = 88; // carer column width
	const dW = 116; // day column width  (88 + 7×116 = 900)
	const dX = (d: number) => cW + d * dW;
	const rH = 74; // row height
	const rY = (r: number) => 104 + r * rH; // rows start after header(42)+strip(32)+dayheader(30)
	// [carer, day, leftFraction, widthFraction, fill, textFill]
	const blocks: Array<[number, number, number, number, string, string]> = [
		[0, 0, 0.13, 0.58, '#dbeafe', '#1d4ed8'],
		[0, 1, 0.17, 0.55, '#dbeafe', '#1d4ed8'],
		[0, 3, 0.13, 0.46, '#fef3c7', '#92400e'],
		[0, 4, 0.22, 0.55, '#dbeafe', '#1d4ed8'],
		[1, 0, 0.36, 0.55, '#dbeafe', '#1d4ed8'],
		[1, 2, 0.13, 0.58, '#dbeafe', '#1d4ed8'],
		[1, 4, 0.13, 0.46, '#dbeafe', '#1d4ed8'],
		[1, 5, 0.17, 0.63, '#ede9fe', '#6d28d9'],
		[2, 1, 0.3, 0.55, '#dbeafe', '#1d4ed8'],
		[2, 2, 0.43, 0.42, '#fef3c7', '#92400e'],
		[2, 3, 0.26, 0.5, '#dbeafe', '#1d4ed8'],
		[2, 6, 0.17, 0.71, '#dbeafe', '#1d4ed8'],
		[3, 0, 0.55, 0.54, '#ede9fe', '#6d28d9'],
		[3, 2, 0.26, 0.63, '#fef3c7', '#92400e'],
		[3, 5, 0.51, 0.54, '#dbeafe', '#1d4ed8'],
		[4, 1, 0.13, 0.5, '#dbeafe', '#1d4ed8'],
		[4, 3, 0.47, 0.42, '#dbeafe', '#1d4ed8'],
		[4, 4, 0.34, 0.55, '#dbeafe', '#1d4ed8'],
		[4, 6, 0.26, 0.5, '#fef3c7', '#92400e'],
	];
	const carerFills = ['#e0e7ff', '#dbeafe', '#d1fae5', '#fce7f3', '#fef3c7'];
	const carerNW = [54, 62, 46, 58, 52];
	return (
		<svg
			viewBox='0 0 900 510'
			className='h-full w-full'
			xmlns='http://www.w3.org/2000/svg'>
			{/* Header */}
			<rect width='900' height='42' fill='white' />
			<line x1='0' y1='42.5' x2='900' y2='42.5' stroke='#e2e8f0' />
			<rect x='16' y='12' width='116' height='9' rx='3' fill='#0f172a' />
			<rect x='16' y='27' width='72' height='5.5' rx='2' fill='#e2e8f0' />
			<rect
				x='570'
				y='10'
				width='116'
				height='22'
				rx='6'
				fill='#f1f5f9'
				stroke='#e2e8f0'
				strokeWidth='1'
			/>
			<rect
				x='573'
				y='13'
				width='34'
				height='16'
				rx='4'
				fill='white'
				stroke='#e2e8f0'
				strokeWidth='1'
			/>
			<rect
				x='578'
				y='18'
				width='24'
				height='6'
				rx='2'
				fill='#0f172a'
				opacity={0.7}
			/>
			<rect x='611' y='18' width='24' height='6' rx='2' fill='#94a3b8' />
			<rect x='644' y='18' width='28' height='6' rx='2' fill='#94a3b8' />
			<rect x='700' y='10' width='72' height='22' rx='6' fill='#005fb8' />
			<rect
				x='715'
				y='17'
				width='42'
				height='7'
				rx='2.5'
				fill='white'
				opacity={0.85}
			/>
			{/* Stats strip */}
			<rect width='900' y='42' height='32' fill='#f8fafc' />
			<line x1='0' y1='74.5' x2='900' y2='74.5' stroke='#e2e8f0' />
			{(
				[
					{ x: 16, vw: 26, lw: 58, c: '#0f172a' },
					{ x: 226, vw: 32, lw: 70, c: '#0f172a' },
					{ x: 451, vw: 12, lw: 54, c: '#f59e0b' },
					{ x: 676, vw: 8, lw: 42, c: '#10b981' },
				] as const
			).map((s, i) => (
				<g key={i}>
					<rect
						x={s.x}
						y='51'
						width={s.vw}
						height='7'
						rx='2'
						fill={s.c}
						opacity={0.85}
					/>
					<rect
						x={s.x + s.vw + 6}
						y='52.5'
						width={s.lw}
						height='5.5'
						rx='2'
						fill='#e2e8f0'
					/>
				</g>
			))}
			{/* Day header row */}
			<rect
				x='0'
				y='74'
				width={cW}
				height='30'
				fill='#f8fafc'
				stroke='#e2e8f0'
				strokeWidth='0.5'
			/>
			{[0, 1, 2, 3, 4, 5, 6].map((d) => (
				<g key={d}>
					<rect
						x={dX(d)}
						y='74'
						width={dW}
						height='30'
						fill={d === 0 ? '#f0f6ff' : 'white'}
						stroke='#e2e8f0'
						strokeWidth='0.5'
					/>
					<rect
						x={dX(d) + 22}
						y='83'
						width={d === 0 ? 68 : 58}
						height='6.5'
						rx='2'
						fill={d === 0 ? '#005fb8' : '#94a3b8'}
						opacity={d === 0 ? 0.75 : 0.45}
					/>
				</g>
			))}
			{/* Carer rows + day cell backgrounds */}
			{[0, 1, 2, 3, 4].map((r) => (
				<g key={r}>
					<rect
						x='0'
						y={rY(r)}
						width={cW}
						height={rH}
						fill='white'
						stroke='#e2e8f0'
						strokeWidth='0.5'
					/>
					<circle cx='22' cy={rY(r) + rH / 2} r='12' fill={carerFills[r]} />
					<rect
						x='40'
						y={rY(r) + rH / 2 - 7}
						width={carerNW[r]}
						height='7'
						rx='2.5'
						fill='#0f172a'
						opacity={0.78}
					/>
					<rect
						x='40'
						y={rY(r) + rH / 2 + 3}
						width={carerNW[r] - 12}
						height='5'
						rx='2'
						fill='#e2e8f0'
					/>
					{[0, 1, 2, 3, 4, 5, 6].map((d) => (
						<rect
							key={d}
							x={dX(d)}
							y={rY(r)}
							width={dW}
							height={rH}
							fill={d === 0 ? '#f8fbff' : 'white'}
							stroke='#f1f5f9'
							strokeWidth='0.5'
						/>
					))}
				</g>
			))}
			{/* Time blocks */}
			{blocks.map(([r, d, lF, wF, fill, text], i) => {
				const bx = dX(d) + Math.round(dW * lF);
				const bw = Math.round(dW * wF);
				const by = rY(r) + 14;
				return (
					<g key={i}>
						<rect x={bx} y={by} width={bw} height='24' rx='4' fill={fill} />
						<rect
							x={bx + 6}
							y={by + 8}
							width={Math.max(bw - 14, 0)}
							height='5'
							rx='2'
							fill={text}
							opacity={0.5}
						/>
					</g>
				);
			})}
		</svg>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   CarePlanMockup — SVG patient care plan view
───────────────────────────────────────────────────────────────────────── */

function CarePlanMockup() {
	const lW = 492; // left col width (starts at x=16)
	const rX = 524; // right col x   (16+492+16=524)
	const rW = 360; // right col width (524+360+16=900)
	const meds = [
		{ nw: 132, dw: 80, bar: 0.94, badge: '#dcfce7', bt: '#16a34a' },
		{ nw: 80, dw: 68, bar: 0.88, badge: '#dcfce7', bt: '#16a34a' },
		{ nw: 96, dw: 90, bar: 1.0, badge: '#fef3c7', bt: '#92400e' },
	];
	const tasks = [
		{ done: true, nw: 100 },
		{ done: true, nw: 82 },
		{ done: true, nw: 116 },
		{ done: false, nw: 88, crit: true },
		{ done: false, nw: 96 },
		{ done: false, nw: 110 },
	];
	return (
		<svg
			viewBox='0 0 900 510'
			className='h-full w-full'
			xmlns='http://www.w3.org/2000/svg'>
			{/* Patient header */}
			<rect width='900' height='56' fill='white' />
			<line x1='0' y1='56.5' x2='900' y2='56.5' stroke='#e2e8f0' />
			<circle cx='28' cy='28' r='16' fill='#e0f2fe' />
			<rect x='21' y='24' width='14' height='6' rx='3' fill='#7dd3fc' />
			<circle
				cx='40'
				cy='40'
				r='4'
				fill='#10b981'
				stroke='white'
				strokeWidth='1.5'
			/>
			<rect x='54' y='12' width='110' height='9' rx='3' fill='#0f172a' />
			<rect x='170' y='12' width='42' height='12' rx='5' fill='#dcfce7' />
			<rect
				x='179'
				y='16'
				width='24'
				height='5'
				rx='2'
				fill='#16a34a'
				opacity={0.7}
			/>
			<rect x='218' y='12' width='82' height='12' rx='5' fill='#dbeafe' />
			<rect
				x='227'
				y='16'
				width='64'
				height='5'
				rx='2'
				fill='#1d4ed8'
				opacity={0.6}
			/>
			<rect x='54' y='29' width='52' height='5.5' rx='2' fill='#e2e8f0' />
			<rect x='112' y='29' width='44' height='5.5' rx='2' fill='#e2e8f0' />
			<rect x='162' y='29' width='60' height='5.5' rx='2' fill='#e2e8f0' />
			<rect x='782' y='14' width='54' height='14' rx='5' fill='#f1f5f9' />
			<rect x='794' y='18' width='30' height='6' rx='2' fill='#94a3b8' />
			<rect x='842' y='14' width='24' height='24' rx='5' fill='#f1f5f9' />
			<rect x='848' y='24' width='12' height='4' rx='2' fill='#94a3b8' />
			{/* Tabs */}
			<rect width='900' y='56' height='28' fill='white' />
			<line x1='0' y1='84.5' x2='900' y2='84.5' stroke='#e2e8f0' />
			{[
				{ x: 16, w: 56, active: true },
				{ x: 84, w: 70, active: false },
				{ x: 166, w: 62, active: false },
				{ x: 240, w: 38, active: false },
			].map((t, i) => (
				<g key={i}>
					<rect
						x={t.x}
						y='68'
						width={t.w}
						height='6.5'
						rx='2'
						fill={t.active ? '#005fb8' : '#94a3b8'}
						opacity={t.active ? 0.8 : 0.4}
					/>
					{t.active && (
						<rect
							x={t.x}
							y='81'
							width={t.w}
							height='2.5'
							rx='1'
							fill='#005fb8'
						/>
					)}
				</g>
			))}
			{/* Content bg */}
			<rect width='900' y='84' height='426' fill='#f8fafc' />
			{/* DIAGNOSES CARD */}
			<rect
				x='16'
				y='100'
				width={lW}
				height='132'
				rx='8'
				fill='white'
				stroke='#e2e8f0'
				strokeWidth='1'
			/>
			<rect x='32' y='114' width='94' height='7.5' rx='3' fill='#0f172a' />
			<rect
				x={16 + lW - 74}
				y='110'
				width='58'
				height='13'
				rx='5'
				fill='#f1f5f9'
			/>
			<rect
				x={16 + lW - 64}
				y='114'
				width='38'
				height='5'
				rx='2'
				fill='#94a3b8'
			/>
			<line
				x1='16'
				y1='133.5'
				x2={16 + lW}
				y2='133.5'
				stroke='#f1f5f9'
				strokeWidth='1.5'
			/>
			<rect x='32' y='142' width='18' height='18' rx='4' fill='#f1f5f9' />
			<rect
				x='38'
				y='147'
				width='8'
				height='8'
				rx='2'
				fill='#94a3b8'
				opacity={0.5}
			/>
			<rect
				x='58'
				y='143'
				width='110'
				height='7'
				rx='2.5'
				fill='#0f172a'
				opacity={0.82}
			/>
			<rect x='58' y='155' width='68' height='5' rx='2' fill='#e2e8f0' />
			<rect
				x={16 + lW - 70}
				y='142'
				width='54'
				height='13'
				rx='5'
				fill='#dbeafe'
			/>
			<rect
				x={16 + lW - 60}
				y='146'
				width='34'
				height='5'
				rx='2'
				fill='#1d4ed8'
				opacity={0.6}
			/>
			<line
				x1='16'
				y1='170.5'
				x2={16 + lW}
				y2='170.5'
				stroke='#f1f5f9'
				strokeWidth='1'
			/>
			<rect x='32' y='178' width='18' height='18' rx='4' fill='#f1f5f9' />
			<rect
				x='38'
				y='183'
				width='8'
				height='8'
				rx='2'
				fill='#94a3b8'
				opacity={0.5}
			/>
			<rect
				x='58'
				y='179'
				width='130'
				height='7'
				rx='2.5'
				fill='#0f172a'
				opacity={0.82}
			/>
			<rect x='58' y='191' width='76' height='5' rx='2' fill='#e2e8f0' />
			<rect
				x={16 + lW - 76}
				y='178'
				width='60'
				height='13'
				rx='5'
				fill='#fef3c7'
			/>
			<rect
				x={16 + lW - 67}
				y='182'
				width='42'
				height='5'
				rx='2'
				fill='#92400e'
				opacity={0.55}
			/>
			<rect
				x='32'
				y='212'
				width={lW - 32}
				height='14'
				rx='5'
				fill='#fef2f2'
				stroke='#fee2e2'
				strokeWidth='1'
			/>
			<rect
				x='46'
				y='216'
				width='186'
				height='5.5'
				rx='2'
				fill='#ef4444'
				opacity={0.5}
			/>
			{/* MEDICATIONS CARD */}
			<rect
				x='16'
				y='246'
				width={lW}
				height='152'
				rx='8'
				fill='white'
				stroke='#e2e8f0'
				strokeWidth='1'
			/>
			<rect x='32' y='260' width='80' height='7.5' rx='3' fill='#0f172a' />
			<rect
				x={16 + lW - 70}
				y='256'
				width='54'
				height='13'
				rx='5'
				fill='#dbeafe'
			/>
			<rect
				x={16 + lW - 60}
				y='260'
				width='34'
				height='5'
				rx='2'
				fill='#1d4ed8'
				opacity={0.6}
			/>
			{meds.map((m, i) => {
				const my = 280 + i * 38;
				const bw = (lW - 64) * m.bar;
				return (
					<g key={i}>
						<line
							x1='16'
							y1={my - 0.5}
							x2={16 + lW}
							y2={my - 0.5}
							stroke='#f8fafc'
							strokeWidth='1.5'
						/>
						<rect
							x='32'
							y={my + 4}
							width={m.nw}
							height='7'
							rx='2.5'
							fill='#0f172a'
							opacity={0.82}
						/>
						<rect
							x='32'
							y={my + 16}
							width={m.dw}
							height='5'
							rx='2'
							fill='#e2e8f0'
						/>
						<rect
							x={16 + lW - 68}
							y={my + 2}
							width='52'
							height='13'
							rx='5'
							fill={m.badge}
						/>
						<rect
							x={16 + lW - 60}
							y={my + 6}
							width='36'
							height='5'
							rx='2'
							fill={m.bt}
							opacity={0.6}
						/>
						<rect
							x='32'
							y={my + 27}
							width={lW - 48}
							height='4'
							rx='2'
							fill='#f1f5f9'
						/>
						<rect
							x='32'
							y={my + 27}
							width={bw}
							height='4'
							rx='2'
							fill={i === 2 ? '#10b981' : '#005fb8'}
						/>
					</g>
				);
			})}
			{/* TASKS CARD */}
			<rect
				x={rX}
				y='100'
				width={rW}
				height='224'
				rx='8'
				fill='white'
				stroke='#e2e8f0'
				strokeWidth='1'
			/>
			<rect x={rX + 16} y='114' width='84' height='7.5' rx='3' fill='#0f172a' />
			<rect
				x={rX + rW - 68}
				y='112'
				width='52'
				height='10'
				rx='3'
				fill='#f1f5f9'
			/>
			<rect
				x={rX + rW - 62}
				y='116'
				width='40'
				height='6'
				rx='2'
				fill='#94a3b8'
			/>
			<rect
				x={rX + 16}
				y='132'
				width={rW - 32}
				height='5'
				rx='2.5'
				fill='#f1f5f9'
			/>
			<rect
				x={rX + 16}
				y='132'
				width={(rW - 32) * 0.5}
				height='5'
				rx='2.5'
				fill='#10b981'
			/>
			{tasks.map((t, i) => {
				const ty = 150 + i * 27;
				return (
					<g key={i}>
						<circle
							cx={rX + 24}
							cy={ty + 6}
							r='6'
							fill={t.done ? '#10b981' : 'white'}
							stroke={t.done ? '#10b981' : '#e2e8f0'}
							strokeWidth='1.5'
						/>
						{t.done && (
							<rect
								x={rX + 20}
								y={ty + 4}
								width='8'
								height='4'
								rx='2'
								fill='white'
								opacity={0.9}
							/>
						)}
						<rect
							x={rX + 36}
							y={ty + 2}
							width={t.nw}
							height='6.5'
							rx='2.5'
							fill={t.done ? '#e2e8f0' : '#0f172a'}
							opacity={t.done ? 0.6 : 0.82}
						/>
						{'crit' in t && t.crit && !t.done && (
							<rect
								x={rX + rW - 60}
								y={ty + 1}
								width='44'
								height='11'
								rx='4'
								fill='#fef2f2'
							/>
						)}
						{'crit' in t && t.crit && !t.done && (
							<rect
								x={rX + rW - 54}
								y={ty + 4}
								width='32'
								height='5'
								rx='2'
								fill='#ef4444'
								opacity={0.55}
							/>
						)}
					</g>
				);
			})}
			{/* VITALS CARD */}
			<rect
				x={rX}
				y='338'
				width={rW}
				height='152'
				rx='8'
				fill='white'
				stroke='#e2e8f0'
				strokeWidth='1'
			/>
			<rect
				x={rX + 16}
				y='352'
				width='112'
				height='7.5'
				rx='3'
				fill='#0f172a'
			/>
			{(
				[
					{ y: 372, lw: 76, vw: 50 },
					{ y: 400, lw: 44, vw: 28 },
					{ y: 428, lw: 40, vw: 32 },
				] as const
			).map((v, i) => (
				<g key={i}>
					<line
						x1={rX}
						y1={v.y - 0.5}
						x2={rX + rW}
						y2={v.y - 0.5}
						stroke='#f8fafc'
						strokeWidth='1.5'
					/>
					<rect
						x={rX + 16}
						y={v.y + 5}
						width={v.lw}
						height='6'
						rx='2'
						fill='#64748b'
						opacity={0.55}
					/>
					<rect
						x={rX + rW - v.vw - 22}
						y={v.y + 4}
						width={v.vw}
						height='7'
						rx='2.5'
						fill='#0f172a'
						opacity={0.8}
					/>
					<circle cx={rX + rW - 12} cy={v.y + 8} r='4' fill='#10b981' />
				</g>
			))}
			<rect
				x={rX + 16}
				y='458'
				width='124'
				height='5.5'
				rx='2'
				fill='#e2e8f0'
				opacity={0.7}
			/>
		</svg>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   BrowserFrame
───────────────────────────────────────────────────────────────────────── */

function BrowserFrame({ children }: { children: React.ReactNode }) {
	return (
		<div className='overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0px_24px_64px_-12px_rgba(0,0,0,0.14),0px_8px_20px_-6px_rgba(0,0,0,0.07)]'>
			<div className='flex items-center gap-3 border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5'>
				<div className='flex gap-1.5'>
					<span className='h-2.5 w-2.5 rounded-full bg-[#fc5f57]' />
					<span className='h-2.5 w-2.5 rounded-full bg-[#febc2e]' />
					<span className='h-2.5 w-2.5 rounded-full bg-[#28c840]' />
				</div>
				<div className='flex flex-1 items-center justify-center'>
					<div className='flex h-5 items-center gap-1.5 rounded-md bg-white px-3 text-[10px] text-[#94a3b8] shadow-sm ring-1 ring-[#e2e8f0]'>
						🔒 goodcarepro.co.uk/dashboard
					</div>
				</div>
			</div>
			<div className='h-[340px]'>{children}</div>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   Nav
───────────────────────────────────────────────────────────────────────── */

function Nav() {
	const [scrolled, setScrolled] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

	const router = useRouter();
	const clearSession = useSessionStore((state) => state.clear);

	console.log('Auth status:', isAuthed);

	const handleLogout = async () => {
		try {
			const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.replace(
				/\/+$/,
				'',
			);

			await axios.delete(`${baseUrl}/v1/auth/logout`, {
				withCredentials: true,
			});
			setIsAuthed(false);
			clearSession();
			broadcastAuthEvent('logout');

			const loginUrl = buildBaseAppUrl('/login');
			if (loginUrl) {
				window.location.replace(loginUrl);
				return;
			}

			router.replace('/login');
		} catch (error) {
			console.error('Logout failed:', error);
		}
	};

	useEffect(() => {
		const el = document.getElementById('page-scroll');
		if (!el) return;
		const onScroll = () => setScrolled(el.scrollTop > 16);
		el.addEventListener('scroll', onScroll, { passive: true });
		return () => el.removeEventListener('scroll', onScroll);
	}, []);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.replace(
					/\/+$/,
					'',
				);
				await axios.get(`${baseUrl}/v1/auth/me`, {
					withCredentials: true,
				});
				setIsAuthed(true);
			} catch {
				setIsAuthed(false);
			}
		};

		checkAuth();
	}, [isAuthed]);

	return (
		<header
			className={cn(
				'sticky top-0 z-40 w-full transition-all duration-300',
				scrolled
					? 'border-b border-[#e2e8f0] bg-white/95 shadow-[0_1px_12px_rgba(0,0,0,0.06)] backdrop-blur-md'
					: 'bg-white',
			)}>
			<div className='mx-auto flex max-w-6xl items-center justify-between px-6 py-4'>
				<Link href='/'>
					<Image src='/logo.svg' alt='Good Care Pro' width={180} height={28} />
				</Link>
				<nav className='hidden items-center gap-8 md:flex'>
					{[
						['Features', '#features'],
						['How it works', '#how-it-works'],
						['Compliance', '#compliance'],
						['Pricing', '/pricing'],
					].map(([label, href]) => (
						<Link
							key={label}
							href={href}
							className='text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f172a]'>
							{label}
						</Link>
					))}
				</nav>

				{/* Conditionally render buttons */}
				{isAuthed ? (
					<div className='hidden items-center gap-3 md:flex'>
						<Link
							href='/dashboard'
							className='text-sm font-semibold text-[#64748b] transition-colors hover:text-[#0f172a]'>
							Dashboard
						</Link>
						<button
							type='button'
							onClick={handleLogout}
							className='flex h-9 items-center rounded-lg bg-[#005fb8] px-4 text-sm font-bold text-white transition-colors hover:bg-[#004d96]'>
							Log out
						</button>
					</div>
				) : (
					<div className='hidden items-center gap-3 md:flex'>
						<Link
							href='/login'
							className='text-sm font-semibold text-[#64748b] transition-colors hover:text-[#0f172a]'>
							Log in
						</Link>
						<Link
							href='/register'
							className='flex h-9 items-center rounded-lg bg-[#005fb8] px-4 text-sm font-bold text-white transition-colors hover:bg-[#004d96]'>
							Get started free
						</Link>
					</div>
				)}
				<button
					className='flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] md:hidden'
					onClick={() => setMenuOpen(!menuOpen)}>
					{menuOpen ? (
						<X className='size-4 text-[#64748b]' />
					) : (
						<Menu className='size-4 text-[#64748b]' />
					)}
				</button>
			</div>
			{menuOpen && (
				<div className='border-t border-[#e2e8f0] bg-white px-6 py-4 md:hidden'>
					<nav className='flex flex-col gap-4'>
						{[
							['Features', '#features'],
							['How it works', '#how-it-works'],
							['Compliance', '#compliance'],
							['Pricing', '/pricing'],
						].map(([label, href]) => (
							<Link
								key={label}
								href={href}
								onClick={() => setMenuOpen(false)}
								className='text-sm font-medium text-[#64748b]'>
								{label}
							</Link>
						))}
						<div className='flex flex-col gap-2 pt-2'>
							<Link
								href='/login'
								className='flex h-10 items-center justify-center rounded-lg border border-[#e2e8f0] text-sm font-semibold text-[#64748b]'>
								Log in
							</Link>
							<Link
								href='/register'
								className='flex h-10 items-center justify-center rounded-lg bg-[#005fb8] text-sm font-bold text-white'>
								Get started free
							</Link>
						</div>
					</nav>
				</div>
			)}
		</header>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   Hero
───────────────────────────────────────────────────────────────────────── */

function Hero() {
	return (
		<section className='relative overflow-hidden bg-white px-6 pb-0 pt-12'>
			<div
				className='pointer-events-none absolute inset-x-0 top-0 h-[500px]'
				style={{
					background:
						'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(0,95,184,0.065) 0%, transparent 65%)',
				}}
			/>

			<div className='relative mx-auto max-w-6xl'>
				{/* Live badge */}
				<div className='anim-fade0 mb-7 flex items-center gap-3'>
					<div className='flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-3.5 py-1.5 shadow-sm'>
						<span
							className='h-1.5 w-1.5 rounded-full bg-[#10b981]'
							style={{ boxShadow: '0 0 0 3px rgba(16,185,129,0.2)' }}
						/>
						<span className='text-[12px] font-semibold text-[#1e293b]'>
							Trusted by 340+ agencies across the UK
						</span>
					</div>
				</div>

				{/* Headline — clean, no underline */}
				<div className='anim-fade1 max-w-[750px]'>
					<h1 className='font-heading text-[60px] font-black leading-[1.03] tracking-[-0.03em] text-[#0a1628] lg:text-[76px]'>
						The care platform built for compliance.
					</h1>
				</div>

				<div className='anim-fade2 mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
					<p className='max-w-[500px] text-[17px] leading-[1.7] text-[#64748b]'>
						Good Care Pro gives domiciliary care agencies digital care plans,
						intelligent rota scheduling, and a complete audit trail — so every
						CQC inspection goes smoothly.
					</p>
					<div className='flex shrink-0 flex-col gap-3 sm:flex-row'>
						<Link
							href='/register'
							className='anim-cta anim-pulse flex h-11 items-center gap-2 rounded-xl px-7 text-[14px] font-bold text-white'>
							Start free trial
							<ArrowRight className='size-4' />
						</Link>
						<Link
							href='#features'
							className='flex h-11 items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-7 text-[14px] font-semibold text-[#1e293b] transition-all hover:border-[#005fb8]/30 hover:bg-[#f8fafc]'>
							See the platform
						</Link>
					</div>
				</div>

				{/* Trust bar */}
				<div className='anim-fade3 mt-5 flex flex-wrap items-center gap-x-5 gap-y-2'>
					{[
						'No credit card required',
						'14-day free trial',
						'CQC-ready from day one',
						'Cancel anytime',
					].map((t, i) => (
						<span
							key={t}
							className='flex items-center gap-1.5 text-[12px] text-[#94a3b8]'>
							{i > 0 && <span className='h-1 w-1 rounded-full bg-[#e2e8f0]' />}
							{t}
						</span>
					))}
				</div>

				{/* Floating dashboard */}
				<div className='anim-fade4 relative mt-12 pb-0'>
					<div className='anim-float relative'>
						<div
							className='pointer-events-none absolute -inset-x-8 bottom-[-28px] top-[38%] rounded-[40px]'
							style={{
								background:
									'radial-gradient(ellipse 65% 55% at 50% 100%, rgba(0,95,184,0.10) 0%, transparent 70%)',
							}}
						/>
						<BrowserFrame>
							<DashboardMockup />
						</BrowserFrame>

						{/* Floating chips */}
						<div className='absolute -left-6 top-[28%] hidden rounded-xl border border-[#e2e8f0] bg-white/96 p-3 shadow-[0_8px_28px_rgba(0,0,0,0.09)] backdrop-blur-sm lg:block'>
							<div className='flex items-center gap-2.5'>
								<div className='flex h-9 w-9 items-center justify-center rounded-lg bg-[#dcfce7]'>
									<CheckCircle2 className='size-4 text-[#16a34a]' />
								</div>
								<div>
									<p className='text-[11px] font-bold text-[#0f172a]'>
										CQC Audit Ready
									</p>
									<p className='text-[10px] text-[#64748b]'>
										Full trail on every action
									</p>
								</div>
							</div>
						</div>
						<div className='absolute -right-6 top-[18%] hidden rounded-xl border border-[#e2e8f0] bg-white/96 p-3 shadow-[0_8px_28px_rgba(0,0,0,0.09)] backdrop-blur-sm lg:block'>
							<div className='flex items-center gap-2.5'>
								<div className='flex h-9 w-9 items-center justify-center rounded-lg bg-[#eff6ff]'>
									<Users className='size-4 text-[#005fb8]' />
								</div>
								<div>
									<p className='text-[11px] font-bold text-[#0f172a]'>
										1,200+ Carers
									</p>
									<p className='text-[10px] text-[#64748b]'>Managed daily</p>
								</div>
							</div>
						</div>
						<div className='absolute -right-6 bottom-[18%] hidden rounded-xl border border-[#e2e8f0] bg-white/96 p-3 shadow-[0_8px_28px_rgba(0,0,0,0.09)] backdrop-blur-sm lg:block'>
							<div className='flex items-center gap-2.5'>
								<div className='flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff7ed]'>
									<Activity className='size-4 text-[#ea580c]' />
								</div>
								<div>
									<p className='text-[11px] font-bold text-[#0f172a]'>
										98.7% Uptime
									</p>
									<p className='text-[10px] text-[#64748b]'>Enterprise SLA</p>
								</div>
							</div>
						</div>
					</div>
					<div className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white' />
				</div>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   Stats ticker
───────────────────────────────────────────────────────────────────────── */

function StatsTicker() {
	const stats = [
		{ value: '340+', label: 'Care agencies' },
		{ value: '12,000+', label: 'Active patients' },
		{ value: '1,200+', label: 'Carers managed' },
		{ value: '98.7%', label: 'Platform uptime' },
		{ value: '4.9 / 5', label: 'Customer rating' },
		{ value: '0', label: 'Failed CQC inspections' },
	];
	return (
		<section className='relative overflow-hidden border-y border-[#e2e8f0] bg-[#f8fafc]'>
			<div className='pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#f8fafc] to-transparent' />
			<div className='pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#f8fafc] to-transparent' />
			<div className='flex overflow-hidden py-4'>
				<div className='anim-marquee flex shrink-0 items-center'>
					{[...stats, ...stats].map((s, i) => (
						<div key={i} className='flex shrink-0 items-center gap-6 px-8'>
							<div className='flex items-baseline gap-2'>
								<span className='font-heading text-[20px] font-black text-[#0a1628]'>
									{s.value}
								</span>
								<span className='text-[12px] text-[#64748b]'>{s.label}</span>
							</div>
							<div className='h-4 w-px bg-[#e2e8f0]' />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   Bento Features
───────────────────────────────────────────────────────────────────────── */

function BentoFeatures() {
	const features = [
		{
			icon: CalendarDays,
			name: 'Rota & Scheduling',
			desc: 'Drag-and-drop weekly rota with conflict detection and live carer availability.',
		},
		{
			icon: ClipboardList,
			name: 'Digital Care Plans',
			desc: 'Versioned, person-centred plans with medication schedules and task tracking.',
		},
		{
			icon: Users,
			name: 'Staff Management',
			desc: 'DBS tracking, qualifications, role-based access, and team invitations.',
		},
		{
			icon: Shield,
			name: 'CQC Audit Trail',
			desc: 'Every action timestamped and immutable. Zero failed inspections across all customers.',
		},
		{
			icon: FileText,
			name: 'Incident Reporting',
			desc: 'Log, triage, and resolve incidents with a full audit-ready paper trail.',
		},
		{
			icon: Activity,
			name: 'Real-time Dashboard',
			desc: 'Live visibility of visits, compliance scores, and carer status across your agency.',
		},
	];

	return (
		<section id='features' className='overflow-hidden bg-white py-24 sm:py-32'>
			<div className='mx-auto max-w-6xl px-6 lg:px-8'>
				<div className='mx-auto grid max-w-2xl grid-cols-1 gap-x-16 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-center'>
					{/* ── Left: text ── */}
					<div className='lg:py-4 lg:pr-8'>
						<div className='lg:max-w-lg'>
							<p className='text-[11px] font-bold uppercase tracking-[0.22em] text-[#005fb8]'>
								Platform
							</p>
							<h2 className='font-heading mt-3 text-[40px] font-black leading-[1.06] tracking-tight text-[#0a1628] sm:text-[44px]'>
								Everything in one place.{' '}
								<span className='font-medium text-[#64748b]'>
									Nothing missed.
								</span>
							</h2>
							<p className='mt-5 text-[15px] leading-relaxed text-[#64748b]'>
								From first assessment to CQC inspection — Good Care Pro covers
								every part of the care cycle with tools built specifically for
								UK domiciliary agencies.
							</p>
							<dl className='mt-9 max-w-xl space-y-6 lg:max-w-none'>
								{features.map(({ icon: Icon, name, desc }) => (
									<div key={name} className='relative pl-10'>
										<dt className='text-[14px] font-bold leading-relaxed text-[#0a1628]'>
											<div className='absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-[#eff6ff]'>
												<Icon className='size-3.5 text-[#005fb8]' aria-hidden />
											</div>
											{name}.{' '}
										</dt>
										<dd className='inline text-[14px] leading-relaxed text-[#64748b]'>
											{desc}
										</dd>
									</div>
								))}
							</dl>
						</div>
					</div>

					{/* ── Right: screenshot ── */}
					<div className='relative lg:-mr-8'>
						{/* Decorative backdrop */}
						<div className='pointer-events-none absolute -inset-x-4 -bottom-8 -top-6 rounded-3xl bg-[#f0f6ff]' />
						{/* Frame */}
						<div className='relative overflow-hidden rounded-2xl bg-white shadow-[0_20px_56px_-4px_rgba(0,95,184,0.16)] ring-1 ring-[#dde8f5]'>
							{/* Browser chrome */}
							<div className='flex items-center gap-1.5 border-b border-[#e6eef8] bg-[#f4f8fd] px-4 py-2.5'>
								<span className='h-2.5 w-2.5 rounded-full bg-[#ff5f57]' />
								<span className='h-2.5 w-2.5 rounded-full bg-[#febc2e]' />
								<span className='h-2.5 w-2.5 rounded-full bg-[#28c840]' />
								<div className='mx-auto flex h-5 w-52 items-center justify-center gap-1.5 rounded bg-white px-3 ring-1 ring-[#dce6f2]'>
									<Lock className='size-2.5 shrink-0 text-[#94a3b8]' />
									<span className='text-[9px] text-[#94a3b8]'>
										goodcarepro.co.uk/dashboard
									</span>
								</div>
							</div>
							{/* Dashboard SVG — intrinsic sizing via viewBox aspect ratio */}
							<div className='aspect-[900/510] w-full'>
								<DashboardMockup />
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   Rota spotlight
───────────────────────────────────────────────────────────────────────── */

function RotaSpotlight() {
	return (
		<section id='how-it-works' className='bg-[#f8fafc] px-6 py-20'>
			<div className='mx-auto max-w-6xl'>
				<div className='mb-10 flex items-center gap-3'>
					<span className='font-heading text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8]'>
						01
					</span>
					<div className='h-px flex-1 bg-[#e2e8f0]' />
					<span className='text-[11px] font-bold uppercase tracking-widest text-[#005fb8]'>
						Rota management
					</span>
				</div>
				<div className='flex flex-col items-center gap-14 lg:flex-row lg:gap-16'>
					<div className='flex-1'>
						<h2 className='font-heading text-[38px] font-black leading-[1.08] tracking-tight text-[#0a1628]'>
							Schedule 40+ carers
							<br />
							<span className='font-medium text-[#64748b]'>
								without the chaos.
							</span>
						</h2>
						<p className='mt-5 text-[16px] leading-relaxed text-[#64748b]'>
							Build weekly schedules that work for your whole team. Assign
							visits, manage last-minute changes, detect conflicts
							automatically, and view everything on one screen.
						</p>
						<ul className='mt-7 flex flex-col gap-3'>
							{[
								'Drag-and-drop visit scheduling',
								'Real-time carer availability',
								'Automated conflict detection',
								'Travel time estimation between visits',
								'SMS & push notification reminders',
							].map((p) => (
								<li key={p} className='flex items-center gap-3'>
									<span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dcfce7]'>
										<Check className='size-3 stroke-[3] text-[#16a34a]' />
									</span>
									<span className='text-[14px] text-[#1e293b]'>{p}</span>
								</li>
							))}
						</ul>
					</div>
					<div className='w-full flex-1'>
						<BrowserFrame>
							<RotaMockup />
						</BrowserFrame>
					</div>
				</div>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   Care plans spotlight
───────────────────────────────────────────────────────────────────────── */

function CarePlansSpotlight() {
	return (
		<section className='bg-white px-6 py-20'>
			<div className='mx-auto max-w-6xl'>
				<div className='mb-10 flex items-center gap-3'>
					<span className='font-heading text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8]'>
						02
					</span>
					<div className='h-px flex-1 bg-[#e2e8f0]' />
					<span className='text-[11px] font-bold uppercase tracking-widest text-[#005fb8]'>
						Care plans
					</span>
				</div>
				<div className='flex flex-col items-center gap-14 lg:flex-row-reverse lg:gap-16'>
					<div className='flex-1'>
						<h2 className='font-heading text-[38px] font-black leading-[1.08] tracking-tight text-[#0a1628]'>
							Person-centred plans
							<br />
							<span className='font-medium text-[#64748b]'>
								that evolve with the patient.
							</span>
						</h2>
						<p className='mt-5 text-[16px] leading-relaxed text-[#64748b]'>
							Build rich, versioned care plans with diagnoses, medication
							schedules, daily tasks, vitals tracking, and carer notes — all in
							structured, auditable records.
						</p>
						<ul className='mt-7 flex flex-col gap-3'>
							{[
								'Full diagnosis and medical history',
								'Medication with adherence tracking',
								'Daily task checklists per visit',
								'Vitals recording per carer visit',
								'Complete version history for CQC',
							].map((p) => (
								<li key={p} className='flex items-center gap-3'>
									<span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dcfce7]'>
										<Check className='size-3 stroke-[3] text-[#16a34a]' />
									</span>
									<span className='text-[14px] text-[#1e293b]'>{p}</span>
								</li>
							))}
						</ul>
					</div>
					<div className='w-full flex-1'>
						<BrowserFrame>
							<CarePlanMockup />
						</BrowserFrame>
					</div>
				</div>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   Compliance
───────────────────────────────────────────────────────────────────────── */

function Compliance() {
	return (
		<section
			id='compliance'
			className='relative overflow-hidden px-6 py-20'
			style={{
				background:
					'linear-gradient(160deg, #0a1628 0%, #0d2040 55%, #0a1628 100%)',
			}}>
			<div
				className='pointer-events-none absolute inset-0'
				style={{
					backgroundImage:
						'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)',
					backgroundSize: '28px 28px',
				}}
			/>
			<div
				className='pointer-events-none absolute inset-x-0 top-0 h-px'
				style={{
					background:
						'linear-gradient(90deg, transparent, rgba(0,95,184,0.5), transparent)',
				}}
			/>

			<div className='relative mx-auto max-w-6xl'>
				<div className='mb-10 flex items-center gap-3'>
					<span className='font-heading text-[11px] font-black uppercase tracking-[0.2em] text-white/25'>
						03
					</span>
					<div className='h-px flex-1 bg-white/10' />
					<span className='text-[11px] font-bold uppercase tracking-widest text-[#60a5fa]'>
						Compliance
					</span>
				</div>
				<div className='flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between'>
					<div className='max-w-[500px]'>
						<h2 className='font-heading text-[40px] font-black leading-[1.06] tracking-tight text-white'>
							Built for CQC.
							<br />
							Built for trust.
						</h2>
						<p className='mt-5 text-[16px] leading-relaxed text-white/55'>
							Compliance isn&apos;t a feature you bolt on — it&apos;s the
							foundation everything is built on.
						</p>
					</div>
					<div className='flex flex-wrap gap-2'>
						{[
							'CQC Ready',
							'UK GDPR',
							'AES-256 Encrypted',
							'NHS DSP Toolkit',
							'ISO 27001',
						].map((b) => (
							<span
								key={b}
								className='rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[12px] font-semibold text-white/60'>
								{b}
							</span>
						))}
					</div>
				</div>
				<div
					className='mt-12 grid grid-cols-1 gap-px bg-white/[0.05] sm:grid-cols-2 lg:grid-cols-4'
					style={{ borderRadius: '14px', overflow: 'hidden' }}>
					{[
						{
							title: 'CQC Inspection Ready',
							body: "Structured data and audit logs mean you're prepared for any inspection — not just the ones you know about.",
							icon: Shield,
						},
						{
							title: 'UK GDPR Compliant',
							body: 'All patient data stored within the UK. Role-based access ensures carers only see what they need to.',
							icon: Lock,
						},
						{
							title: 'End-to-End Encryption',
							body: 'All data in transit and at rest is AES-256 encrypted. Automatic backups every 6 hours.',
							icon: CheckCircle2,
						},
						{
							title: 'Digital MAR Sheets',
							body: 'Medication records auto-generated from care plans. Missed doses flagged in real time to managers.',
							icon: FileText,
						},
					].map((item) => (
						<div
							key={item.title}
							className='bg-white/[0.03] p-6 transition-colors hover:bg-white/[0.06]'>
							<div className='mb-3.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10'>
								<item.icon className='size-3.5 text-white' />
							</div>
							<h3 className='mb-1.5 text-[13px] font-bold text-white'>
								{item.title}
							</h3>
							<p className='text-[11px] leading-relaxed text-white/45'>
								{item.body}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   Testimonials
───────────────────────────────────────────────────────────────────────── */

function Testimonials() {
	return (
		<section className='bg-white px-6 py-20'>
			<div className='mx-auto max-w-6xl'>
				<p className='mb-14 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#94a3b8]'>
					What agencies say
				</p>
				<div className='relative mb-14 pb-14'>
					<div
						className='pointer-events-none absolute left-0 top-[-20px] font-heading text-[160px] font-black leading-none text-[#f1f5f9]'
						aria-hidden>
						&ldquo;
					</div>
					<blockquote className='relative max-w-3xl pl-6'>
						<p className='font-heading text-[30px] font-bold leading-[1.35] text-[#0a1628] lg:text-[36px]'>
							The audit logs alone are worth every penny. Our last CQC
							inspection was the smoothest in eight years.
						</p>
						<footer className='mt-7 flex items-center gap-4'>
							<div className='flex h-11 w-11 items-center justify-center rounded-full bg-[#e7f1fb] text-sm font-bold text-[#005fb8]'>
								PH
							</div>
							<div>
								<p className='font-bold text-[#0a1628]'>Patricia Hughes</p>
								<p className='text-[13px] text-[#64748b]'>
									Registered Manager, Sunrise Care Birmingham
								</p>
							</div>
							<div className='ml-3 hidden gap-0.5 sm:flex'>
								{Array.from({ length: 5 }).map((_, i) => (
									<Star
										key={i}
										className='size-3.5 fill-[#f59e0b] text-[#f59e0b]'
									/>
								))}
							</div>
						</footer>
					</blockquote>
					<div className='absolute bottom-0 left-0 right-0 h-px bg-[#f1f5f9]' />
				</div>
				<div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
					{[
						{
							quote:
								'Switching from spreadsheets was daunting but setup was genuinely easy. The whole team was running in a week.',
							name: 'David Okonkwo',
							role: 'Director, HomeFirst Care Services',
							initials: 'DO',
						},
						{
							quote:
								'Care plans, rota, and incident reports in one place has fundamentally transformed how we operate as an agency.',
							name: 'Alison Mercer',
							role: 'Operations Lead, ClearPath Domiciliary Care',
							initials: 'AM',
						},
					].map((t) => (
						<div
							key={t.name}
							className='rounded-2xl border border-[#f1f5f9] bg-[#f8fafc] p-6 transition-all hover:border-[#e2e8f0] hover:bg-white hover:shadow-[0_3px_16px_rgba(0,0,0,0.05)]'>
							<div className='mb-3.5 flex gap-0.5'>
								{Array.from({ length: 5 }).map((_, i) => (
									<Star
										key={i}
										className='size-3.5 fill-[#f59e0b] text-[#f59e0b]'
									/>
								))}
							</div>
							<p className='text-[15px] leading-relaxed text-[#1e293b]'>
								&ldquo;{t.quote}&rdquo;
							</p>
							<div className='mt-5 flex items-center gap-3 border-t border-[#e2e8f0] pt-4'>
								<div className='flex h-9 w-9 items-center justify-center rounded-full bg-[#e7f1fb] text-xs font-bold text-[#005fb8]'>
									{t.initials}
								</div>
								<div>
									<p className='text-sm font-bold text-[#0a1628]'>{t.name}</p>
									<p className='text-xs text-[#64748b]'>{t.role}</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   Pricing teaser
───────────────────────────────────────────────────────────────────────── */

function PricingTeaser() {
	return (
		<section className='bg-[#f8fafc] px-6 py-20'>
			<div className='mx-auto max-w-6xl'>
				<div className='mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
					<div>
						<p className='mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#005fb8]'>
							Pricing
						</p>
						<h2 className='font-heading text-[38px] font-black leading-tight text-[#0a1628]'>
							Simple, transparent pricing.
						</h2>
					</div>
					<Link
						href='/pricing'
						className='flex items-center gap-1.5 text-sm font-semibold text-[#005fb8] hover:underline'>
						Full pricing & feature comparison{' '}
						<ChevronRight className='size-4' />
					</Link>
				</div>
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
					{[
						{
							name: 'Starter',
							price: '£49',
							per: '/mo',
							desc: 'Up to 20 patients',
							features: ['10 carers', '1 branch', 'Email support'],
							highlight: false,
						},
						{
							name: 'Professional',
							price: '£99',
							per: '/mo',
							desc: 'Up to 100 patients',
							features: ['Unlimited carers', '3 branches', 'Live chat support'],
							highlight: true,
						},
						{
							name: 'Enterprise',
							price: 'Custom',
							per: '',
							desc: 'Unlimited patients',
							features: [
								'Unlimited branches',
								'Phone support',
								'Dedicated account manager',
							],
							highlight: false,
						},
					].map((plan) => (
						<div
							key={plan.name}
							className={cn(
								'relative flex flex-col rounded-2xl p-6 transition-all',
								plan.highlight
									? 'bg-[#005fb8] shadow-[0_12px_36px_rgba(0,95,184,0.24)]'
									: 'border border-[#e2e8f0] bg-white hover:shadow-[0_3px_16px_rgba(0,0,0,0.06)]',
							)}>
							{plan.highlight && (
								<span className='mb-3 self-start rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white'>
									Most popular
								</span>
							)}
							<p
								className={cn(
									'font-heading text-[17px] font-bold',
									plan.highlight ? 'text-white' : 'text-[#0a1628]',
								)}>
								{plan.name}
							</p>
							<div className='mt-2.5 flex items-end gap-1'>
								<span
									className={cn(
										'font-heading text-[38px] font-black leading-none',
										plan.highlight ? 'text-white' : 'text-[#0a1628]',
									)}>
									{plan.price}
								</span>
								{plan.per && (
									<span
										className={cn(
											'mb-1 text-[12px]',
											plan.highlight ? 'text-white/60' : 'text-[#94a3b8]',
										)}>
										{plan.per}
									</span>
								)}
							</div>
							<p
								className={cn(
									'mt-1 text-[12px]',
									plan.highlight ? 'text-white/65' : 'text-[#64748b]',
								)}>
								{plan.desc}
							</p>
							<ul className='mt-4 flex flex-col gap-2'>
								{plan.features.map((f) => (
									<li key={f} className='flex items-center gap-2'>
										<Check
											className={cn(
												'size-3 shrink-0',
												plan.highlight ? 'text-white/65' : 'text-[#10b981]',
											)}
										/>
										<span
											className={cn(
												'text-[12px]',
												plan.highlight ? 'text-white/80' : 'text-[#1e293b]',
											)}>
											{f}
										</span>
									</li>
								))}
							</ul>
							<Link
								href={
									plan.name === 'Enterprise'
										? 'mailto:sales@goodcarepro.co.uk'
										: '/register'
								}
								className={cn(
									'mt-5 flex h-10 items-center justify-center rounded-xl text-[13px] font-bold transition-all',
									plan.highlight
										? 'bg-white text-[#005fb8] hover:bg-white/90'
										: 'border border-[#e2e8f0] text-[#1e293b] hover:bg-[#f8fafc]',
								)}>
								{plan.name === 'Enterprise'
									? 'Contact sales'
									: 'Start free trial'}
							</Link>
						</div>
					))}
				</div>
				<p className='mt-6 text-center text-[12px] text-[#94a3b8]'>
					All plans include a 14-day free trial. No credit card required.
				</p>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   CTA
───────────────────────────────────────────────────────────────────────── */

function CTA() {
	return (
		<section
			className='relative overflow-hidden px-6 py-24'
			style={{ background: '#0a1628' }}>
			<div
				className='pointer-events-none absolute inset-0'
				style={{
					backgroundImage:
						'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.028) 1px, transparent 0)',
					backgroundSize: '30px 30px',
				}}
			/>
			<div
				className='pointer-events-none absolute left-1/2 top-0 h-[360px] w-[560px] -translate-x-1/2 -translate-y-1/2'
				style={{
					background:
						'radial-gradient(circle, rgba(0,95,184,0.22) 0%, transparent 65%)',
				}}
			/>
			<div className='relative mx-auto max-w-2xl text-center'>
				<p className='mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#60a5fa]'>
					Get started today
				</p>
				<h2 className='font-heading text-[46px] font-black leading-[1.06] tracking-tight text-white'>
					Ready to run a better agency?
				</h2>
				<p className='mx-auto mt-5 max-w-[440px] text-[16px] leading-relaxed text-white/55'>
					Join 340+ care agencies who trust Good Care Pro to manage their
					operations, patients, and compliance every day.
				</p>
				<div className='mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row'>
					<Link
						href='/register'
						className='anim-cta anim-pulse flex h-12 items-center gap-2 rounded-xl px-7 text-[14px] font-bold text-white'>
						Start your free trial
						<ArrowRight className='size-4' />
					</Link>
					<Link
						href='/login'
						className='flex h-12 items-center rounded-xl border border-white/10 px-7 text-[14px] font-semibold text-white/65 transition-colors hover:border-white/20 hover:text-white'>
						I already have an account
					</Link>
				</div>
				<p className='mt-5 text-[12px] text-white/35'>
					14-day free trial · No credit card · Cancel anytime
				</p>
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   Footer
───────────────────────────────────────────────────────────────────────── */

function Footer() {
	return (
		<footer className='border-t border-[#e2e8f0] bg-white px-6 py-12'>
			<div className='mx-auto max-w-6xl'>
				<div className='flex flex-col items-start justify-between gap-10 lg:flex-row'>
					<div className='flex flex-col gap-4'>
						<Image
							src='/logo.svg'
							alt='Good Care Pro'
							width={128}
							height={26}
						/>
						<p className='max-w-[220px] text-[13px] leading-relaxed text-[#64748b]'>
							Compliant, audit-ready care management for UK domiciliary care
							agencies.
						</p>
						<div className='flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 w-fit'>
							<Shield className='size-3 text-[#005fb8]' />
							<span className='text-[10px] font-semibold text-[#64748b]'>
								ISO 27001 · CQC Ready · UK GDPR
							</span>
						</div>
					</div>
					<div className='grid grid-cols-2 gap-x-14 gap-y-8 sm:grid-cols-3'>
						{[
							{
								heading: 'Product',
								links: ['Features', 'Pricing', 'Compliance', 'Roadmap'],
							},
							{
								heading: 'Company',
								links: ['About', 'Blog', 'Careers', 'Contact'],
							},
							{
								heading: 'Legal',
								links: [
									'Privacy Policy',
									'Terms of Service',
									'Cookie Policy',
									'GDPR',
								],
							},
						].map((col) => (
							<div key={col.heading}>
								<p className='mb-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#94a3b8]'>
									{col.heading}
								</p>
								{col.links.map((l) => (
									<Link
										key={l}
										href='#'
										className='mb-2.5 block text-[13px] text-[#64748b] transition-colors hover:text-[#0f172a]'>
										{l}
									</Link>
								))}
							</div>
						))}
					</div>
				</div>
				<div className='mt-10 flex items-center justify-between border-t border-[#e2e8f0] pt-6'>
					<p className='text-[11px] text-[#94a3b8]'>
						&copy; 2026 Good Care Pro Ltd. All rights reserved.
					</p>
					<p className='hidden text-[11px] text-[#94a3b8] sm:block'>
						Made with care in the United Kingdom 🇬🇧
					</p>
				</div>
			</div>
		</footer>
	);
}

/* ─────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────── */

export default function HomePage() {
	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: ANIMATIONS }} />
			<div id='page-scroll' className='fixed inset-0 overflow-y-auto bg-white'>
				<Nav />
				<Hero />
				<StatsTicker />
				<BentoFeatures />
				<RotaSpotlight />
				<CarePlansSpotlight />
				<Compliance />
				<Testimonials />
				<PricingTeaser />
				<CTA />
				<Footer />
			</div>
		</>
	);
}
