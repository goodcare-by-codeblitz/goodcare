import { prisma } from '@repo/db';
import { NotFoundError } from '../../lib/errors';
import type {
	CreateMedicationAdministrationBody,
	CreateMedicationBody,
	MedicationListQuery,
	MedicationMarQuery,
	MedicationScheduleSlot,
	UpdateMedicationBody,
} from './medication.types';

const db = prisma as any;

const scheduleSlotOrder = [
	'morning',
	'noon',
	'evening',
	'night',
	'bedtime',
] as const satisfies readonly MedicationScheduleSlot[];

const slotToDbValue: Record<MedicationScheduleSlot, string> = {
	morning: 'MORNING',
	noon: 'NOON',
	evening: 'EVENING',
	night: 'NIGHT',
	bedtime: 'BEDTIME',
};

type MedicationRecord = {
	id: string;
	patientId: string;
	organizationId: string;
	name: string;
	doseAmount: string;
	doseUnit: string;
	route: string;
	frequency: string;
	schedule: {
		morning: boolean;
		noon: boolean;
		evening: boolean;
		night: boolean;
		bedtime: boolean;
	};
	startDate: Date;
	endDate: Date | null;
	prescriber: string;
	instructions: string;
	status: string;
	prnIndication: string | null;
	prnMaxDose: string | null;
	createdAt: Date;
	updatedAt: Date;
	patient: { id: string; firstName: string; lastName: string };
};

type MedicationAdministrationRecord = {
	id: string;
	medicationId: string;
	patientId: string;
	organizationId: string;
	result: string;
	slot: MedicationScheduleSlot | null;
	scheduledFor: Date | null;
	administeredAt: Date | null;
	notes: string | null;
	actorUser: { firstName: string; lastName: string; email: string } | null;
	createdAt: Date;
	updatedAt: Date;
};

function medicationSelect() {
	return {
		id: true,
		patientId: true,
		organizationId: true,
		name: true,
		doseAmount: true,
		doseUnit: true,
		route: true,
		frequency: true,
		morning: true,
		noon: true,
		evening: true,
		night: true,
		bedtime: true,
		startDate: true,
		endDate: true,
		prescriber: true,
		instructions: true,
		status: true,
		prnIndication: true,
		prnMaxDose: true,
		createdAt: true,
		updatedAt: true,
		patient: { select: { id: true, firstName: true, lastName: true } },
	};
}

function mapMedication(record: any): MedicationRecord {
	const resolved = record as MedicationRecord & {
		morning: boolean;
		noon: boolean;
		evening: boolean;
		night: boolean;
		bedtime: boolean;
	};

	return {
		id: resolved.id,
		patientId: resolved.patientId,
		organizationId: resolved.organizationId,
		name: resolved.name,
		doseAmount: resolved.doseAmount,
		doseUnit: resolved.doseUnit,
		route: resolved.route,
		frequency: resolved.frequency,
		schedule: {
			morning: resolved.morning,
			noon: resolved.noon,
			evening: resolved.evening,
			night: resolved.night,
			bedtime: resolved.bedtime,
		},
		startDate: resolved.startDate,
		endDate: resolved.endDate,
		prescriber: resolved.prescriber,
		instructions: resolved.instructions,
		status: resolved.status,
		prnIndication: resolved.prnIndication,
		prnMaxDose: resolved.prnMaxDose,
		createdAt: resolved.createdAt,
		updatedAt: resolved.updatedAt,
		patient: resolved.patient,
	};
}

function mapAdministration(record: any): MedicationAdministrationRecord {
	return {
		id: record.id,
		medicationId: record.medicationId,
		patientId: record.patientId,
		organizationId: record.organizationId,
		result: record.result,
		slot: record.slot
			? (String(record.slot).toLowerCase() as MedicationScheduleSlot)
			: null,
		scheduledFor: record.scheduledFor,
		administeredAt: record.administeredAt,
		notes: record.notes,
		actorUser: record.actorUser,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	};
}

function parseDateOnly(date: string) {
	return new Date(`${date}T00:00:00.000Z`);
}

