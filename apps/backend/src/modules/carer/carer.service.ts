import { prisma } from '@repo/db';
import { NotFoundError, ValidationError } from '../../lib/errors';
import type {
	AvailabilitySlotInput,
	CarerListQuery,
	CreateCarerBody,
	UpdateCarerBody,
	WeeklyAvailabilityInput,
} from './carer.types';

const db = prisma as any;

const dayMapping = [
	{ db: 'MONDAY', api: 'monday' },
	{ db: 'TUESDAY', api: 'tuesday' },
	{ db: 'WEDNESDAY', api: 'wednesday' },
	{ db: 'THURSDAY', api: 'thursday' },
	{ db: 'FRIDAY', api: 'friday' },
	{ db: 'SATURDAY', api: 'saturday' },
	{ db: 'SUNDAY', api: 'sunday' },
] as const;

type ApiDayKey = (typeof dayMapping)[number]['api'];
type DbDayKey = (typeof dayMapping)[number]['db'];

type AvailabilitySlotRecord = {
	id: string;
	startTime: string;
	endTime: string;
	crossesMidnight: boolean;
};

type WeeklyAvailabilityRecord = Record<ApiDayKey, AvailabilitySlotRecord[]>;

type CarerListRecord = {
	id: string;
	hireDate: Date;
	employmentType: string;
	experienceYears: number;
	status: string;
	organizationId: string;
	organizationUserId: string;
	updatedAt: Date;
};

type CarerDetailRecord = CarerListRecord & {
	availability: WeeklyAvailabilityRecord;
	organizationUser: {
		user: { firstName: string; lastName: string; email: string };
	};
};

function blankAvailability(): WeeklyAvailabilityRecord {
	return {
		monday: [],
		tuesday: [],
		wednesday: [],
		thursday: [],
		friday: [],
		saturday: [],
		sunday: [],
	};
}

function toTimeString(minutes: number) {
	const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
	const mins = String(minutes % 60).padStart(2, '0');
	return `${hours}:${mins}`;
}

function toMinutes(value: string) {
	const [hoursRaw, minutesRaw] = value.split(':');
	const hours = Number.parseInt(hoursRaw ?? '', 10);
	const minutes = Number.parseInt(minutesRaw ?? '', 10);
	if (
		Number.isNaN(hours) ||
		Number.isNaN(minutes) ||
		hours < 0 ||
		hours > 23 ||
		minutes < 0 ||
		minutes > 59
	) {
		throw new ValidationError(`Invalid availability time: ${value}`);
	}

	return hours * 60 + minutes;
}

function normalizeSlot(slot: AvailabilitySlotInput, dayLabel: string) {
	const startTimeMinutes = toMinutes(slot.startTime);
	const endTimeMinutes = toMinutes(slot.endTime);
	const crossesMidnight = slot.crossesMidnight ?? false;

	if (startTimeMinutes === endTimeMinutes) {
		throw new ValidationError(
			`${dayLabel} availability windows must have different start and end times.`,
		);
	}

	if (!crossesMidnight && startTimeMinutes > endTimeMinutes) {
		throw new ValidationError(
			`${dayLabel} availability windows that end the next day must be marked as overnight.`,
		);
	}

	if (crossesMidnight && startTimeMinutes < endTimeMinutes) {
		throw new ValidationError(
			`${dayLabel} overnight availability windows must end on the following day.`,
		);
	}

	return {
		startTimeMinutes,
		endTimeMinutes,
		crossesMidnight,
	};
}

function validateDaySlots(dayLabel: string, slots: AvailabilitySlotInput[]) {
	const normalized = slots.map((slot) => normalizeSlot(slot, dayLabel));
	const segments = normalized.flatMap((slot, index) => {
		if (slot.crossesMidnight) {
			return [
				{ index, start: slot.startTimeMinutes, end: 1440 },
				{ index, start: 0, end: slot.endTimeMinutes },
			];
		}

		return [{ index, start: slot.startTimeMinutes, end: slot.endTimeMinutes }];
	});

	segments.sort((left, right) => left.start - right.start);
	for (let index = 1; index < segments.length; index += 1) {
		if (segments[index]!.start < segments[index - 1]!.end) {
			throw new ValidationError(
				`${dayLabel} availability contains overlapping time windows.`,
			);
		}
	}

	return normalized;
}

function normalizeAvailabilityInput(input?: WeeklyAvailabilityInput) {
	const normalized: Array<{
		dayOfWeek: DbDayKey;
		startTimeMinutes: number;
		endTimeMinutes: number;
		crossesMidnight: boolean;
	}> = [];

	for (const mapping of dayMapping) {
		const daySlots = input?.[mapping.api] ?? [];
		const validSlots = validateDaySlots(mapping.api, daySlots);
		for (const slot of validSlots) {
			normalized.push({
				dayOfWeek: mapping.db,
				startTimeMinutes: slot.startTimeMinutes,
				endTimeMinutes: slot.endTimeMinutes,
				crossesMidnight: slot.crossesMidnight,
			});
		}
	}

	return normalized;
}

function mapAvailability(
	slots: Array<{
		id: string;
		dayOfWeek: DbDayKey;
		startTimeMinutes: number;
		endTimeMinutes: number;
		crossesMidnight: boolean;
	}>,
) {
	const weekly = blankAvailability();

	for (const mapping of dayMapping) {
		const daySlots = slots
			.filter((slot) => slot.dayOfWeek === mapping.db)
			.sort((left, right) => left.startTimeMinutes - right.startTimeMinutes)
			.map((slot) => ({
				id: slot.id,
				startTime: toTimeString(slot.startTimeMinutes),
				endTime: toTimeString(slot.endTimeMinutes),
				crossesMidnight: slot.crossesMidnight,
			}));

		weekly[mapping.api] = daySlots;
	}

	return weekly;
}

