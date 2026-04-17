import { prisma } from '@repo/db';
import { NotFoundError } from '../../lib/errors';
import type { CarePlanListQuery, CreateCarePlanBody, UpdateCarePlanBody } from './care-plan.types';

const db = prisma as any;

type CarePlanRecord = {
	id: string;
	version: number;
	summary: string;
	status: string;
	patientId: string;
	organizationId: string;
	createdById: string;
	createdAt: Date;
	updatedAt: Date;
};

type CarePlanDetail = CarePlanRecord & {
	patient: { id: string; firstName: string; lastName: string };
	createdBy: { firstName: string; lastName: string; email: string };
	conditions: Array<{
		id: string;
		name: string;
		diagnosedYear: number | null;
		description: string | null;
		patientImpact: string | null;
		carerNotes: string | null;
	}>;
	risks: Array<{
		id: string;
		label: string;
		level: string;
		notes: string;
		reviewDate: Date | null;
	}>;
	tasks: Array<{
		id: string;
		label: string;
		visitType: string;
		required: boolean;
		notes: string | null;
	}>;
	goals: Array<{
		id: string;
		description: string;
		category: string;
		targetDate: Date | null;
		status: string;
		notes: string | null;
	}>;
};

function detailSelect() {
	return {
		id: true,
		version: true,
		goals: true,
		status: true,
		patientId: true,
		organizationId: true,
		createdById: true,
		createdAt: true,
		updatedAt: true,
		patient: { select: { id: true, firstName: true, lastName: true } },
		createdBy: { select: { firstName: true, lastName: true, email: true } },
		conditions: {
			select: {
				id: true,
				name: true,
				diagnosedYear: true,
				description: true,
				patientImpact: true,
				carerNotes: true,
			},
			orderBy: { createdAt: 'asc' as const },
		},
		risks: {
			select: {
				id: true,
				label: true,
				level: true,
				notes: true,
				reviewDate: true,
			},
			orderBy: { createdAt: 'asc' as const },
		},
		tasks: {
			select: {
				id: true,
				label: true,
				visitType: true,
				required: true,
				notes: true,
			},
			orderBy: { createdAt: 'asc' as const },
		},
		goalItems: {
			select: {
				id: true,
				description: true,
				category: true,
				targetDate: true,
				status: true,
				notes: true,
			},
			orderBy: { createdAt: 'asc' as const },
		},
	};
}

function mapCarePlanDetail(
	carePlan: any,
): CarePlanDetail {
	const resolved = carePlan as {
		goalItems: CarePlanDetail['goals'];
	} & CarePlanDetail & { goals: string };

	return {
		id: resolved.id,
		version: resolved.version,
		summary: resolved.goals,
		status: resolved.status,
		patientId: resolved.patientId,
		organizationId: resolved.organizationId,
		createdById: resolved.createdById,
		createdAt: resolved.createdAt,
		updatedAt: resolved.updatedAt,
		patient: resolved.patient,
		createdBy: resolved.createdBy,
		conditions: resolved.conditions,
		risks: resolved.risks,
		tasks: resolved.tasks,
		goals: resolved.goalItems,
	};
}

export async function createCarePlanService(
	organizationId: string, createdById: string, input: CreateCarePlanBody,
): Promise<CarePlanDetail> {
	const latestVersion = await prisma.carePlan.findFirst({
		where: { patientId: input.patientId, organizationId, deletedAt: null },
		orderBy: { version: 'desc' },
		select: { version: true },
	});
	const carePlan = await prisma.$transaction(async (tx) => {
		const txDb = tx as any;
		const created = await txDb.carePlan.create({
			data: {
				organizationId,
				patientId: input.patientId,
				createdById,
				goals: input.summary,
				status: input.status ?? 'DRAFT',
				version: (latestVersion?.version ?? 0) + 1,
			},
			select: { id: true },
		});

		if (input.conditions?.length) {
			await txDb.carePlanCondition.createMany({
				data: input.conditions.map((condition) => ({
					carePlanId: created.id,
					organizationId,
					name: condition.name,
					diagnosedYear: condition.diagnosedYear ?? null,
					description: condition.description ?? null,
					patientImpact: condition.patientImpact ?? null,
					carerNotes: condition.carerNotes ?? null,
				})),
			});
		}

		if (input.risks?.length) {
			await txDb.carePlanRisk.createMany({
				data: input.risks.map((risk) => ({
					carePlanId: created.id,
					organizationId,
					label: risk.label,
					level: risk.level ?? 'MEDIUM',
					notes: risk.notes,
					reviewDate: risk.reviewDate ? new Date(risk.reviewDate) : null,
				})),
			});
		}

		if (input.tasks?.length) {
			await txDb.carePlanTask.createMany({
				data: input.tasks.map((task) => ({
					carePlanId: created.id,
					organizationId,
					label: task.label,
					visitType: task.visitType,
					required: task.required ?? true,
					notes: task.notes ?? null,
				})),
			});
		}

		if (input.goals?.length) {
			await txDb.carePlanGoal.createMany({
				data: input.goals.map((goal) => ({
					carePlanId: created.id,
					organizationId,
					description: goal.description,
					category: goal.category,
					targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
					status: goal.status ?? 'ACTIVE',
					notes: goal.notes ?? null,
				})),
			});
		}

		return txDb.carePlan.findFirst({
			where: { id: created.id, organizationId, deletedAt: null },
			select: detailSelect(),
		});
	});

	if (!carePlan) {
		throw new NotFoundError('Care plan not found');
	}

	return mapCarePlanDetail(carePlan);
}

