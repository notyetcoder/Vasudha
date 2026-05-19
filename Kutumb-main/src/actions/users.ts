
'use server';

import type { User, ActionResponse } from '@/lib/types';
import { revalidateTag } from 'next/cache';
import {
  createPublicClient,
  createUser as dbCreateUser,
  updateUser as dbUpdateUser,
  deleteUser as dbDeleteUser,
  getAllUsersForAdmin as dbGetAllUsersForAdmin,
  linkSpouses as dbLinkSpouses,
  unlinkSpouses as dbUnlinkSpouses,
  bulkDeleteUsers as dbBulkDeleteUsers,
  updateDeceasedStatus as dbUpdateDeceasedStatus,
  clearRelation as dbClearRelation,
  getAllUsersForPublic as dbGetAllUsersForPublic,
  getUserById as dbGetUserById,
} from '@/lib/data';
import { findChildren as dbFindChildren, findSiblings as dbFindSiblings } from '@/lib/server-utils';
import type { SupabaseClient } from '@supabase/supabase-js';

// Centralized revalidation function for consistency
function revalidateUsersCache() {
  revalidateTag('users');
  revalidateTag('profiles');
}

const getFinalValue = (selectValue?: string, otherValue?: string) => {
    return selectValue === 'OTHER' ? (otherValue || '').trim().toUpperCase() : selectValue || '';
};

export const getAllUsersForPublic = async (page: number = 1, pageSize: number = 50): Promise<{ users: User[], total: number }> => {
    return await dbGetAllUsersForPublic(page, pageSize);
};

export async function createUser(data: any): Promise<ActionResponse> {
  try {
    const finalMaidenName = getFinalValue(data.maidenName, data.maidenNameOther);
    const finalSurname = getFinalValue(data.surname, data.surnameOther);
    const finalDescription = getFinalValue(data.description, data.descriptionOther);
    const finalFamily = getFinalValue(data.family, data.familyOther);

    const payload: Omit<User, 'id'> = {
      ...data,
      maidenName: finalMaidenName,
      surname: finalSurname || finalMaidenName,
      description: finalDescription,
      family: finalFamily,
      profilePictureUrl: data.profilePictureUrl || null,
      fatherName: data.fatherId ? null : (data.fatherName || '').split(' ')[0],
      motherName: data.motherId ? null : (data.motherName || '').split(' ')[0],
      spouseName: data.spouseId ? null : (data.spouseName || '').split(' ')[0],
    };
    
    // Remove temporary "Other" fields that don't exist in the DB
    delete (payload as any).maidenNameOther;
    delete (payload as any).surnameOther;
    delete (payload as any).descriptionOther;
    delete (payload as any).familyOther;

    const result = await dbCreateUser(payload);
    if (result.success) {
      revalidateUsersCache();
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error('Create user failed:', error);
    return { success: false, message };
  }
}

export async function getAllUsersForAdmin(page: number = 1, pageSize: number = 50): Promise<{ users: User[], total: number }> {
  try {
    const { users, total } = await dbGetAllUsersForAdmin(page, pageSize);
    return { users, total };
  } catch (error) {
    console.error("Failed to fetch all users:", error);
    return { users: [], total: 0 };
  }
}

export async function updateUserAction(user: User): Promise<ActionResponse> {
  try {
    // Fetch only the specific users we need by their IDs — no bulk fetch
    const [father, mother, spouse] = await Promise.all([
      user.fatherId ? dbGetUserById(user.fatherId) : Promise.resolve(null),
      user.motherId ? dbGetUserById(user.motherId) : Promise.resolve(null),
      user.spouseId ? dbGetUserById(user.spouseId) : Promise.resolve(null),
    ]);

    const payload: User = {
        ...user,
        fatherName: father ? father.name : (user.fatherId ? null : user.fatherName),
        motherName: mother ? mother.name : (user.motherId ? null : user.motherName),
        spouseName: spouse ? spouse.name : (user.spouseId ? null : user.spouseName),
    };

    const result = await dbUpdateUser(payload);
    if (result.success) {
      revalidateUsersCache();
    }
    return result;
  } catch (error) {
    console.error('Update user failed:', error);
    const message = error instanceof Error ? error.message : "Failed to update user.";
    return { success: false, message };
  }
}

export async function linkSpousesAction(userId1: string, userId2: string): Promise<ActionResponse> {
  try {
    // Fetch only the two users we need
    const [user1, user2] = await Promise.all([
      dbGetUserById(userId1),
      dbGetUserById(userId2),
    ]);

    if (!user1 || !user2) {
        return { success: false, message: "One or both users not found." };
    }
    
    if (user1.spouseId && user1.spouseId !== user2.id) {
        return { success: false, message: `${user1.name} is already linked to another spouse. Please unlink them first.` };
    }
    if (user2.spouseId && user2.spouseId !== user1.id) {
        return { success: false, message: `${user2.name} is already linked to another spouse. Please unlink them first.` };
    }

    const result = await dbLinkSpouses(userId1, userId2);
    if (result.success) {
      revalidateUsersCache();
    }
    return result;
  } catch (error) {
    console.error('Link spouses failed:', error);
    const message = error instanceof Error ? error.message : "Failed to link spouses.";
    return { success: false, message };
  }
}

export async function unlinkSpousesAction(userId: string): Promise<ActionResponse> {
    try {
        const result = await dbUnlinkSpouses(userId);
        if (result.success) {
            revalidateUsersCache();
        }
        return result;
    } catch (error) {
        console.error('Unlink spouses failed:', error);
        const message = error instanceof Error ? error.message : "Failed to unlink spouses.";
        return { success: false, message };
    }
}


export async function deleteUserAction(id: string): Promise<ActionResponse> {
  try {
    const result = await dbDeleteUser(id);
    if (result.success) {
      revalidateUsersCache();
    }
    return result;
  } catch (error) {
    console.error('Delete user action failed:', error);
    const message = error instanceof Error ? error.message : "Failed to delete user.";
    return { success: false, message };
  }
}

export async function bulkDeleteUsersAction(ids: string[]): Promise<ActionResponse> {
  try {
    const result = await dbBulkDeleteUsers(ids);
    if (result.success) {
      revalidateUsersCache();
    }
    return result;
  }
 catch
 {
    console.error('Bulk delete failed:');
    const message = "Bulk delete failed.";
    return { success: false, message };
  }
}

export async function updateDeceasedStatusAction(userIds: string[], isDeceased: boolean): Promise<ActionResponse> {
  try {
    const result = await dbUpdateDeceasedStatus(userIds, isDeceased);
    if (result.success) {
        revalidateUsersCache();
    }
    return result;
  } catch (error) {
    console.error('Update deceased status action failed:', error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}

export async function clearRelationAction(userId: string, relation: 'father' | 'mother'): Promise<ActionResponse> {
    try {
        const result = await dbClearRelation(userId, relation);
        if (result.success) {
            revalidateUsersCache();
        }
        return result;
    } catch (error) {
        console.error(`Clear ${relation} action failed:`, error);
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        return { success: false, message };
    }
}

export async function findChildrenAction(parentId: string): Promise<User[]> {
  try {
    const users = await dbFindChildren(parentId);
    return users;
  } catch (error) {
    console.error(`Failed to fetch children for parent ${parentId}:`, error);
    return [];
  }
}

export async function findSiblingsAction(user: User): Promise<User[]> {
  try {
    const users = await dbFindSiblings(user);
    return users;
  } catch (error) {
    console.error(`Failed to fetch siblings for user ${user.id}:`, error);
    return [];
  }
}


