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
				{/* Figma capture — remove after design export */}
				<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
			</head>
			<body
				className={`${inter.variable} ${manrope.variable} antialiased overflow-hidden`}>
				{children}
			</body>
		</html>
	);
}