function addDays(date: Date, days: number) {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

function formatDateKey(date: Date) {
	return date.toISOString().slice(0, 10);
}

function formatDayLabel(date: Date, view: 'daily' | 'monthly') {
	return date.toLocaleDateString('en-GB', {
		timeZone: 'UTC',
		weekday: view === 'daily' ? 'long' : undefined,
		day: 'numeric',
		month: 'short',
	});
}

function getRangeForMar(view: 'daily' | 'monthly', date: string) {
	const base = parseDateOnly(date);
	if (view === 'daily') {
		const end = addDays(base, 1);
		return {
			rangeStart: base,
			rangeEnd: end,
			days: [base],
		};
	}

	const monthStart = new Date(
		Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1),
	);
	const monthEnd = new Date(
		Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 1),
	);
	const days: Date[] = [];
	for (let cursor = new Date(monthStart); cursor < monthEnd; cursor = addDays(cursor, 1)) {
		days.push(new Date(cursor));
	}

	return {
		rangeStart: monthStart,
		rangeEnd: monthEnd,
		days,
	};
}

function administrationEffectiveDate(administration: MedicationAdministrationRecord) {
	return (
		administration.scheduledFor ??
		administration.administeredAt ??
		administration.createdAt
	);
}

function deriveSlotFromTime(date: Date) {
	const hour = date.getUTCHours();
	if (hour < 10) return 'morning';
	if (hour < 14) return 'noon';
	if (hour < 18) return 'evening';
	if (hour < 22) return 'night';
	return 'bedtime';
}

function resolveAdministrationSlot(
	administration: MedicationAdministrationRecord,
	medication: MedicationRecord,
): MedicationScheduleSlot | null {
	if (administration.slot) {
		return administration.slot;
	}

	const enabledSlots = scheduleSlotOrder.filter((slot) => medication.schedule[slot]);
	if (enabledSlots.length === 1) {
		return enabledSlots[0] ?? null;
	}

	const effectiveDate = administrationEffectiveDate(administration);
	return effectiveDate ? deriveSlotFromTime(effectiveDate) : null;
}

function isMedicationScheduledForSlot(
	medication: MedicationRecord,
	day: Date,
	slot: MedicationScheduleSlot,
) {
	const dayKey = formatDateKey(day);
	const startKey = formatDateKey(medication.startDate);
	const endKey = medication.endDate ? formatDateKey(medication.endDate) : null;
	if (dayKey < startKey) {
		return false;
	}
	if (endKey && dayKey > endKey) {
		return false;
	}
	if (medication.status === 'DISCONTINUED') {
		return false;
	}

	return medication.schedule[slot];
}

async function ensurePatient(organizationId: string, patientId: string) {
	const patient = await prisma.patient.findFirst({
		where: { id: patientId, organizationId, deletedAt: null },
		select: {
			id: true,
			firstName: true,
			lastName: true,
		},
	});

	if (!patient) {
		throw new NotFoundError('Patient not found');
	}

	return patient;
}

async function ensureMedication(
	organizationId: string,
	patientId: string,
	medicationId: string,
) {
	const medication = await db.medication.findFirst({
		where: {
			id: medicationId,
			patientId,
			organizationId,
			deletedAt: null,
		},
		select: medicationSelect(),
	});

	if (!medication) {
		throw new NotFoundError('Medication not found');
	}

	return medication;
}

function administrationSelect() {
	return {
		id: true,
		medicationId: true,
		patientId: true,
		organizationId: true,
		result: true,
		slot: true,
		scheduledFor: true,
		administeredAt: true,
		notes: true,
		createdAt: true,
		updatedAt: true,
		actorUser: {
			select: {
				firstName: true,
				lastName: true,
				email: true,
			},
		},
	};
}

