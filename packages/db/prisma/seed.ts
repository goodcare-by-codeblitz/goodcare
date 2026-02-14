import { prisma } from '../src/index';

const roles = [
    { name: 'SuperAdmin', scope: 'PLATFORM' as const },
    { name: 'SystemAdmin', scope: 'PLATFORM' as const },
    { name: 'Moderator', scope: 'PLATFORM' as const },
    { name: 'Viewer', scope: 'PLATFORM' as const },
	{ name: 'Admin', scope: 'ORGANIZATION' as const },
	{ name: 'Manager', scope: 'ORGANIZATION' as const },
	{ name: 'Caregiver', scope: 'ORGANIZATION' as const },
	{ name: 'Viewer', scope: 'ORGANIZATION' as const },
];

const permissions = [
	// User management
	{ key: 'manage_users', description: 'Create, update, and deactivate users' },
	{ key: 'view_users', description: 'View user profiles and details' },

	// Organization management
	{ key: 'manage_organization', description: 'Update organization settings and details' },
	{ key: 'manage_members', description: 'Invite, remove, and manage organization members' },

	// Role & permission management
	{ key: 'manage_roles', description: 'Create, update, and assign roles' },
	{ key: 'view_roles', description: 'View roles and permissions' },

	// Patient management
	{ key: 'manage_patients', description: 'Create, update, and manage patient records' },
	{ key: 'view_patients', description: 'View patient profiles and details' },

	// Visit management
	{ key: 'manage_visits', description: 'Schedule, update, and cancel visits' },
	{ key: 'view_visits', description: 'View visit schedules and details' },
	{ key: 'assign_visits', description: 'Assign and unassign carers to visits' },

	// Care plan management
	{ key: 'manage_care_plans', description: 'Create, update, and archive care plans' },
	{ key: 'view_care_plans', description: 'View care plans and goals' },

	// Daily notes
	{ key: 'manage_daily_notes', description: 'Create and edit daily notes during visits' },
	{ key: 'view_daily_notes', description: 'View daily notes and observations' },

	// Incident reports
	{ key: 'manage_incidents', description: 'Create, investigate, and resolve incident reports' },
	{ key: 'view_incidents', description: 'View incident reports and history' },

	// Carer & qualifications
	{ key: 'manage_carers', description: 'Manage carer profiles and employment details' },
	{ key: 'manage_qualifications', description: 'Upload and verify carer qualifications' },
	{ key: 'view_qualifications', description: 'View carer qualifications and certifications' },

	// Audit & analytics
	{ key: 'view_audit_logs', description: 'View audit logs and system activity' },
	{ key: 'view_analytics', description: 'View reports and analytics dashboards' },

	// Settings
	{ key: 'manage_settings', description: 'Manage platform and organization settings' },
];

async function main() {
	for (const role of roles) {
		await prisma.role.upsert({
			where: {
				scope_name: { scope: role.scope, name: role.name },
			},
            update: {
                name: role.name,
                scope: role.scope,
            },
			create: {
				name: role.name,
				scope: role.scope,
            },
		});
		console.log(`Upserted role: ${role.name} (${role.scope})`);
	}

	for (const perm of permissions) {
		await prisma.permission.upsert({
			where: { key: perm.key },
			update: { description: perm.description },
			create: { key: perm.key, description: perm.description },
		});
		console.log(`Upserted permission: ${perm.key}`);
	}

	// Role-Permission mappings
	const rolePermissions: Record<string, string[]> = {
		// SuperAdmin manages the platform, not org-level confidential data
		SuperAdmin: [
			'manage_users',
			'view_users',
			'manage_organization',
			'manage_members',
			'manage_roles',
			'view_roles',
			'view_audit_logs',
			'view_analytics',
			'manage_settings',
		],

		// SystemAdmin similar to SuperAdmin but no settings
		SystemAdmin: [
			'manage_users',
			'view_users',
			'manage_organization',
			'manage_members',
			'manage_roles',
			'view_roles',
			'view_audit_logs',
			'view_analytics',
		],

		// Platform Moderator
		'PLATFORM:Moderator': [
			'view_users',
			'view_roles',
			'view_patients',
			'view_visits',
			'view_care_plans',
			'view_daily_notes',
			'manage_incidents',
			'view_incidents',
			'view_audit_logs',
			'view_analytics',
		],

		// Platform Viewer
		'PLATFORM:Viewer': [
			'view_users',
			'view_roles',
			'view_patients',
			'view_visits',
			'view_care_plans',
			'view_daily_notes',
			'view_incidents',
			'view_qualifications',
			'view_analytics',
		],

		// Org Admin gets all org-level permissions
		Admin: [
			'manage_users',
			'view_users',
			'manage_organization',
			'manage_members',
			'manage_roles',
			'view_roles',
			'manage_patients',
			'view_patients',
			'manage_visits',
			'view_visits',
			'assign_visits',
			'manage_care_plans',
			'view_care_plans',
			'manage_daily_notes',
			'view_daily_notes',
			'manage_incidents',
			'view_incidents',
			'manage_carers',
			'manage_qualifications',
			'view_qualifications',
			'view_audit_logs',
			'view_analytics',
			'manage_settings',
		],

		// Manager
		Manager: [
			'view_users',
			'manage_members',
			'view_roles',
			'manage_patients',
			'view_patients',
			'manage_visits',
			'view_visits',
			'assign_visits',
			'manage_care_plans',
			'view_care_plans',
			'view_daily_notes',
			'manage_incidents',
			'view_incidents',
			'manage_carers',
			'manage_qualifications',
			'view_qualifications',
			'view_analytics',
		],

		// Caregiver
		Caregiver: [
			'view_patients',
			'view_visits',
			'view_care_plans',
			'manage_daily_notes',
			'view_daily_notes',
			'manage_incidents',
			'view_incidents',
			'view_qualifications',
		],

		// Org Viewer
		'ORGANIZATION:Viewer': [
			'view_users',
			'view_patients',
			'view_visits',
			'view_care_plans',
			'view_daily_notes',
			'view_incidents',
			'view_qualifications',
		],
	};

	for (const [roleKey, permKeys] of Object.entries(rolePermissions)) {
		// Resolve role: "SCOPE:Name" or just "Name"
		let roleName: string;
		let roleScope: 'PLATFORM' | 'ORGANIZATION' | undefined;

		if (roleKey.includes(':')) {
			const [scope, name] = roleKey.split(':');
			roleScope = scope as 'PLATFORM' | 'ORGANIZATION';
			roleName = name!;
		} else {
			roleName = roleKey;
		}

		const role = await prisma.role.findFirst({
			where: {
				name: roleName,
				...(roleScope ? { scope: roleScope } : {}),
			},
		});

		if (!role) {
			console.warn(`Role not found: ${roleKey}, skipping`);
			continue;
		}

		for (const permKey of permKeys) {
			const permission = await prisma.permission.findUnique({
				where: { key: permKey },
			});

			if (!permission) {
				console.warn(`Permission not found: ${permKey}, skipping`);
				continue;
			}

			await prisma.rolePermission.upsert({
				where: {
					roleId_permissionId: {
						roleId: role.id,
						permissionId: permission.id,
					},
				},
				update: {},
				create: {
					roleId: role.id,
					permissionId: permission.id,
				},
			});
		}

		console.log(`Assigned ${permKeys.length} permissions to ${roleKey}`);
	}
}

main()
	.then(() => {
		console.log('Seeding complete');
	})
	.catch((e) => {
		console.error('Seeding failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});