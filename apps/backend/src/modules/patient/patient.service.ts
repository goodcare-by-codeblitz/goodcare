import { prisma } from '@repo/db';
import { NotFoundError } from '../../lib/errors';
import type {
  CreatePatientBody,
  PatientListQuery,
  PatientProfileAggregate,
  UpdatePatientBody,
  UpdatePatientProfileBody,
} from './patient.types';

const db = prisma as any;

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === 'P2021' ||
    (typeof candidate.message === 'string' &&
      candidate.message.includes('does not exist in the current database'))
  );
}

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

  if (query.status) {
    where.status = query.status;
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

export async function getPatientProfileService(
  organizationId: string,
  patientId: string,
): Promise<PatientProfileAggregate> {
  try {
    const patient = await db.patient.findFirst({
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
        address: {
          select: {
            line1: true,
            line2: true,
            city: true,
            postcode: true,
            country: true,
          },
        },
        emergencyContacts: {
          select: {
            id: true,
            name: true,
            relationship: true,
            phone: true,
            email: true,
            isPrimary: true,
          },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        allergies: {
          select: {
            id: true,
            name: true,
            notes: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        profile: {
          select: {
            medicalSummary: true,
            careRequirements: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    return {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      genderDescription: patient.genderDescription,
      status: patient.status,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      address: patient.address,
      emergencyContacts: patient.emergencyContacts,
      allergies: patient.allergies,
      medicalSummary: patient.profile?.medicalSummary ?? null,
      careRequirements: patient.profile?.careRequirements ?? null,
    };
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }

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
        address: {
          select: {
            line1: true,
            line2: true,
            city: true,
            postcode: true,
            country: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    return {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      genderDescription: patient.genderDescription,
      status: patient.status,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      address: patient.address,
      emergencyContacts: [],
      allergies: [],
      medicalSummary: null,
      careRequirements: null,
    };
  }
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

export async function updatePatientProfileService(
  organizationId: string,
  patientId: string,
  input: UpdatePatientProfileBody,
): Promise<PatientProfileAggregate> {
  const existingPatient = await prisma.patient.findFirst({
    where: { id: patientId, organizationId, deletedAt: null },
    select: { id: true, addressId: true },
  });

  if (!existingPatient) {
    throw new NotFoundError('Patient not found');
  }

  await prisma.$transaction(async (tx) => {
    const txDb = tx as any;

    if (input.address !== undefined) {
      if (input.address === null) {
        await txDb.patient.update({
          where: { id: patientId },
          data: { addressId: null },
        });
      } else if (existingPatient.addressId) {
        await txDb.address.update({
          where: { id: existingPatient.addressId },
          data: {
            line1: input.address.line1,
            line2: input.address.line2 ?? null,
            city: input.address.city,
            postcode: input.address.postcode,
            country: input.address.country,
          },
        });
      } else {
        const address = await txDb.address.create({
          data: {
            line1: input.address.line1,
            line2: input.address.line2 ?? null,
            city: input.address.city,
            postcode: input.address.postcode,
            country: input.address.country,
          },
          select: { id: true },
        });

        await txDb.patient.update({
          where: { id: patientId },
          data: { addressId: address.id },
        });
      }
    }

    if (
      input.medicalSummary !== undefined ||
      input.careRequirements !== undefined
    ) {
      await txDb.patientProfile.upsert({
        where: { patientId },
        update: {
          ...(input.medicalSummary !== undefined
            ? { medicalSummary: input.medicalSummary ?? null }
            : {}),
          ...(input.careRequirements !== undefined
            ? { careRequirements: input.careRequirements ?? null }
            : {}),
        },
        create: {
          patientId,
          organizationId,
          medicalSummary: input.medicalSummary ?? null,
          careRequirements: input.careRequirements ?? null,
        },
      });
    }

    if (input.emergencyContacts !== undefined) {
      await txDb.patientEmergencyContact.deleteMany({
        where: { patientId, organizationId },
      });

      if (input.emergencyContacts.length > 0) {
        await txDb.patientEmergencyContact.createMany({
          data: input.emergencyContacts.map((contact, index) => ({
            patientId,
            organizationId,
            name: contact.name,
            relationship: contact.relationship,
            phone: contact.phone,
            email: contact.email ?? null,
            isPrimary:
              contact.isPrimary ?? index === 0,
          })),
        });
      }
    }

    if (input.allergies !== undefined) {
      await txDb.patientAllergy.deleteMany({
        where: { patientId, organizationId },
      });

      if (input.allergies.length > 0) {
        await txDb.patientAllergy.createMany({
          data: input.allergies.map((allergy) => ({
            patientId,
            organizationId,
            name: allergy.name,
            notes: allergy.notes ?? null,
          })),
        });
      }
    }
  });

  return getPatientProfileService(organizationId, patientId);
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
