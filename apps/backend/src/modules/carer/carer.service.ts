import { prisma } from '@repo/db';
import { NotFoundError } from '../../lib/errors';
import type { CarerListQuery, CreateCarerBody, UpdateCarerBody } from './carer.types';

type CarerRecord = {
	id: string;
	hireDate: Date;
	employmentType: string;
	experienceYears: number;
	availability: string;
	status: string;
	organizationId: string;
	organizationUserId: string;
	updatedAt: Date;
};

export async function createCarerService(
	organizationId: string,
	input: CreateCarerBody,
): Promise<CarerRecord> {
	return prisma.carer.create({
		data: {
			organizationId,
			organizationUserId: input.organizationUserId,
			hireDate: new Date(input.hireDate),
			employmentType: input.employmentType,
			experienceYears: input.experienceYears ?? 0,
			availability: input.availability,
		},
		select: {
			id: true, hireDate: true, employmentType: true, experienceYears: true,
			availability: true, status: true, organizationId: true, organizationUserId: true, updatedAt: true,
		},
	});
}

export async function listCarersService(
	organizationId: string,
	query: CarerListQuery,
): Promise<{ carers: Array<CarerRecord & { organizationUser: { user: { firstName: string; lastName: string; email: string } } }>; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
	const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
	const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
	const skip = (page - 1) * limit;

	const where: Record<string, unknown> = { organizationId };
	if (query.status) where.status = query.status;
	if (query.search) {
		where.organizationUser = {
			user: {
				OR: [
					{ firstName: { contains: query.search, mode: 'insensitive' } },
					{ lastName: { contains: query.search, mode: 'insensitive' } },
				],
			},
		};
	}

	const [carers, total] = await Promise.all([
		prisma.carer.findMany({
			where,
			select: {
				id: true, hireDate: true, employmentType: true, experienceYears: true,
				availability: true, status: true, organizationId: true, organizationUserId: true, updatedAt: true,
				organizationUser: { select: { user: { select: { firstName: true, lastName: true, email: true } } } },
			},
			orderBy: { updatedAt: 'desc' },
			skip,
			take: limit,
		}),
		prisma.carer.count({ where }),
	]);

	return { carers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getCarerService(
	organizationId: string,
	carerId: string,
): Promise<CarerRecord & { organizationUser: { user: { firstName: string; lastName: string; email: string } } }> {
	const carer = await prisma.carer.findFirst({
		where: { id: carerId, organizationId },
		select: {
			id: true, hireDate: true, employmentType: true, experienceYears: true,
			availability: true, status: true, organizationId: true, organizationUserId: true, updatedAt: true,
			organizationUser: { select: { user: { select: { firstName: true, lastName: true, email: true } } } },
		},
	});
	if (!carer) throw new NotFoundError('Carer not found');
	return carer;
}

export async function updateCarerService(
	organizationId: string,
	carerId: string,
	input: UpdateCarerBody,
): Promise<CarerRecord> {
	const existing = await prisma.carer.findFirst({ where: { id: carerId, organizationId }, select: { id: true } });
	if (!existing) throw new NotFoundError('Carer not found');

	const data: Record<string, unknown> = {};
	if (input.hireDate !== undefined) data.hireDate = new Date(input.hireDate);
	if (input.employmentType !== undefined) data.employmentType = input.employmentType;
	if (input.experienceYears !== undefined) data.experienceYears = input.experienceYears;
	if (input.availability !== undefined) data.availability = input.availability;
	if (input.status !== undefined) data.status = input.status;

	return prisma.carer.update({
		where: { id: carerId },
		data,
		select: {
			id: true, hireDate: true, employmentType: true, experienceYears: true,
			availability: true, status: true, organizationId: true, organizationUserId: true, updatedAt: true,
		},
	});
}

export async function deleteCarerService(organizationId: string, carerId: string): Promise<{ message: string }> {
	const existing = await prisma.carer.findFirst({ where: { id: carerId, organizationId }, select: { id: true } });
	if (!existing) throw new NotFoundError('Carer not found');

	await prisma.carer.update({ where: { id: carerId }, data: { status: 'TERMINATED' } });
	return { message: 'Carer terminated successfully' };
}
