export type AvailabilitySlotInput = {
	startTime: string;
	endTime: string;
	crossesMidnight?: boolean | undefined;
};

export type WeeklyAvailabilityInput = {
	monday?: AvailabilitySlotInput[] | undefined;
	tuesday?: AvailabilitySlotInput[] | undefined;
	wednesday?: AvailabilitySlotInput[] | undefined;
	thursday?: AvailabilitySlotInput[] | undefined;
	friday?: AvailabilitySlotInput[] | undefined;
	saturday?: AvailabilitySlotInput[] | undefined;
	sunday?: AvailabilitySlotInput[] | undefined;
};

export type CreateCarerBody = {
	organizationUserId: string;
	hireDate: string;
	employmentType: string;
	experienceYears?: number | undefined;
	availability?: WeeklyAvailabilityInput | undefined;
};

export type UpdateCarerBody = {
	hireDate?: string | undefined;
	employmentType?: string | undefined;
	experienceYears?: number | undefined;
	availability?: WeeklyAvailabilityInput | undefined;
	status?: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED' | undefined;
};

export type CarerListQuery = {
	page?: string | undefined;
	limit?: string | undefined;
	search?: string | undefined;
	status?: string | undefined;
};
