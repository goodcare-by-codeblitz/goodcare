import { prisma } from '@repo/db';
import { NotFoundError } from '../../lib/errors';
import type {
	CreateMedicationAdministrationBody,
	CreateMedicationBody,
	MedicationListQuery,
	UpdateMedicationBody,
} from './medication.types';

const db = prisma as any;

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

async function ensurePatient(organizationId: string, patientId: string) {
	const patient = await prisma.patient.findFirst({
		where: { id: patientId, organizationId, deletedAt: null },
		select: { id: true },
	});

	if (!patient) {
		throw new NotFoundError('Patient not found');
	}
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
		select: {
			id: true,
			medicationId: true,
			patientId: true,
			organizationId: true,
			result: true,
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
		},
		orderBy: [{ administeredAt: 'desc' }, { createdAt: 'desc' }],
	});

	return { administrations };
}

export async function createMedicationAdministrationService(
	organizationId: string,
	patientId: string,
	medicationId: string,
	actorUserId: string,
	input: CreateMedicationAdministrationBody,
): Promise<MedicationAdministrationRecord> {
	await ensureMedication(organizationId, patientId, medicationId);

	return db.medicationAdministration.create({
		data: {
			organizationId,
			patientId,
			medicationId,
			result: input.result,
			scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
			administeredAt: input.administeredAt
				? new Date(input.administeredAt)
				: input.result === 'GIVEN'
					? new Date()
					: null,
			notes: input.notes ?? null,
			actorUserId,
		},
		select: {
			id: true,
			medicationId: true,
			patientId: true,
			organizationId: true,
			result: true,
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
		},
	});
}
