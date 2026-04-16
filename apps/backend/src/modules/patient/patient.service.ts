import { prisma } from '@repo/db';
import { NotFoundError } from '../../lib/errors';
import type { CreatePatientBody, PatientListQuery, UpdatePatientBody } from './patient.types';

type PatientRecord = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  genderDescription: string | null;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
};

export async function createPatientService(
  organizationId: string,
  input: CreatePatientBody,
): Promise<Omit<PatientRecord, 'updatedAt'>> {
  return prisma.patient.create({
    data: {
      organizationId,
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: new Date(input.dateOfBirth),
      gender: input.gender ?? 'NOT_SPECIFIED',
      genderDescription: input.genderDescription ?? null,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      gender: true,
      genderDescription: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function listPatientsService(
  organizationId: string,
  query: PatientListQuery,
): Promise<{
  patients: Array<Omit<PatientRecord, 'genderDescription' | 'updatedAt'>>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    organizationId,
    deletedAt: null,
  };

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ]);

  return {
    patients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPatientService(
  organizationId: string,
  patientId: string,
): Promise<PatientRecord & { updatedAt: Date }> {
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      gender: true,
      genderDescription: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!patient) throw new NotFoundError('Patient not found');
  return patient;
}

export async function updatePatientService(
  organizationId: string,
  patientId: string,
  input: UpdatePatientBody,
): Promise<Omit<PatientRecord, 'createdAt'> & { updatedAt: Date }> {
  const existing = await prisma.patient.findFirst({
    where: { id: patientId, organizationId, deletedAt: null },
    select: { id: true },
  });

  if (!existing) throw new NotFoundError('Patient not found');

  const data: Record<string, unknown> = {};
  if (input.firstName !== undefined) data.firstName = input.firstName;
  if (input.lastName !== undefined) data.lastName = input.lastName;
  if (input.dateOfBirth !== undefined) data.dateOfBirth = new Date(input.dateOfBirth);
  if (input.gender !== undefined) data.gender = input.gender;
  if (input.genderDescription !== undefined) data.genderDescription = input.genderDescription;
  if (input.status !== undefined) data.status = input.status;

  return prisma.patient.update({
    where: { id: patientId },
    data,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      gender: true,
      genderDescription: true,
      status: true,
      updatedAt: true,
    },
  });
}

export async function deletePatientService(
  organizationId: string,
  patientId: string,
): Promise<{ message: string }> {
  const existing = await prisma.patient.findFirst({
    where: { id: patientId, organizationId, deletedAt: null },
    select: { id: true },
  });

  if (!existing) throw new NotFoundError('Patient not found');

  await prisma.patient.update({
    where: { id: patientId },
    data: { deletedAt: new Date() },
  });

  return { message: 'Patient deleted successfully' };
}
