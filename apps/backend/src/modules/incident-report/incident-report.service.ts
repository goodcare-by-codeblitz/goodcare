import { prisma } from '@repo/db';
import { NotFoundError } from '../../lib/errors';
import type { CreateIncidentReportBody, IncidentReportListQuery, UpdateIncidentReportBody } from './incident-report.types';

type IncidentReportRecord = {
	id: string;
	description: string;
	severity: string;
	status: string;
	patientId: string | null;
	visitId: string | null;
	reportedById: string;
	organizationId: string;
	createdAt: Date;
	updatedAt: Date;
};

export async function createIncidentReportService(
	organizationId: string, reportedById: string, input: CreateIncidentReportBody,
): Promise<IncidentReportRecord> {
	return prisma.incidentReport.create({
		data: {
			organizationId,
			reportedById,
			description: input.description,
			severity: input.severity,
			patientId: input.patientId ?? null,
			visitId: input.visitId ?? null,
		},
		select: {
			id: true, description: true, severity: true, status: true, patientId: true, visitId: true,
			reportedById: true, organizationId: true, createdAt: true, updatedAt: true,
		},
	});
}

export async function listIncidentReportsService(
	organizationId: string, query: IncidentReportListQuery,
): Promise<{ incidents: IncidentReportRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
	const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
	const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
	const skip = (page - 1) * limit;

	const where: Record<string, unknown> = { organizationId, deletedAt: null };
	if (query.status) where.status = query.status;
	if (query.severity) where.severity = query.severity;

	const [incidents, total] = await Promise.all([
		prisma.incidentReport.findMany({
			where,
			select: {
				id: true, description: true, severity: true, status: true, patientId: true, visitId: true,
				reportedById: true, organizationId: true, createdAt: true, updatedAt: true,
			},
			orderBy: { createdAt: 'desc' },
			skip,
			take: limit,
		}),
		prisma.incidentReport.count({ where }),
	]);

	return { incidents, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

type IncidentReportDetail = IncidentReportRecord & {
	reportedBy: { firstName: string; lastName: string; email: string };
};

export async function getIncidentReportService(organizationId: string, incidentId: string): Promise<IncidentReportDetail> {
	const incident = await prisma.incidentReport.findFirst({
		where: { id: incidentId, organizationId, deletedAt: null },
		select: {
			id: true, description: true, severity: true, status: true, patientId: true, visitId: true,
			reportedById: true, organizationId: true, createdAt: true, updatedAt: true,
			reportedBy: { select: { firstName: true, lastName: true, email: true } },
		},
	});
	if (!incident) throw new NotFoundError('Incident report not found');
	return incident;
}

export async function updateIncidentReportService(
	organizationId: string, incidentId: string, input: UpdateIncidentReportBody,
): Promise<IncidentReportRecord> {
	const existing = await prisma.incidentReport.findFirst({
		where: { id: incidentId, organizationId, deletedAt: null }, select: { id: true },
	});
	if (!existing) throw new NotFoundError('Incident report not found');

	const data: Record<string, unknown> = {};
	if (input.description !== undefined) data.description = input.description;
	if (input.severity !== undefined) data.severity = input.severity;
	if (input.status !== undefined) data.status = input.status;

	return prisma.incidentReport.update({
		where: { id: incidentId },
		data,
		select: {
			id: true, description: true, severity: true, status: true, patientId: true, visitId: true,
			reportedById: true, organizationId: true, createdAt: true, updatedAt: true,
		},
	});
}

export async function deleteIncidentReportService(organizationId: string, incidentId: string): Promise<{ message: string }> {
	const existing = await prisma.incidentReport.findFirst({
		where: { id: incidentId, organizationId, deletedAt: null }, select: { id: true },
	});
	if (!existing) throw new NotFoundError('Incident report not found');
	await prisma.incidentReport.update({ where: { id: incidentId }, data: { deletedAt: new Date() } });
	return { message: 'Incident report deleted successfully' };
}
