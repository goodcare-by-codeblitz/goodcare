export type CreateDailyNoteBody = {
	visitId: string;
	carerId: string;
	notes: string;
};

export type UpdateDailyNoteBody = {
	notes?: string | undefined;
};

export type DailyNoteListQuery = {
	page?: string | undefined;
	limit?: string | undefined;
	visitId?: string | undefined;
	carerId?: string | undefined;
};
