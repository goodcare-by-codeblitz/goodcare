export type MedicationStatus = 'ACTIVE' | 'PRN' | 'DISCONTINUED';

export type MedicationAdministrationResult =
	| 'GIVEN'
	| 'MISSED'
	| 'REFUSED'
	| 'NA';

export type MedicationScheduleSlot =
	| 'morning'
	| 'noon'
	| 'evening'
	| 'night'
	| 'bedtime';

export type MedicationScheduleInput = {
	morning?: boolean | undefined;
	noon?: boolean | undefined;
	evening?: boolean | undefined;
	night?: boolean | undefined;
	bedtime?: boolean | undefined;
};

export type CreateMedicationBody = {
	name: string;
	doseAmount: string;
	doseUnit: string;
	route: string;
	frequency: string;
	schedule?: MedicationScheduleInput | undefined;
	startDate: string;
	endDate?: string | undefined;
	prescriber: string;
	instructions: string;
	status?: MedicationStatus | undefined;
	prnIndication?: string | undefined;
	prnMaxDose?: string | undefined;
};

export type UpdateMedicationBody = Partial<CreateMedicationBody>;

export type MedicationListQuery = {
	page?: string | undefined;
	limit?: string | undefined;
	patientId?: string | undefined;
	search?: string | undefined;
	status?: MedicationStatus | undefined;
};

export type CreateMedicationAdministrationBody = {
	result: MedicationAdministrationResult;
	slot?: MedicationScheduleSlot | undefined;
	scheduledFor?: string | undefined;
	administeredAt?: string | undefined;
	notes?: string | undefined;
};

export type MedicationMarQuery = {
	view?: 'daily' | 'monthly' | undefined;
	date?: string | undefined;
};
