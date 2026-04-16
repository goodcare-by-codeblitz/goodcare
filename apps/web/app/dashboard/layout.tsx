import { DashboardOrgGuard } from '@/components/auth/dashboard-org-guard';
import DashboardFooter from '@/components/dashboard/footer';
import { Header } from '@/components/dashboard/header';
import { Sidebar } from '@/components/dashboard/sidebar';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className='flex h-screen flex-col overflow-hidden'>
			<Header />
			<div className='flex min-h-0 flex-1 overflow-hidden'>
				<Sidebar />
				<main className='flex-1 overflow-y-auto bg-muted'>
					<DashboardOrgGuard>
						{children}
						<DashboardFooter />
					</DashboardOrgGuard>
				</main>
			</div>
		</div>
	);
}
