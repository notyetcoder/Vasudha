
'use server';

import { 
    addAdmin as addAdminToDb, 
    getAdminByUsername,
    getAllAdmins as getAllAdminsFromDb,
    deleteAdmin as deleteAdminFromDb,
    getAdminById,
} from '@/lib/admin-data';
import type { AdminUser } from '@/lib/types';
import { auth as adminAuth } from '@/lib/firebase-admin';

export async function createAdmin(adminData: Omit<AdminUser, 'id'>): Promise<{ success: boolean, message: string }> {
    if (!adminAuth) {
        return { success: false, message: 'Authentication service is not available.' };
    }
    try {
        if (adminData.role === 'super-admin') {
            return { success: false, message: 'Cannot create a super-admin account from the web interface.' };
        }

        const existingUserByUsername = await getAdminByUsername(adminData.username);
        if (existingUserByUsername) {
            return { success: false, message: 'Username already exists.' };
        }
        
        const { email, password, ...restOfAdminData } = adminData;

        if (!email || !password) {
            return { success: false, message: 'Email and password are required for new admin users.' };
        }

        const userRecord = await adminAuth.createUser({
            email: email,
            password: password,
            displayName: adminData.name,
            disabled: false,
        });

        await adminAuth.setCustomUserClaims(userRecord.uid, { role: adminData.role });

        await addAdminToDb({
            ...restOfData,
            id: userRecord.uid, 
            email: userRecord.email
        });

        return { success: true, message: `Admin user ${adminData.name} created successfully.` };
    } catch (error) {
        let message = "An unknown error occurred.";
        if (error instanceof Error) {
            if ('code' in error) {
                switch ((error as {code: string}).code) {
                    case 'auth/email-already-exists':
                        message = 'This email is already in use by another account.';
                        break;
                    case 'auth/invalid-password':
                        message = 'The password must be a string with at least six characters.';
                        break;
                    default:
                        message = error.message;
                }
            } else {
                 message = error.message;
            }
        }
        return { success: false, message };
    }
}

export async function getAdminUser(uid: string): Promise<Omit<AdminUser, 'password'> | null> {
    try {
        // Security Hardening: Ensure user exists in Firebase Auth before checking Firestore.
        if (adminAuth) {
            await adminAuth.getUser(uid);
        }

        const user = await getAdminById(uid);

        if (!user) {
            console.log(`getAdminUser: No user found in Firestore for uid '${uid}'`);
            return null;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;

    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
             console.warn(`getAdminUser: User with uid '${uid}' not found in Firebase Auth.`);
        } else {
            console.error("getAdminUser action error:", error);
        }
        return null;
    }
}


export async function getAdmins(): Promise<Omit<AdminUser, 'password'>[]> {
    try {
        const admins = await getAllAdminsFromDb();
        return admins.map(admin => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...rest } = admin;
            return rest;
        });
    } catch (error) {
        console.error("Failed to get admins:", error);
        return [];
    }
}

export async function removeAdmin(adminIdToRemove: string, currentAdminId: string): Promise<{ success: boolean; message: string }> {
    if (!adminAuth) {
        return { success: false, message: 'Authentication service is not available.' };
    }
    if (adminIdToRemove === currentAdminId) {
        return { success: false, message: "You cannot remove your own account." };
    }
    try {
        await deleteAdminFromDb(adminIdToRemove);
        await adminAuth.deleteUser(adminIdToRemove);

        return { success: true, message: "Admin user removed successfully." };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message };
    }
}
