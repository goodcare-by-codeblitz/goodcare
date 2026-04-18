import { prisma } from '@repo/db';
import { ConflictError, NotFoundError } from '../../lib/errors';
import type {
	CreateVisitBody,
	UpdateVisitBody,
	VisitListQuery,
} from './visit.types';

const db = prisma as any;

const dayOrder = [
	'MONDAY',
	'TUESDAY',
	'WEDNESDAY',
	'THURSDAY',
	'FRIDAY',
	'SATURDAY',
	'SUNDAY',
] as const;

type DayKey = (typeof dayOrder)[number];

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

type VisitAssignmentWarning = {
	code: 'OVERLAPPING_VISIT' | 'OUTSIDE_AVAILABILITY';
	message: string;
	relatedVisit?: {
		id: string;
		patientId: string;
		patientName: string;
		scheduledStart: Date;
		scheduledEnd: Date;
		status: string;
	};
};

function overlap(startA: Date, endA: Date, startB: Date, endB: Date) {
	return startA < endB && startB < endA;
}

function getMinutesIntoDay(value: Date) {
	return value.getHours() * 60 + value.getMinutes();
}

function getDayIndex(value: Date) {
	return (value.getDay() + 6) % 7;
}

function getDayKeyFromIndex(index: number): DayKey {
	return dayOrder[((index % 7) + 7) % 7]!;
}

function buildAvailabilityIntervalsForDate(
	slots: Array<{
		dayOfWeek: DayKey;
		startTimeMinutes: number;
		endTimeMinutes: number;
		crossesMidnight: boolean;
	}>,
	date: Date,
) {
	const dayIndex = getDayIndex(date);
	const dayKey = getDayKeyFromIndex(dayIndex);
	const previousDayKey = getDayKeyFromIndex(dayIndex - 1);
	const intervals: Array<{ start: number; end: number }> = [];

	for (const slot of slots) {
		if (slot.dayOfWeek === dayKey) {
			if (slot.crossesMidnight) {
				intervals.push({ start: slot.startTimeMinutes, end: 1440 });
			} else {
				intervals.push({
					start: slot.startTimeMinutes,
					end: slot.endTimeMinutes,
				});
			}
		}

		if (slot.crossesMidnight && slot.dayOfWeek === previousDayKey) {
			intervals.push({ start: 0, end: slot.endTimeMinutes });
		}
	}

	intervals.sort((left, right) => left.start - right.start);

	const merged: Array<{ start: number; end: number }> = [];
	for (const interval of intervals) {
		const previous = merged[merged.length - 1];
		if (!previous || interval.start > previous.end) {
			merged.push({ ...interval });
			continue;
		}

		previous.end = Math.max(previous.end, interval.end);
	}

	return merged;
}

function isVisitCoveredByAvailability(
	visitStart: Date,
	visitEnd: Date,
	slots: Array<{
		dayOfWeek: DayKey;
		startTimeMinutes: number;
		endTimeMinutes: number;
		crossesMidnight: boolean;
	}>,
) {
	let cursor = new Date(visitStart);

	while (cursor < visitEnd) {
		const segmentDayStart = new Date(cursor);
		segmentDayStart.setHours(0, 0, 0, 0);
		const nextDayStart = new Date(segmentDayStart);
		nextDayStart.setDate(segmentDayStart.getDate() + 1);
		const segmentEnd = nextDayStart < visitEnd ? nextDayStart : visitEnd;
		const segmentStartMinutes =
			cursor.getTime() === visitStart.getTime() ? getMinutesIntoDay(cursor) : 0;
		const segmentEndMinutes =
			segmentEnd.getTime() === nextDayStart.getTime()
				? 1440
				: getMinutesIntoDay(segmentEnd);
		const availability = buildAvailabilityIntervalsForDate(slots, cursor);

		const covered = availability.some(
			(interval) =>
				interval.start <= segmentStartMinutes &&
				interval.end >= segmentEndMinutes,
		);

		if (!covered) {
			return false;
		}

		cursor = segmentEnd;
	}

	return true;
}

async function getVisitForPreview(organizationId: string, visitId: string) {
	const visit = await db.visit.findFirst({
		where: { id: visitId, organizationId, deletedAt: null },
		select: {
			id: true,
			patientId: true,
			status: true,
			scheduledStart: true,
			scheduledEnd: true,
			patient: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
		},
	});

	if (!visit) {
		throw new NotFoundError('Visit not found');
	}

	return visit;
}

