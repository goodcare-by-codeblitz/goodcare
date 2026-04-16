export type CreatePatientBody = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_SPECIFIED' | undefined;
  genderDescription?: string | undefined;
};

export type UpdatePatientBody = {
  firstName?: string | undefined;
  lastName?: string | undefined;
  dateOfBirth?: string | undefined;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_SPECIFIED' | undefined;
  genderDescription?: string | undefined;
  status?: 'ACTIVE' | 'INACTIVE' | undefined;
};

export type PatientListQuery = {
  page?: string | undefined;
  limit?: string | undefined;
  search?: string | undefined;
};
