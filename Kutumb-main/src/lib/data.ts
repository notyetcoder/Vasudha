
import type { User, ActionResponse } from './types';
import { createServerClient, type CookieOptions, type SupabaseClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Buffer } from 'buffer';
import sharp from 'sharp';
import sanitizeHtml from 'sanitize-html';
import { Blob } from 'buffer';

export const createAdminClient = () => {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                get: (name: string) => cookieStore.get(name)?.value,
                set: (name: string, value: string, options: CookieOptions) => {
                    cookieStore.set({ name, value, ...options });
                },
                remove: (name: string, options: CookieOptions) => {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
};

// A dedicated client for anonymous operations, like public user registration.
// It uses the anon key and is necessary for RLS policies for anonymous users to work correctly.
const createAnonClient = () => {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get: (name: string) => cookieStore.get(name)?.value,
                set: (name: string, value: string, options: CookieOptions) => {
                    cookieStore.set({ name, value, ...options });
                },
                remove: (name: string, options: CookieOptions) => {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        }
    );
}

// A dedicated client for static generation that does not depend on cookies
const createStaticClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
            },
        }
    );
};

export const getAllUsersForPublic = async (page: number = 1, pageSize: number = 50): Promise<{ users: User[], total: number }> => {
    const supabasePublic = createStaticClient();
    const { data, error, count } = await supabasePublic
        .from('users')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
        console.error('Error fetching public users:', error);
        return { users: [], total: 0 };
    }
    return { users: data || [], total: count || 0 };
};

export const getPublicProfileData = async (): Promise<User[]> => {
    const supabasePublic = createStaticClient();
    const { data, error } = await supabasePublic
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching all users for profile page:', error);
        return [];
    }
    return data || [];
};


const generateUniqueId = async (supabaseAdmin: SupabaseClient): Promise<string> => {
    let newId: string;
    while (true) {
        newId = Math.random().toString(36).substring(2, 10).toUpperCase();
        const { data } = await supabaseAdmin.from('users').select('id').eq('id', newId).single();
        if (!data) break;
    }
    return newId;
};