async function buildVisitAssignmentWarnings(
	organizationId: string,
	visitId: string,
	carerId: string,
) {
	const visit = await getVisitForPreview(organizationId, visitId);
	const carer = await db.carer.findFirst({
		where: { id: carerId, organizationId, status: { not: 'TERMINATED' } },
		select: {
			id: true,
			organizationUser: {
				select: {
					user: {
						select: {
							firstName: true,
							lastName: true,
						},
					},
				},
			},
			availabilitySlots: {
				select: {
					dayOfWeek: true,
					startTimeMinutes: true,
					endTimeMinutes: true,
					crossesMidnight: true,
				},
			},
		},
	});

	if (!carer) {
		throw new NotFoundError('Carer not found');
	}

	const warnings: VisitAssignmentWarning[] = [];

	const overlappingVisits = await db.visit.findMany({
		where: {
			organizationId,
			deletedAt: null,
			id: { not: visitId },
			scheduledStart: { lt: visit.scheduledEnd },
			scheduledEnd: { gt: visit.scheduledStart },
			assignments: {
				some: {
					carerId,
					organizationId,
					isActive: true,
				},
			},
		},
		select: {
			id: true,
			patientId: true,
			status: true,
			scheduledStart: true,
			scheduledEnd: true,
			patient: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
		},
		orderBy: { scheduledStart: 'asc' },
	});

	for (const overlappingVisit of overlappingVisits) {
		if (
			overlap(
				visit.scheduledStart,
				visit.scheduledEnd,
				overlappingVisit.scheduledStart,
				overlappingVisit.scheduledEnd,
			)
		) {
			warnings.push({
				code: 'OVERLAPPING_VISIT',
				message: `${carer.organizationUser.user.firstName} ${carer.organizationUser.user.lastName} already has another overlapping visit.`,
				relatedVisit: {
					id: overlappingVisit.id,
					patientId: overlappingVisit.patientId,
					patientName: `${overlappingVisit.patient.firstName} ${overlappingVisit.patient.lastName}`,
					scheduledStart: overlappingVisit.scheduledStart,
					scheduledEnd: overlappingVisit.scheduledEnd,
					status: overlappingVisit.status,
				},
			});
		}
	}

	if (
		carer.availabilitySlots.length === 0 ||
		!isVisitCoveredByAvailability(
			visit.scheduledStart,
			visit.scheduledEnd,
			carer.availabilitySlots,
		)
	) {
		warnings.push({
			code: 'OUTSIDE_AVAILABILITY',
			message: `${carer.organizationUser.user.firstName} ${carer.organizationUser.user.lastName} is not fully available for this visit according to their weekly availability.`,
		});
	}

	return {
		visit: {
			id: visit.id,
			patientId: visit.patientId,
			patientName: `${visit.patient.firstName} ${visit.patient.lastName}`,
			scheduledStart: visit.scheduledStart,
			scheduledEnd: visit.scheduledEnd,
			status: visit.status,
		},
		carer: {
			id: carer.id,
			firstName: carer.organizationUser.user.firstName,
			lastName: carer.organizationUser.user.lastName,
		},
		warnings,
	};
}

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
	visits: Array<
		VisitRecord & {
			patient: { id: string; firstName: string; lastName: string };
			assignments: Array<{
				id: string;
				isActive: boolean;
				carer: {
					id: string;
					organizationUser: {
						user: { firstName: string; lastName: string };
					};
				};
			}>;
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
				patient: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
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
										user: {
											select: {
												firstName: true,
												lastName: true,
											},
										},
									},
								},
							},
						},
					},
				},
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
		data.actualStart = input.actualStart ? new Date(input.actualStart) : null;
	if (input.actualEnd !== undefined)
		data.actualEnd = input.actualEnd ? new Date(input.actualEnd) : null;
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

export async function getVisitAssignmentPreviewService(
	organizationId: string,
	visitId: string,
	carerId: string,
) {
	return buildVisitAssignmentWarnings(organizationId, visitId, carerId);
}

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
	assignedById: string;
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
		data: { isActive: false, unassignedAt: new Date() },
	});
	return { message: 'Carer unassigned successfully' };
}
