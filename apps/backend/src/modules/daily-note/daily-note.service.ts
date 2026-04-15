import { prisma } from '@repo/db';
import { NotFoundError } from '../../lib/errors';
import type { CreateDailyNoteBody, DailyNoteListQuery, UpdateDailyNoteBody } from './daily-note.types';

type DailyNoteRecord = {
	id: string;
	notes: string;
	visitId: string;
	carerId: string;
	organizationId: string;
	createdAt: Date;
	updatedAt: Date;
};

export async function createDailyNoteService(organizationId: string, input: CreateDailyNoteBody): Promise<DailyNoteRecord> {
	const visit = await prisma.visit.findFirst({ where: { id: input.visitId, organizationId, deletedAt: null }, select: { id: true } });
	if (!visit) throw new NotFoundError('Visit not found');

	const carer = await prisma.carer.findFirst({ where: { id: input.carerId, organizationId }, select: { id: true } });
	if (!carer) throw new NotFoundError('Carer not found');

	return prisma.dailyNote.create({
		data: { organizationId, visitId: input.visitId, carerId: input.carerId, notes: input.notes },
		select: { id: true, notes: true, visitId: true, carerId: true, organizationId: true, createdAt: true, updatedAt: true },
	});
}

export async function listDailyNotesService(
	organizationId: string, query: DailyNoteListQuery,
): Promise<{ dailyNotes: DailyNoteRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
	const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
	const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
	const skip = (page - 1) * limit;

	const where: Record<string, unknown> = { organizationId, deletedAt: null };
	if (query.visitId) where.visitId = query.visitId;
	if (query.carerId) where.carerId = query.carerId;

	const [dailyNotes, total] = await Promise.all([
		prisma.dailyNote.findMany({
			where,
			select: { id: true, notes: true, visitId: true, carerId: true, organizationId: true, createdAt: true, updatedAt: true },
			orderBy: { createdAt: 'desc' },
			skip,
			take: limit,
		}),
		prisma.dailyNote.count({ where }),
	]);

	return { dailyNotes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getDailyNoteService(organizationId: string, dailyNoteId: string): Promise<DailyNoteRecord> {
	const note = await prisma.dailyNote.findFirst({
		where: { id: dailyNoteId, organizationId, deletedAt: null },
		select: { id: true, notes: true, visitId: true, carerId: true, organizationId: true, createdAt: true, updatedAt: true },
	});
	if (!note) throw new NotFoundError('Daily note not found');
	return note;
}

export async function updateDailyNoteService(organizationId: string, dailyNoteId: string, input: UpdateDailyNoteBody): Promise<DailyNoteRecord> {
	const existing = await prisma.dailyNote.findFirst({ where: { id: dailyNoteId, organizationId, deletedAt: null }, select: { id: true } });
	if (!existing) throw new NotFoundError('Daily note not found');

	const data: Record<string, unknown> = {};
	if (input.notes !== undefined) data.notes = input.notes;

	return prisma.dailyNote.update({
		where: { id: dailyNoteId },
		data,
		select: { id: true, notes: true, visitId: true, carerId: true, organizationId: true, createdAt: true, updatedAt: true },
	});
}

export async function deleteDailyNoteService(organizationId: string, dailyNoteId: string): Promise<{ message: string }> {
	const existing = await prisma.dailyNote.findFirst({ where: { id: dailyNoteId, organizationId, deletedAt: null }, select: { id: true } });
	if (!existing) throw new NotFoundError('Daily note not found');
	await prisma.dailyNote.update({ where: { id: dailyNoteId }, data: { deletedAt: new Date() } });
	return { message: 'Daily note deleted successfully' };
}
