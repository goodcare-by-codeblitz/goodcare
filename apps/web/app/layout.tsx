import { AuthSync } from '@/components/auth/auth-sync';
import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin'],
});

const manrope = Manrope({
	variable: '--font-manrope',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Good Care Pro',
	description:
		'Compliant, audit-ready care management for domiciliary care companies.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<head>
				<link rel='icon' href='/favicon.ico' />
			</head>
			<body
				className={`${inter.variable} ${manrope.variable} antialiased overflow-hidden`}>
				<AuthSync />
				{children}
			</body>
		</html>
	);
}