export async function listCarePlansService(
	organizationId: string, query: CarePlanListQuery,
): Promise<{ carePlans: Array<CarePlanRecord & { patient: { id: string; firstName: string; lastName: string } }>; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
	const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
	const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
	const skip = (page - 1) * limit;

	const where: Record<string, unknown> = { organizationId, deletedAt: null };
	if (query.patientId) where.patientId = query.patientId;
	if (query.status) where.status = query.status;

	const [carePlans, total] = await Promise.all([
		prisma.carePlan.findMany({
			where,
			select: {
				id: true, version: true, goals: true, status: true, patientId: true,
				organizationId: true, createdById: true, createdAt: true, updatedAt: true,
				patient: { select: { id: true, firstName: true, lastName: true } },
			},
			orderBy: [{ patientId: 'asc' }, { version: 'desc' }],
			skip,
			take: limit,
		}),
		prisma.carePlan.count({ where }),
	]);

	return {
		carePlans: carePlans.map((carePlan: any) => ({
			id: carePlan.id,
			version: carePlan.version,
			summary: carePlan.goals,
			status: carePlan.status,
			patientId: carePlan.patientId,
			organizationId: carePlan.organizationId,
			createdById: carePlan.createdById,
			createdAt: carePlan.createdAt,
			updatedAt: carePlan.updatedAt,
			patient: carePlan.patient,
		})),
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
}

export async function getCarePlanService(organizationId: string, carePlanId: string): Promise<CarePlanDetail> {
	const carePlan = await prisma.carePlan.findFirst({
		where: { id: carePlanId, organizationId, deletedAt: null },
		select: detailSelect(),
	});
	if (!carePlan) throw new NotFoundError('Care plan not found');
	return mapCarePlanDetail(carePlan);
}

export async function updateCarePlanService(
	organizationId: string, carePlanId: string, input: UpdateCarePlanBody,
): Promise<CarePlanDetail> {
	const existing = await prisma.carePlan.findFirst({
		where: { id: carePlanId, organizationId, deletedAt: null }, select: { id: true },
	});
	if (!existing) throw new NotFoundError('Care plan not found');

	const data: Record<string, unknown> = {};
	if (input.summary !== undefined) data.goals = input.summary;
	if (input.status !== undefined) data.status = input.status;

	const carePlan = await prisma.$transaction(async (tx) => {
		const txDb = tx as any;
		await txDb.carePlan.update({
			where: { id: carePlanId },
			data,
		});

		if (input.conditions !== undefined) {
			await txDb.carePlanCondition.deleteMany({
				where: { carePlanId, organizationId },
			});

			if (input.conditions.length > 0) {
				await txDb.carePlanCondition.createMany({
					data: input.conditions.map((condition) => ({
						carePlanId,
						organizationId,
						name: condition.name,
						diagnosedYear: condition.diagnosedYear ?? null,
						description: condition.description ?? null,
						patientImpact: condition.patientImpact ?? null,
						carerNotes: condition.carerNotes ?? null,
					})),
				});
			}
		}

		if (input.risks !== undefined) {
			await txDb.carePlanRisk.deleteMany({
				where: { carePlanId, organizationId },
			});

			if (input.risks.length > 0) {
				await txDb.carePlanRisk.createMany({
					data: input.risks.map((risk) => ({
						carePlanId,
						organizationId,
						label: risk.label,
						level: risk.level ?? 'MEDIUM',
						notes: risk.notes,
						reviewDate: risk.reviewDate ? new Date(risk.reviewDate) : null,
					})),
				});
			}
		}

		if (input.tasks !== undefined) {
			await txDb.carePlanTask.deleteMany({
				where: { carePlanId, organizationId },
			});

			if (input.tasks.length > 0) {
				await txDb.carePlanTask.createMany({
					data: input.tasks.map((task) => ({
						carePlanId,
						organizationId,
						label: task.label,
						visitType: task.visitType,
						required: task.required ?? true,
						notes: task.notes ?? null,
					})),
				});
			}
		}

		if (input.goals !== undefined) {
			await txDb.carePlanGoal.deleteMany({
				where: { carePlanId, organizationId },
			});

			if (input.goals.length > 0) {
				await txDb.carePlanGoal.createMany({
					data: input.goals.map((goal) => ({
						carePlanId,
						organizationId,
						description: goal.description,
						category: goal.category,
						targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
						status: goal.status ?? 'ACTIVE',
						notes: goal.notes ?? null,
					})),
				});
			}
		}

		return txDb.carePlan.findFirst({
			where: { id: carePlanId, organizationId, deletedAt: null },
			select: detailSelect(),
		});
	});

	if (!carePlan) {
		throw new NotFoundError('Care plan not found');
	}

	return mapCarePlanDetail(carePlan);
}

export async function deleteCarePlanService(organizationId: string, carePlanId: string): Promise<{ message: string }> {
	const existing = await prisma.carePlan.findFirst({
		where: { id: carePlanId, organizationId, deletedAt: null }, select: { id: true },
	});
	if (!existing) throw new NotFoundError('Care plan not found');
	await prisma.carePlan.update({ where: { id: carePlanId }, data: { deletedAt: new Date() } });
	return { message: 'Care plan deleted successfully' };
}
