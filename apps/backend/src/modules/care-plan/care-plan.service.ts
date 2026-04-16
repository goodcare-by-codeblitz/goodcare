import { prisma } from '@repo/db';
import { NotFoundError } from '../../lib/errors';
import type { CarePlanListQuery, CreateCarePlanBody, UpdateCarePlanBody } from './care-plan.types';

type CarePlanRecord = {
	id: string;
	version: number;
	goals: string;
	status: string;
	patientId: string;
	organizationId: string;
	createdById: string;
	createdAt: Date;
	updatedAt: Date;
};

export async function createCarePlanService(
	organizationId: string, createdById: string, input: CreateCarePlanBody,
): Promise<CarePlanRecord> {
	const latestVersion = await prisma.carePlan.findFirst({
		where: { patientId: input.patientId, organizationId, deletedAt: null },
		orderBy: { version: 'desc' },
		select: { version: true },
	});

	return prisma.carePlan.create({
		data: {
			organizationId,
			patientId: input.patientId,
			createdById,
			goals: input.goals,
			status: input.status ?? 'DRAFT',
			version: (latestVersion?.version ?? 0) + 1,
		},
		select: {
			id: true, version: true, goals: true, status: true, patientId: true,
			organizationId: true, createdById: true, createdAt: true, updatedAt: true,
		},
	});
}

export async function listCarePlansService(
	organizationId: string, query: CarePlanListQuery,
): Promise<{ carePlans: CarePlanRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
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
			},
			orderBy: [{ patientId: 'asc' }, { version: 'desc' }],
			skip,
			take: limit,
		}),
		prisma.carePlan.count({ where }),
	]);

	return { carePlans, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

type CarePlanDetail = CarePlanRecord & {
	patient: { firstName: string; lastName: string };
	createdBy: { firstName: string; lastName: string; email: string };
};

export async function getCarePlanService(organizationId: string, carePlanId: string): Promise<CarePlanDetail> {
	const carePlan = await prisma.carePlan.findFirst({
		where: { id: carePlanId, organizationId, deletedAt: null },
		select: {
			id: true, version: true, goals: true, status: true, patientId: true,
			organizationId: true, createdById: true, createdAt: true, updatedAt: true,
			patient: { select: { firstName: true, lastName: true } },
			createdBy: { select: { firstName: true, lastName: true, email: true } },
		},
	});
	if (!carePlan) throw new NotFoundError('Care plan not found');
	return carePlan;
}

export async function updateCarePlanService(
	organizationId: string, carePlanId: string, input: UpdateCarePlanBody,
): Promise<CarePlanRecord> {
	const existing = await prisma.carePlan.findFirst({
		where: { id: carePlanId, organizationId, deletedAt: null }, select: { id: true },
	});
	if (!existing) throw new NotFoundError('Care plan not found');

	const data: Record<string, unknown> = {};
	if (input.goals !== undefined) data.goals = input.goals;
	if (input.status !== undefined) data.status = input.status;

	return prisma.carePlan.update({
		where: { id: carePlanId },
		data,
		select: {
			id: true, version: true, goals: true, status: true, patientId: true,
			organizationId: true, createdById: true, createdAt: true, updatedAt: true,
		},
	});
}

export async function deleteCarePlanService(organizationId: string, carePlanId: string): Promise<{ message: string }> {
	const existing = await prisma.carePlan.findFirst({
		where: { id: carePlanId, organizationId, deletedAt: null }, select: { id: true },
	});
	if (!existing) throw new NotFoundError('Care plan not found');
	await prisma.carePlan.update({ where: { id: carePlanId }, data: { deletedAt: new Date() } });
	return { message: 'Care plan deleted successfully' };
}
