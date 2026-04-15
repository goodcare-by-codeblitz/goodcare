import { prisma } from '@repo/db';
import { ConflictError, NotFoundError } from '../../lib/errors';
import type {
	CreateVisitBody,
	UpdateVisitBody,
	VisitListQuery,
} from './visit.types';

type VisitRecord = {
	id: string;
	scheduledStart: Date;
	scheduledEnd: Date;
	actualStart: Date | null;
	actualEnd: Date | null;
	status: string;
	patientId: string;
	organizationId: string;
	createdAt: Date;
	updatedAt: Date;
};

export async function createVisitService(
	organizationId: string,
	input: CreateVisitBody,
): Promise<VisitRecord> {
	return prisma.visit.create({
		data: {
			organizationId,
			patientId: input.patientId,
			scheduledStart: new Date(input.scheduledStart),
			scheduledEnd: new Date(input.scheduledEnd),
			status: input.status ?? 'SCHEDULED',
		},
		select: {
			id: true,
			scheduledStart: true,
			scheduledEnd: true,
			actualStart: true,
			actualEnd: true,
			status: true,
			patientId: true,
			organizationId: true,
			createdAt: true,
			updatedAt: true,
		},
	});
}

export async function listVisitsService(
	organizationId: string,
	query: VisitListQuery,
): Promise<{
	visits: VisitRecord[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}> {
	const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
	const limit = Math.min(
		100,
		Math.max(1, parseInt(query.limit ?? '20', 10) || 20),
	);
	const skip = (page - 1) * limit;

	const where: Record<string, unknown> = { organizationId, deletedAt: null };
	if (query.patientId) where.patientId = query.patientId;
	if (query.status) where.status = query.status;
	if (query.from || query.to) {
		const scheduledStart: Record<string, Date> = {};
		if (query.from) scheduledStart.gte = new Date(query.from);
		if (query.to) scheduledStart.lte = new Date(query.to);
		where.scheduledStart = scheduledStart;
	}

	const [visits, total] = await Promise.all([
		prisma.visit.findMany({
			where,
			select: {
				id: true,
				scheduledStart: true,
				scheduledEnd: true,
				actualStart: true,
				actualEnd: true,
				status: true,
				patientId: true,
				organizationId: true,
				createdAt: true,
				updatedAt: true,
			},
			orderBy: { scheduledStart: 'asc' },
			skip,
			take: limit,
		}),
		prisma.visit.count({ where }),
	]);

	return {
		visits,
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
}

type VisitDetail = VisitRecord & {
	patient: { firstName: string; lastName: string };
	assignments: Array<{
		id: string;
		isActive: boolean;
		carer: {
			id: string;
			organizationUser: { user: { firstName: string; lastName: string } };
		};
	}>;
};

export async function getVisitService(
	organizationId: string,
	visitId: string,
): Promise<VisitDetail> {
	const visit = await prisma.visit.findFirst({
		where: { id: visitId, organizationId, deletedAt: null },
		select: {
			id: true,
			scheduledStart: true,
			scheduledEnd: true,
			actualStart: true,
			actualEnd: true,
			status: true,
			patientId: true,
			organizationId: true,
			createdAt: true,
			updatedAt: true,
			patient: { select: { firstName: true, lastName: true } },
			assignments: {
				where: { isActive: true },
				select: {
					id: true,
					isActive: true,
					carer: {
						select: {
							id: true,
							organizationUser: {
								select: {
									user: { select: { firstName: true, lastName: true } },
								},
							},
						},
					},
				},
			},
		},
	});
	if (!visit) throw new NotFoundError('Visit not found');
	return visit;
}

export async function updateVisitService(
	organizationId: string,
	visitId: string,
	input: UpdateVisitBody,
): Promise<VisitRecord> {
	const existing = await prisma.visit.findFirst({
		where: { id: visitId, organizationId, deletedAt: null },
		select: { id: true },
	});
	if (!existing) throw new NotFoundError('Visit not found');

	const data: Record<string, unknown> = {};
	if (input.scheduledStart !== undefined)
		data.scheduledStart = new Date(input.scheduledStart);
	if (input.scheduledEnd !== undefined)
		data.scheduledEnd = new Date(input.scheduledEnd);
	if (input.actualStart !== undefined)
		data.actualStart = new Date(input.actualStart);
	if (input.actualEnd !== undefined) data.actualEnd = new Date(input.actualEnd);
	if (input.status !== undefined) data.status = input.status;

	return prisma.visit.update({
		where: { id: visitId },
		data,
		select: {
			id: true,
			scheduledStart: true,
			scheduledEnd: true,
			actualStart: true,
			actualEnd: true,
			status: true,
			patientId: true,
			organizationId: true,
			createdAt: true,
			updatedAt: true,
		},
	});
}

export async function deleteVisitService(
	organizationId: string,
	visitId: string,
): Promise<{ message: string }> {
	const existing = await prisma.visit.findFirst({
		where: { id: visitId, organizationId, deletedAt: null },
		select: { id: true },
	});
	if (!existing) throw new NotFoundError('Visit not found');
	await prisma.visit.update({
		where: { id: visitId },
		data: { deletedAt: new Date() },
	});
	return { message: 'Visit deleted successfully' };
}

//TODO: check that carer belongs to same org, and that visit and carer aren't already linked and check if the client doesn't require 2 carers
export async function assignCarerService(
	organizationId: string,
	visitId: string,
	carerId: string,
	assignedById: string,
): Promise<{
	id: string;
	visitId: string;
	carerId: string;
	isActive: boolean;
	assignedAt: Date;
}> {
	const visit = await prisma.visit.findFirst({
		where: { id: visitId, organizationId, deletedAt: null },
		select: { id: true },
	});
	if (!visit) throw new NotFoundError('Visit not found');

	const carer = await prisma.carer.findFirst({
		where: { id: carerId, organizationId },
		select: { id: true },
	});
	if (!carer) throw new NotFoundError('Carer not found');

	const existing = await prisma.visitAssignment.findFirst({
		where: { visitId, carerId, organizationId, isActive: true },
		select: { id: true },
	});
	if (existing)
		throw new ConflictError('Carer is already assigned to this visit');

	return prisma.visitAssignment.create({
		data: { visitId, carerId, organizationId, assignedById },
		select: {
			id: true,
			visitId: true,
			carerId: true,
			isActive: true,
			assignedAt: true,
			assignedById: true,
		},
	});
}

export async function unassignCarerService(
	organizationId: string,
	visitId: string,
	carerId: string,
): Promise<{ message: string }> {
	const assignment = await prisma.visitAssignment.findFirst({
		where: { visitId, carerId, organizationId, isActive: true },
		select: { id: true },
	});
	if (!assignment) throw new NotFoundError('Active assignment not found');

	await prisma.visitAssignment.update({
		where: { id: assignment.id },
		data: { isActive: true, unassignedAt: new Date() },
	});
	return { message: 'Carer unassigned successfully' };
}
