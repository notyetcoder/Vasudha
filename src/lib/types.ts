
export interface User {
    id: string;
    surname: string; // Current surname
    maidenName: string; // Surname at birth
    name: string;
    family: string; // The primary family group (MATA, CHHANGA, VARCHAND)
    gender: 'male' | 'female';
    maritalStatus: 'single' | 'married';
    fatherId?: string;
    motherId?: string;
    spouseId?: string;
    // The string names are now used for unlinked relatives pending admin connection
    fatherName?: string;
    motherName?: string;
    spouseName?: string;
    birthMonth?: string;
    birthYear?: string;
    profilePictureUrl: string;
    description: string;
    status: 'pending' | 'approved' | 'deleted';
    deletedAt?: string; // ISO string format for when the user was moved to dustbin
    isDeceased?: boolean;
    deathDate?: string; // ISO string format for date of passing
}

export interface AdminUser {
    id: string; // This will be the Firebase Auth UID
    name: string;
    username: string;
    email?: string;
    password?: string; // Only used during creation, not stored in Firestore
    role: 'super-admin' | 'editor';
    createdAt?: string; // Should be a string for client components
    permissions?: {
        access: 'all' | 'specific';
        surnames: string[];
        families: { [key: string]: string[] };
    };
}
