
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

export interface Story {
    id: string;
    user_id: string;
    content: string;
    author_id: string;
    created_at: string;
    updated_at: string;
}

export interface Admin {
    id: string;
    username: string;
    password_hash: string;
}

export type ActionResponse = {
  success: boolean;
  message?: string;
  userId?: string;
};

    