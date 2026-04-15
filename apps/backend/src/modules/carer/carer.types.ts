export type CreateCarerBody = {
	organizationUserId: string;
	hireDate: string;
	employmentType: string;
	experienceYears?: number | undefined;
	availability: string;
};

export type UpdateCarerBody = {
	hireDate?: string | undefined;
	employmentType?: string | undefined;
	experienceYears?: number | undefined;
	availability?: string | undefined;
	status?: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED' | undefined;
};

export type CarerListQuery = {
	page?: string | undefined;
	limit?: string | undefined;
	search?: string | undefined;
	status?: string | undefined;
};
