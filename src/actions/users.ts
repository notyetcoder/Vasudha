
'use server';

import {
    addUser as addUserToDb,
    getUsers as getUsersFromDb,
    approveUser as approveUserInDb,
    unapproveUser as unapproveUserInDb,
    updateUser as updateUserInDb,
    deleteUser as deleteUserInDb,
    importUsers as importUsersInDb,
    permanentlyDeleteUser as permanentlyDeleteUserFromDb,
    recoverUser as recoverUserInDb,
    updateDeceasedStatus as updateDeceasedStatusInDb,
} from '@/lib/data';
import type { User } from '@/lib/types';

// The data type received from the public registration form or admin creation form
type UserDataFromForm = {
    surname: string;
    maidenName: string;
    name: string;
    family?: string;
    gender: 'male' | 'female';
    maritalStatus: 'single' | 'married';
    fatherName: string;
    motherName: string;
    spouseName?: string;
    description?: string;
    birthMonth?: string;
    birthYear?: string;
    fatherId?: string;
    motherId?: string;
    spouseId?: string;
    profilePictureUrl?: string; // This can now be a data URI
    isDeceased?: boolean;
};

export async function createUser(data: UserDataFromForm): Promise<{ success: boolean; message: string, userId?: string }> {
  try {
    const userForDb = {
        ...data,
        family: data.family || '',
        description: data.description || '',
        birthMonth: data.birthMonth || '',
        birthYear: data.birthYear || '',
        profilePictureUrl: data.profilePictureUrl || 'https://placehold.co/150x150.png',
        isDeceased: data.isDeceased || false,
    };
    const newUser = await addUserToDb(userForDb, 'pending');
    return { success: true, message: 'User registered successfully and is pending approval.', userId: newUser.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}

// adminCreateUser now creates an 'approved' user directly.
export async function adminCreateUser(data: UserDataFromForm): Promise<{ success: boolean; message: string, userId?: string }> {
  try {
    const userForDb = {
        ...data,
        family: data.family || '',
        description: data.description || '',
        birthMonth: data.birthMonth || '',
        birthYear: data.birthYear || '',
        profilePictureUrl: data.profilePictureUrl || 'https://placehold.co/150x150.png',
        isDeceased: data.isDeceased || false,
    };
    const newUser = await addUserToDb(userForDb, 'approved');
    return { success: true, message: 'User registered successfully and is now approved.', userId: newUser.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}


export async function getUsers(options?: { status: 'approved' | 'pending' | 'deleted' }): Promise<User[]> {
  return getUsersFromDb(options);
}

export async function approveUserAction(id: string): Promise<{ success: boolean }> {
    try {
        await approveUserInDb(id);
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function unapproveUserAction(id: string): Promise<{ success: boolean }> {
    try {
        await unapproveUserInDb(id);
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function updateUserAction(user: User): Promise<{ success: boolean }> {
    try {
        // No need to handle picture uploads here anymore, it's just data.
        await updateUserInDb(user.id, user);
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function deleteUserAction(id: string): Promise<{ success: boolean }> {
    try {
        // This is now a "soft delete"
        await deleteUserInDb(id);
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function permanentlyDeleteUserAction(id: string): Promise<{ success: boolean }> {
    try {
        await permanentlyDeleteUserFromDb(id);
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function recoverUserAction(id: string): Promise<{ success: boolean }> {
    try {
        await recoverUserInDb(id);
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function importUsersAction(newUsers: Omit<User, 'id'>[]): Promise<{ success: boolean; message: string }> {
    try {
        const count = await importUsersInDb(newUsers);
        return { success: true, message: `${count} users imported successfully.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        return { success: false, message: message };
    }
}

export async function updateDeceasedStatusAction(userIds: string[], isDeceased: boolean): Promise<{ success: boolean }> {
    try {
        await updateDeceasedStatusInDb(userIds, isDeceased);
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}