export async function listMedicationsService(
	organizationId: string,
	query: MedicationListQuery,
): Promise<{
	medications: MedicationRecord[];
	pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
	const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
	const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
	const skip = (page - 1) * limit;

	const where: Record<string, unknown> = { organizationId, deletedAt: null };
	if (query.patientId) {
		where.patientId = query.patientId;
	}
	if (query.status) {
		where.status = query.status;
	}
	if (query.search) {
		where.OR = [
			{ name: { contains: query.search, mode: 'insensitive' } },
			{
				patient: {
					OR: [
						{ firstName: { contains: query.search, mode: 'insensitive' } },
						{ lastName: { contains: query.search, mode: 'insensitive' } },
					],
				},
			},
		];
	}

	const [medications, total] = await Promise.all([
		db.medication.findMany({
			where,
			select: medicationSelect(),
			orderBy: [{ patient: { lastName: 'asc' } }, { name: 'asc' }],
			skip,
			take: limit,
		}),
		db.medication.count({ where }),
	]);

	return {
		medications: medications.map((medication: any) => mapMedication(medication)),
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

export async function createMedicationService(
	organizationId: string,
	patientId: string,
	input: CreateMedicationBody,
): Promise<MedicationRecord> {
	await ensurePatient(organizationId, patientId);

	const medication = await db.medication.create({
		data: {
			organizationId,
			patientId,
			name: input.name,
			doseAmount: input.doseAmount,
			doseUnit: input.doseUnit,
			route: input.route,
			frequency: input.frequency,
			morning: input.schedule?.morning ?? false,
			noon: input.schedule?.noon ?? false,
			evening: input.schedule?.evening ?? false,
			night: input.schedule?.night ?? false,
			bedtime: input.schedule?.bedtime ?? false,
			startDate: new Date(input.startDate),
			endDate: input.endDate ? new Date(input.endDate) : null,
			prescriber: input.prescriber,
			instructions: input.instructions,
			status: input.status ?? 'ACTIVE',
			prnIndication: input.prnIndication ?? null,
			prnMaxDose: input.prnMaxDose ?? null,
		},
		select: medicationSelect(),
	});

	return mapMedication(medication);
}

export async function getMedicationService(
	organizationId: string,
	patientId: string,
	medicationId: string,
): Promise<MedicationRecord> {
	const medication = await ensureMedication(organizationId, patientId, medicationId);
	return mapMedication(medication);
}

export async function updateMedicationService(
	organizationId: string,
	patientId: string,
	medicationId: string,
	input: UpdateMedicationBody,
): Promise<MedicationRecord> {
	await ensureMedication(organizationId, patientId, medicationId);

	const data: Record<string, unknown> = {};
	if (input.name !== undefined) data.name = input.name;
	if (input.doseAmount !== undefined) data.doseAmount = input.doseAmount;
	if (input.doseUnit !== undefined) data.doseUnit = input.doseUnit;
	if (input.route !== undefined) data.route = input.route;
	if (input.frequency !== undefined) data.frequency = input.frequency;
	if (input.schedule !== undefined) {
		data.morning = input.schedule.morning ?? false;
		data.noon = input.schedule.noon ?? false;
		data.evening = input.schedule.evening ?? false;
		data.night = input.schedule.night ?? false;
		data.bedtime = input.schedule.bedtime ?? false;
	}
	if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
	if (input.endDate !== undefined) data.endDate = input.endDate ? new Date(input.endDate) : null;
	if (input.prescriber !== undefined) data.prescriber = input.prescriber;
	if (input.instructions !== undefined) data.instructions = input.instructions;
	if (input.status !== undefined) data.status = input.status;
	if (input.prnIndication !== undefined) data.prnIndication = input.prnIndication;
	if (input.prnMaxDose !== undefined) data.prnMaxDose = input.prnMaxDose;

	const medication = await db.medication.update({
		where: { id: medicationId },
		data,
		select: medicationSelect(),
	});

	return mapMedication(medication);
}

export async function deleteMedicationService(
	organizationId: string,
	patientId: string,
	medicationId: string,
): Promise<{ message: string }> {
	await ensureMedication(organizationId, patientId, medicationId);

	await db.medication.update({
		where: { id: medicationId },
		data: { deletedAt: new Date() },
	});

	return { message: 'Medication deleted successfully' };
}

export async function listMedicationAdministrationsService(
	organizationId: string,
	patientId: string,
	medicationId: string,
): Promise<{ administrations: MedicationAdministrationRecord[] }> {
	await ensureMedication(organizationId, patientId, medicationId);

	const administrations = await db.medicationAdministration.findMany({
		where: { organizationId, patientId, medicationId },
		select: administrationSelect(),
		orderBy: [{ administeredAt: 'desc' }, { createdAt: 'desc' }],
	});

	return {
		administrations: administrations.map((administration: any) =>
			mapAdministration(administration),
		),
	};
}

export async function createMedicationAdministrationService(
	organizationId: string,
	patientId: string,
	medicationId: string,
	actorUserId: string,
	input: CreateMedicationAdministrationBody,
): Promise<MedicationAdministrationRecord> {
	await ensureMedication(organizationId, patientId, medicationId);

	const administration = await db.medicationAdministration.create({
		data: {
			organizationId,
			patientId,
			medicationId,
			result: input.result,
			slot: input.slot ? slotToDbValue[input.slot] : null,
			scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
			administeredAt: input.administeredAt
				? new Date(input.administeredAt)
				: input.result === 'GIVEN'
					? new Date()
					: null,
			notes: input.notes ?? null,
			actorUserId,
		},
		select: administrationSelect(),
	});

	return mapAdministration(administration);
}

export async function getPatientMedicationMarService(
	organizationId: string,
	patientId: string,
	query: MedicationMarQuery,
) {
	const patient = await ensurePatient(organizationId, patientId);
	const view = query.view === 'monthly' ? 'monthly' : 'daily';
	const referenceDate = query.date ?? formatDateKey(new Date());
	const { rangeStart, rangeEnd, days } = getRangeForMar(view, referenceDate);

	const medications = (
		await db.medication.findMany({
			where: {
				organizationId,
				patientId,
				deletedAt: null,
				startDate: { lt: rangeEnd },
				OR: [{ endDate: null }, { endDate: { gte: rangeStart } }],
			},
			select: medicationSelect(),
			orderBy: [{ name: 'asc' }],
		})
	).map((medication: any) => mapMedication(medication));

	const administrations = (
		await db.medicationAdministration.findMany({
			where: {
				organizationId,
				patientId,
				OR: [
					{
						scheduledFor: {
							gte: rangeStart,
							lt: rangeEnd,
						},
					},
					{
						administeredAt: {
							gte: rangeStart,
							lt: rangeEnd,
						},
					},
					{
						AND: [
							{ scheduledFor: null },
							{ administeredAt: null },
							{
								createdAt: {
									gte: rangeStart,
									lt: rangeEnd,
								},
							},
						],
					},
				],
			},
			select: administrationSelect(),
			orderBy: [{ administeredAt: 'desc' }, { createdAt: 'desc' }],
		})
	).map((administration: any) => mapAdministration(administration));

	const daysMeta = days.map((day) => ({
		key: formatDateKey(day),
		label: formatDayLabel(day, view),
		dayOfMonth: day.getUTCDate(),
		isToday: formatDateKey(day) === formatDateKey(new Date()),
	}));

	const rows = medications.map((medication: MedicationRecord) => {
		const cells: Record<
			string,
			Partial<
				Record<
					MedicationScheduleSlot,
					{
						status:
							| 'GIVEN'
							| 'MISSED'
							| 'REFUSED'
							| 'NA'
							| 'DUE'
							| 'NOT_SCHEDULED';
						administration: MedicationAdministrationRecord | null;
					}
				>
			>
		> = {};

		for (const day of days) {
			const dayKey = formatDateKey(day);
			cells[dayKey] = {};
			for (const slot of scheduleSlotOrder) {
				cells[dayKey]![slot] = {
					status: isMedicationScheduledForSlot(medication, day, slot)
						? 'DUE'
						: 'NOT_SCHEDULED',
					administration: null,
				};
			}
		}

		const medicationAdministrations = administrations.filter(
			(administration: MedicationAdministrationRecord) =>
				administration.medicationId === medication.id,
		);

		for (const administration of medicationAdministrations) {
			const slot = resolveAdministrationSlot(administration, medication);
			if (!slot) {
				continue;
			}

			const effectiveDate = administrationEffectiveDate(administration);
			if (!effectiveDate) {
				continue;
			}

			const dayKey = formatDateKey(effectiveDate);
			if (!cells[dayKey]?.[slot]) {
				continue;
			}

			cells[dayKey]![slot] = {
				status: administration.result as 'GIVEN' | 'MISSED' | 'REFUSED' | 'NA',
				administration,
			};
		}

		return {
			medication,
			cells,
		};
	});

	return {
		patient,
		view,
		referenceDate,
		slots: scheduleSlotOrder,
		days: daysMeta,
		rows,
		history: administrations,
	};
}