const listSelect = {
	id: true,
	hireDate: true,
	employmentType: true,
	experienceYears: true,
	status: true,
	organizationId: true,
	organizationUserId: true,
	updatedAt: true,
	organizationUser: {
		select: {
			user: {
				select: {
					firstName: true,
					lastName: true,
					email: true,
				},
			},
		},
	},
};

const detailSelect = {
	...listSelect,
	availabilitySlots: {
		select: {
			id: true,
			dayOfWeek: true,
			startTimeMinutes: true,
			endTimeMinutes: true,
			crossesMidnight: true,
		},
		orderBy: [
			{ dayOfWeek: 'asc' as const },
			{ startTimeMinutes: 'asc' as const },
		],
	},
};

function mapCarerDetail(carer: any): CarerDetailRecord {
	return {
		id: carer.id,
		hireDate: carer.hireDate,
		employmentType: carer.employmentType,
		experienceYears: carer.experienceYears,
		status: carer.status,
		organizationId: carer.organizationId,
		organizationUserId: carer.organizationUserId,
		updatedAt: carer.updatedAt,
		organizationUser: carer.organizationUser,
		availability: mapAvailability(carer.availabilitySlots ?? []),
	};
}

export async function createCarerService(
	organizationId: string,
	input: CreateCarerBody,
): Promise<CarerDetailRecord> {
	const availabilitySlots = normalizeAvailabilityInput(input.availability);

	const carer = await prisma.$transaction(async (tx) => {
		const txDb = tx as any;
		const created = await txDb.carer.create({
			data: {
				organizationId,
				organizationUserId: input.organizationUserId,
				hireDate: new Date(input.hireDate),
				employmentType: input.employmentType,
				experienceYears: input.experienceYears ?? 0,
			},
			select: { id: true, organizationId: true },
		});

		if (availabilitySlots.length > 0) {
			await txDb.carerAvailabilitySlot.createMany({
				data: availabilitySlots.map((slot) => ({
					...slot,
					carerId: created.id,
					organizationId,
				})),
			});
		}

		return txDb.carer.findFirst({
			where: { id: created.id, organizationId },
			select: detailSelect,
		});
	});

	if (!carer) {
		throw new NotFoundError('Carer not found');
	}

	return mapCarerDetail(carer);
}

export async function listCarersService(
	organizationId: string,
	query: CarerListQuery,
): Promise<{
	carers: Array<
		CarerListRecord & {
			organizationUser: {
				user: { firstName: string; lastName: string; email: string };
			};
		}
	>;
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
			select: listSelect,
			orderBy: { updatedAt: 'desc' },
			skip,
			take: limit,
		}),
		prisma.carer.count({ where }),
	]);

	return {
		carers: carers.map((carer: any) => ({
			id: carer.id,
			hireDate: carer.hireDate,
			employmentType: carer.employmentType,
			experienceYears: carer.experienceYears,
			status: carer.status,
			organizationId: carer.organizationId,
			organizationUserId: carer.organizationUserId,
			updatedAt: carer.updatedAt,
			organizationUser: carer.organizationUser,
		})),
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
}

export async function getCarerService(
	organizationId: string,
	carerId: string,
): Promise<CarerDetailRecord> {
	const carer = await db.carer.findFirst({
		where: { id: carerId, organizationId },
		select: detailSelect,
	});
	if (!carer) throw new NotFoundError('Carer not found');
	return mapCarerDetail(carer);
}

export async function updateCarerService(
	organizationId: string,
	carerId: string,
	input: UpdateCarerBody,
): Promise<CarerDetailRecord> {
	const existing = await prisma.carer.findFirst({
		where: { id: carerId, organizationId },
		select: { id: true },
	});
	if (!existing) throw new NotFoundError('Carer not found');

	const data: Record<string, unknown> = {};
	if (input.hireDate !== undefined) data.hireDate = new Date(input.hireDate);
	if (input.employmentType !== undefined)
		data.employmentType = input.employmentType;
	if (input.experienceYears !== undefined)
		data.experienceYears = input.experienceYears;
	if (input.status !== undefined) data.status = input.status;

	const normalizedAvailability =
		input.availability !== undefined
			? normalizeAvailabilityInput(input.availability)
			: null;

	const carer = await prisma.$transaction(async (tx) => {
		const txDb = tx as any;
		await txDb.carer.update({
			where: { id: carerId },
			data,
		});

		if (normalizedAvailability !== null) {
			await txDb.carerAvailabilitySlot.deleteMany({
				where: { carerId, organizationId },
			});

			if (normalizedAvailability.length > 0) {
				await txDb.carerAvailabilitySlot.createMany({
					data: normalizedAvailability.map((slot) => ({
						...slot,
						carerId,
						organizationId,
					})),
				});
			}
		}

		return txDb.carer.findFirst({
			where: { id: carerId, organizationId },
			select: detailSelect,
		});
	});

	if (!carer) throw new NotFoundError('Carer not found');
	return mapCarerDetail(carer);
}

export async function deleteCarerService(
	organizationId: string,
	carerId: string,
): Promise<{ message: string }> {
	const existing = await prisma.carer.findFirst({
		where: { id: carerId, organizationId },
		select: { id: true },
	});
	if (!existing) throw new NotFoundError('Carer not found');

	await prisma.carer.update({
		where: { id: carerId },
		data: { status: 'TERMINATED' },
	});
	return { message: 'Carer terminated successfully' };
}
