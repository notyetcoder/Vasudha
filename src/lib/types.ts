
export const Gender = {
    Male: 'male',
    Female: 'female',
} as const;
export type Gender = typeof Gender[keyof typeof Gender];

export const MaritalStatus = {
    Single: 'single',
    Married: 'married',
} as const;
export type MaritalStatus = typeof MaritalStatus[keyof typeof MaritalStatus];

export interface User {
    id: string;
    surname: string;
    maidenName: string;
    name: string;
    family?: string;
    gender: Gender;
    maritalStatus: MaritalStatus;
    fatherId?: string | null;
    motherId?: string | null;
    spouseId?: string | null;
    fatherName?: string | null;
    motherName?: string | null;
    spouseName?: string | null;
    birthMonth?: string;
    birthYear?: string;
    profilePictureUrl?: string | null;
    description?: string;
    isDeceased?: boolean;
    deathDate?: string;
    created_at?: string;
}

export type ActionResponse = {
  success: boolean;
  message?: string;
  userId?: string;
};

    
// ─── Form payload types ───────────────────────────────────────────────────────

/** Raw form data submitted from the registration/edit form before server processing */
export interface CreateUserPayload {
  name: string;
  surname?: string;
  maidenName: string;
  maidenNameOther?: string;
  surnameOther?: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  family?: string;
  familyOther?: string;
  description?: string;
  descriptionOther?: string;
  birthMonth?: string;
  birthYear?: string;
  profilePictureUrl?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
  spouseId?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  spouseName?: string | null;
  isDeceased?: boolean;
  deathDate?: string;
}