const uploadProfilePicture = async (supabase: SupabaseClient, userId: string, dataUri: string): Promise<string> => {
    const bucketName = 'profile-pictures';

    const match = dataUri.match(/^data:image\/(png|jpeg);base64,(.*)$/);
    if (!match) {
        console.error("Server validation failed: Invalid data URI format. Expected image/png or image/jpeg.");
        throw new Error('Invalid data URI format received by server. Expected image/png or image/jpeg.');
    }
    
    const imageType = match[1]; // 'png' or 'jpeg'
    const base64Data = match[2];
    const sourceBuffer = Buffer.from(base64Data, 'base64');
    
    let processedBuffer;
    try {
        // Use sharp to resize and ensure it's a valid JPEG, but stop forcing WebP.
        processedBuffer = await sharp(sourceBuffer)
            .resize(400, 400, { fit: 'cover' })
            .jpeg({ quality: 85 }) // Convert to JPEG with good quality
            .toBuffer();
    } catch (sharpError) {
        console.error('Sharp image processing error:', sharpError);
        throw new Error('Failed to process image on the server.');
    }

    const filePath = `${userId}.jpeg`;
    const mimeType = 'image/jpeg';
    
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, processedBuffer, { contentType: mimeType, upsert: true });

    if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error(`Failed to upload picture: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    if (!data.publicUrl) {
        console.error('Could not get public URL for uploaded image.');
        throw new Error('Could not get public URL for the uploaded image.');
    }

    // Add a timestamp to bust caches
    return `${data.publicUrl}?t=${new Date().getTime()}`;
};


const sanitizeUser = (userData: Partial<User>): Partial<User> => {
    const sanitize = (text: string | undefined | null) => text ? sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }) : text;
    
    return {
        ...userData,
        name: sanitize(userData.name)!,
        surname: sanitize(userData.surname)!,
        maidenName: sanitize(userData.maidenName)!,
        family: sanitize(userData.family),
        description: sanitize(userData.description),
        fatherName: sanitize(userData.fatherName),
        motherName: sanitize(userData.motherName),
        spouseName: sanitize(userData.spouseName),
    };
}


export const getAllUsersForAdmin = async (page: number = 1, pageSize: number = 50): Promise<{ users: User[], total: number }> => {
    const supabaseAdmin = createAdminClient();
    const { data, error, count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact' })
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching admin users:', error);
        throw error;
    }

    return { users: data || [], total: count || 0 };
};

// Fetch a single user by ID — used to avoid bulk fetches in actions
export const getUserById = async (userId: string): Promise<User | null> => {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    if (error || !data) return null;
    return data as User;
};

export const createUser = async (userData: Omit<User, 'id'>): Promise<ActionResponse> => {
    // For anonymous user creation, we must use the anon client for RLS to work correctly.
    const supabaseAnon = createAnonClient();
    const supabaseAdmin = createAdminClient(); // Needed for unique ID check
    const newId = await generateUniqueId(supabaseAdmin);
    
    let sanitizedUserData = sanitizeUser(userData) as Omit<User, 'id'>;
    let userToInsert = { ...sanitizedUserData, id: newId };

    if (userToInsert.profilePictureUrl && userToInsert.profilePictureUrl.startsWith('data:image')) {
        try {
            // Pass the anon client to the upload function
            userToInsert.profilePictureUrl = await uploadProfilePicture(supabaseAnon, newId, userToInsert.profilePictureUrl);
        } catch(uploadError: any) {
            return { success: false, message: uploadError.message };
        }
    }

    const { error } = await supabaseAnon.from('users').insert(userToInsert);

    if (error) return { success: false, message: error.message };
  
    // Linking must be done with admin client as anon users can't update other rows.
    if (userToInsert.spouseId) {
        await linkSpouses(newId, userToInsert.spouseId);
    }

    return { success: true, message: 'User created successfully.', userId: newId };
};

export const updateUser = async (userToUpdate: User): Promise<ActionResponse> => {
    const supabaseAdmin = createAdminClient();
    let finalPayload = sanitizeUser(userToUpdate) as User;

    if (finalPayload.profilePictureUrl && finalPayload.profilePictureUrl.startsWith('data:image')) {
        try {
            finalPayload.profilePictureUrl = await uploadProfilePicture(supabaseAdmin, finalPayload.id, finalPayload.profilePictureUrl);
        } catch (uploadError: any) {
            return { success: false, message: uploadError.message };
        }
    } else if (!finalPayload.profilePictureUrl) {
        // Don't overwrite with placeholder — just remove the field from the update payload
        // so the existing DB value is preserved
        delete (finalPayload as any).profilePictureUrl;
    }

    const { data: originalUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('spouseId')
        .eq('id', finalPayload.id)
        .single();

    if (fetchError) {
        return { success: false, message: `Could not find original user to update: ${fetchError.message}` };
    }

    const oldSpouseId = originalUser.spouseId;
    const newSpouseId = finalPayload.spouseId;

    if (oldSpouseId && oldSpouseId !== newSpouseId) {
        const { error: unlinkOldError } = await supabaseAdmin
            .rpc('unlink_spouses', { p_user_id: finalPayload.id, p_spouse_id: oldSpouseId });
        if (unlinkOldError) console.warn(`Could not unlink old spouse ${oldSpouseId}: ${unlinkOldError.message}`);
    }
    
    if (finalPayload.fatherId) finalPayload.fatherName = null;
    if (finalPayload.motherId) finalPayload.motherName = null;
    if (finalPayload.spouseId) finalPayload.spouseName = null;
    
    const { id, created_at, ...updatePayload } = finalPayload;

    const { error: updateError } = await supabaseAdmin.from('users').update(updatePayload).eq('id', id);
    if (updateError) {
        return { success: false, message: `Failed to save user changes: ${updateError.message}` };
    }

    if (newSpouseId) {
        const { error: linkNewError } = await supabaseAdmin
            .rpc('link_spouses', { user_id_1: id, user_id_2: newSpouseId });
        if (linkNewError) return { success: false, message: `Failed to link new spouse: ${linkNewError.message}` };
    }

    return { success: true, message: 'User updated successfully.' };
};


export const linkSpouses = async (userId1: string, userId2: string): Promise<ActionResponse> => {
    const supabaseAdmin = createAdminClient();
    
    const { data: users, error: usersError } = await supabaseAdmin.from('users').select('id, gender').in('id', [userId1, userId2]);

    if (usersError || users.length < 2) return { success: false, message: 'One or both users not found for linking.' };
    
    const user1 = users.find(u => u.id === userId1)!;
    const user2 = users.find(u => u.id === userId2)!;

    if (user1.gender === user2.gender) {
        return { success: false, message: 'Spouses must have different genders.' };
    }
    
    const { error } = await supabaseAdmin.rpc('link_spouses', { 
        user_id_1: userId1, 
        user_id_2: userId2 
    });

    if (error) return { success: false, message: `Failed to link spouses: ${error.message}` };

    return { success: true, message: "Spouses linked successfully." };
};

export const unlinkSpouses = async (userId: string): Promise<ActionResponse> => {
    const supabaseAdmin = createAdminClient();
    
    const { data: user, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('spouseId')
        .eq('id', userId)
        .single();
    
    if (fetchError || !user) {
        return { success: false, message: 'Could not find user to unlink.' };
    }

    const oldSpouseId = user.spouseId;
    
    if (!oldSpouseId) {
        return { success: true, message: "No spouse to unlink." };
    }
    
    const { error: rpcError } = await supabaseAdmin.rpc('unlink_spouses', {
        p_user_id: userId,
        p_spouse_id: oldSpouseId
    });

    if (rpcError) {
        return { success: false, message: `Failed to unlink spouses: ${rpcError.message}`};
    }
    
    return { success: true, message: "Spouses unlinked successfully." };
};


export const deleteUser = async (userId: string): Promise<ActionResponse> => {
    const supabaseAdmin = createAdminClient();
    
    const { data: userToDelete, error: userFetchError } = await supabaseAdmin.from('users').select('spouseId').eq('id', userId).single();
    if (userToDelete && userToDelete.spouseId && !userFetchError) {
        await unlinkSpouses(userId);
    }

    const { error: fatherUnlinkError } = await supabaseAdmin.from('users').update({ fatherId: null }).eq('fatherId', userId);
    if (fatherUnlinkError) return { success: false, message: `Failed to unlink from children (father): ${fatherUnlinkError.message}` };
    
    const { error: motherUnlinkError } = await supabaseAdmin.from('users').update({ motherId: null }).eq('motherId', userId);
    if (motherUnlinkError) return { success: false, message: `Failed to unlink from children (mother): ${motherUnlinkError.message}` };
    
    const { error: deleteError } = await supabaseAdmin.from('users').delete().eq('id', userId);
    if (deleteError) return { success: false, message: `Failed to delete user profile: ${deleteError.message}` };
    
    // Check for both .webp and .jpeg files to delete
    const extensions = ['.webp', '.jpeg'];
    for (const ext of extensions) {
      const { data: list, error: listError } = await supabaseAdmin.storage.from('profile-pictures').list(undefined, { search: `${userId}${ext}` });
      if (listError) {
          console.warn(`Could not list storage objects for user ${userId} with ext ${ext}:`, listError.message);
      } else if (list && list.length > 0) {
        const filesToDelete = list.map(x => x.name);
        const { error: removeError } = await supabaseAdmin.storage.from('profile-pictures').remove(filesToDelete);
        if (removeError) console.warn(`Could not remove profile picture for user ${userId}:`, removeError.message);
      }
    }

    return { success: true, message: 'User and all relationships removed.' };
};

export const bulkDeleteUsers = async (userIds: string[]): Promise<ActionResponse> => {
    const supabaseAdmin = createAdminClient();
    if (userIds.length === 0) return { success: true, message: 'No users selected.' };
    
    const { data: usersToDelete, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id, spouseId')
        .in('id', userIds);
    if (fetchError) return { success: false, message: `Failed to fetch users for deletion: ${fetchError.message}`};
    
    const spouseIdsToUnlink = usersToDelete
        .map(u => u.spouseId)
        .filter((spouseId): spouseId is string => !!spouseId && !userIds.includes(spouseId));

    if (spouseIdsToUnlink.length > 0) {
        const { error: unlinkSpouseError } = await supabaseAdmin
            .from('users')
            .update({ spouseId: null, spouseName: null, maritalStatus: 'single' })
            .in('id', spouseIdsToUnlink);
        if (unlinkSpouseError) console.warn(`Could not bulk unlink external spouses: ${unlinkSpouseError.message}`);
    }

    const { error: fatherUnlinkError } = await supabaseAdmin.from('users').update({ fatherId: null, fatherName: null }).in('fatherId', userIds);
    if (fatherUnlinkError) return { success: false, message: `Failed to unlink from children (father): ${fatherUnlinkError.message}` };
    
    const { error: motherUnlinkError } = await supabaseAdmin.from('users').update({ motherId: null, motherName: null }).in('motherId', userIds);
    if (motherUnlinkError) return { success: false, message: `Failed to unlink from children (mother): ${motherUnlinkError.message}` };

    const { error: deleteError } = await supabaseAdmin.from('users').delete().in('id', userIds);
    if (deleteError) return { success: false, message: `Failed to delete user profiles: ${deleteError.message}` };
    
    const filePathsToDelete = userIds.flatMap(id => [`${id}.webp`, `${id}.jpeg`]);
    if (filePathsToDelete.length > 0) {
        const { error: removeError } = await supabaseAdmin.storage.from('profile-pictures').remove(filePathsToDelete);
        if (removeError) {
            console.warn(`Could not remove all profile pictures:`, removeError.message);
        }
    }

    return { success: true, message: `${userIds.length} users deleted successfully.` };
};

export const updateDeceasedStatus = async (userIds: string[], isDeceased: boolean): Promise<ActionResponse> => {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from('users')
        .update({ isDeceased })
        .in('id', userIds);

    if (error) {
        return { success: false, message: `Failed to update status: ${error.message}` };
    }
    return { success: true, message: "Deceased status updated." };
};

export const clearRelation = async (userId: string, relation: 'father' | 'mother'): Promise<ActionResponse> => {
    const supabaseAdmin = createAdminClient();
    const updateData = relation === 'father' ? { fatherId: null, fatherName: null } : { motherId: null, motherName: null };

    const { error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId);

    if (error) {
        return { success: false, message: `Failed to clear ${relation}: ${error.message}` };
    }

    return { success: true, message: `Successfully cleared ${relation}.` };
};

    

    