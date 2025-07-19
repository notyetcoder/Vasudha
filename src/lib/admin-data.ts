
import { db } from './firebase-admin';
import type { AdminUser } from './types';
import { format } from 'date-fns';

export const addAdmin = async (adminData: Omit<AdminUser, 'id'> & { id: string }): Promise<AdminUser> => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        throw new Error("Database not initialized. Check server logs for details.");
    }
    
    const docRef = db.collection('admins').doc(adminData.id);
    
    // Don't save password in Firestore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...restOfData } = adminData;

    await docRef.set({
        ...restOfData,
        username: adminData.username.toLowerCase(),
        createdAt: new Date(),
    });
    return { ...adminData };
};

export const getAdminByUsername = async (username: string): Promise<AdminUser | null> => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        return null;
    }
    try {
        const snapshot = await db.collection('admins').where('username', '==', username.toLowerCase()).limit(1).get();
        if (snapshot.empty) {
            return null;
        }
        const doc = snapshot.docs[0];
        const data = doc.data();
        
        const createdAt = data.createdAt?.toDate ? format(data.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A';

        return {
            id: doc.id,
            name: data.name,
            username: data.username,
            role: data.role,
            email: data.email,
            createdAt: createdAt,
            permissions: data.permissions
        } as AdminUser;
    } catch (error) {
        console.error("Failed to get admin by username from Firestore:", error);
        return null;
    }
};

export const getAdminById = async (id: string): Promise<AdminUser | null> => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        return null;
    }
    try {
        const doc = await db.collection('admins').doc(id).get();
        if (!doc.exists) {
            return null;
        }
        const data = doc.data();
        if (!data) return null;

        // Ensure timestamp is serialized
        const createdAt = data.createdAt?.toDate ? format(data.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A';

        return {
            id: doc.id,
            name: data.name,
            username: data.username,
            role: data.role,
            email: data.email,
            createdAt: createdAt,
            permissions: data.permissions
        } as AdminUser;
    } catch (error) {
        console.error(`Failed to get admin by ID ${id} from Firestore:`, error);
        return null;
    }
};

export const getAllAdmins = async (): Promise<AdminUser[]> => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        return [];
    }
    try {
        const snapshot = await db.collection('admins').get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? format(data.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A';
            return {
                id: doc.id,
                name: data.name,
                username: data.username,
                role: data.role,
                email: data.email,
                createdAt: createdAt,
                permissions: data.permissions
            } as AdminUser;
        });
    } catch (error) {
        console.error("Failed to get all admins from Firestore:", error);
        return [];
    }
};

export const deleteAdmin = async (id: string): Promise<void> => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        throw new Error("Database not initialized. Check server logs for details.");
    }
    await db.collection('admins').doc(id).delete();
};

export const hasSuperAdmin = async (): Promise<boolean> => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        return false;
    }
    try {
        const snapshot = await db.collection('admins').where('role', '==', 'super-admin').limit(1).get();
        return !snapshot.empty;
    } catch (error) {
        console.error("Failed to check for super admin:", error);
        return false;
    }
};
