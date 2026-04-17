export type CreatePatientBody = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_SPECIFIED' | undefined;
  genderDescription?: string | undefined;
};

export type PatientAddressInput = {
  line1: string;
  line2?: string | null | undefined;
  city: string;
  postcode: string;
  country: string;
};

export type PatientEmergencyContactInput = {
  name: string;
  relationship: string;
  phone: string;
  email?: string | null | undefined;
  isPrimary?: boolean | undefined;
};

export type PatientAllergyInput = {
  name: string;
  notes?: string | null | undefined;
};

export type UpdatePatientBody = {
  firstName?: string | undefined;
  lastName?: string | undefined;
  dateOfBirth?: string | undefined;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_SPECIFIED' | undefined;
  genderDescription?: string | undefined;
  status?: 'ACTIVE' | 'INACTIVE' | undefined;
};

export type UpdatePatientProfileBody = {
  address?: PatientAddressInput | null | undefined;
  emergencyContacts?: PatientEmergencyContactInput[] | undefined;
  allergies?: PatientAllergyInput[] | undefined;
  medicalSummary?: string | null | undefined;
  careRequirements?: string | null | undefined;
};

export type PatientProfileAggregate = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  genderDescription: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    postcode: string;
    country: string;
  } | null;
  emergencyContacts: Array<{
    id: string;
    name: string;
    relationship: string;
    phone: string;
    email: string | null;
    isPrimary: boolean;
  }>;
  allergies: Array<{
    id: string;
    name: string;
    notes: string | null;
  }>;
  medicalSummary: string | null;
  careRequirements: string | null;
};

export type PatientListQuery = {
  page?: string | undefined;
  limit?: string | undefined;
  search?: string | undefined;
  status?: 'ACTIVE' | 'INACTIVE' | undefined;
};
