
import { db } from './firebase-admin';
import { format } from 'date-fns';
import admin from 'firebase-admin';
import type { User } from './types';

const generateUniqueId = async (surname: string): Promise<string> => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        throw new Error("Database not initialized. Check server logs for details.");
    }
    const usersCollection = db.collection('users');
    const d = new Date();
    const datePart = format(d, 'yyMMdd');
    const familyPart = (surname || 'UNK').substring(0, 3).toUpperCase();
    const idPrefix = `${familyPart}-${datePart}`;
    
    const query = usersCollection.where(admin.firestore.FieldPath.documentId(), '>=', idPrefix)
                                 .where(admin.firestore.FieldPath.documentId(), '<', idPrefix + 'z');
    const snapshot = await query.get();
    const count = snapshot.size;
    
    const newSequence = count + 1;
    const sequencePart = String(newSequence).padStart(3, '0');

    return `${idPrefix}-${sequencePart}`;
};


// Functions to manipulate the users array in-memory for the prototype
export const addUser = async (userData: Omit<User, 'id' | 'status' >, status: 'pending' | 'approved'): Promise<User> => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        throw new Error("Database not initialized. Check server logs for details.");
    }
    const usersCollection = db.collection('users');
    const finalId = await generateUniqueId(userData.surname);
    
    const newUserToSave: { [key: string]: any } = {
        ...userData,
        status: status, // Use the passed status
    };
    
    // Remove undefined properties before saving
    Object.keys(newUserToSave).forEach(key => newUserToSave[key] === undefined && delete newUserToSave[key]);
    
    await usersCollection.doc(finalId).set(newUserToSave);
    
    const finalUser = { ...newUserToSave, id: finalId } as User;

    if (finalUser.spouseId) {
        const spouseRef = usersCollection.doc(finalUser.spouseId);
        await spouseRef.update({
            spouseId: finalUser.id,
            spouseName: `${finalUser.name}${finalUser.surname}`,
            maritalStatus: 'married',
        });
    }

    return finalUser;
};

export const approveUser = async (id: string) => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        throw new Error("Database not initialized. Check server logs for details.");
    }
    await db.collection('users').doc(id).update({ status: 'approved' });
};

export const unapproveUser = async (id: string) => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        throw new Error("Database not initialized. Check server logs for details.");
    }
    await db.collection('users').doc(id).update({ status: 'pending' });
};

// This is now a "soft delete" - moves user to the dustbin
export const deleteUser = async (id: string) => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        throw new Error("Database not initialized. Check server logs for details.");
    }
    await db.collection('users').doc(id).update({ 
        status: 'deleted',
        deletedAt: new Date().toISOString()
    });
};

// This is the new function for hard/permanent deletion
export const permanentlyDeleteUser = async (id: string) => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        throw new Error("Database not initialized. Check server logs for details.");
    }
    const usersCollection = db.collection('users');

    const userRef = usersCollection.doc(id);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
        const user = userDoc.data() as User;
        const batch = db.batch();

        // Unlink spouse if exists
        if (user.spouseId) {
            const spouseRef = usersCollection.doc(user.spouseId);
            batch.update(spouseRef, { 
                spouseId: admin.firestore.FieldValue.delete(),
                spouseName: admin.firestore.FieldValue.delete(),
                maritalStatus: 'single'
            });
        }
        
        // Unlink from children where user is father
        const childrenAsFatherQuery = await usersCollection.where('fatherId', '==', id).get();
        childrenAsFatherQuery.forEach(doc => {
            batch.update(doc.ref, { fatherId: admin.firestore.FieldValue.delete() });
        });

        // Unlink from children where user is mother
        const childrenAsMotherQuery = await usersCollection.where('motherId', '==', id).get();
        childrenAsMotherQuery.forEach(doc => {
            batch.update(doc.ref, { motherId: admin.firestore.FieldValue.delete() });
        });

        // Delete the user document itself
        batch.delete(userRef);

        await batch.commit();
    }
};

export const recoverUser = async (id: string) => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        throw new Error("Database not initialized. Check server logs for details.");
    }
    await db.collection('users').doc(id).update({ 
        status: 'approved', // Recovered users go back to approved status
        deletedAt: admin.firestore.FieldValue.delete()
    });
};


export const updateUser = async (id: string, updatedData: Partial<User>) => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        throw new Error("Database not initialized. Check server logs for details.");
    }
    try {
        const usersCollection = db.collection('users');

        const userRef = usersCollection.doc(id);
        const userDoc = await userRef.get();
        if (!userDoc.exists) return;
        const user = userDoc.data() as User;
        
        const oldSpouseId = user.spouseId;
        const newSpouseId = updatedData.spouseId;

        const batch = db.batch();
        
        const cleanUpdatePayload: { [key: string]: any } = { ...updatedData };

        if (newSpouseId !== oldSpouseId) {
            if (oldSpouseId) {
                const oldSpouseRef = usersCollection.doc(oldSpouseId);
                batch.update(oldSpouseRef, {
                    spouseId: admin.firestore.FieldValue.delete(),
                    spouseName: admin.firestore.FieldValue.delete(),
                    maritalStatus: 'single'
                });
            }
            if (newSpouseId) {
                const newSpouseRef = usersCollection.doc(newSpouseId);
                const newSpouseDoc = await newSpouseRef.get();
                if(newSpouseDoc.exists) {
                    const newSpouseData = newSpouseDoc.data() as User;
                    if (newSpouseData.spouseId) {
                        const newSpousesOldPartnerRef = usersCollection.doc(newSpouseData.spouseId);
                        batch.update(newSpousesOldPartnerRef, {
                            spouseId: admin.firestore.FieldValue.delete(),
                            spouseName: admin.firestore.FieldValue.delete(),
                            maritalStatus: 'single'
                        });
                    }
                    batch.update(newSpouseRef, {
                        spouseId: id,
                        spouseName: `${updatedData.name || user.name}${updatedData.surname || user.surname}`,
                        maritalStatus: 'married',
                    });
                }
            }
        }

        if ('maritalStatus' in cleanUpdatePayload && cleanUpdatePayload.maritalStatus === 'single') {
            cleanUpdatePayload.spouseId = admin.firestore.FieldValue.delete();
            cleanUpdatePayload.spouseName = admin.firestore.FieldValue.delete();
        }

        Object.keys(cleanUpdatePayload).forEach(key => {
            if (cleanUpdatePayload[key] === undefined) {
                delete cleanUpdatePayload[key];
            }
        });

        batch.update(userRef, cleanUpdatePayload);
        await batch.commit();
    } catch (error) {
        console.error(`Failed to update user ${id}:`, error);
    }
};

export const updateDeceasedStatus = async (userIds: string[], isDeceased: boolean): Promise<void> => {
    if (!db) {
        throw new Error("Database not initialized.");
    }
    const batch = db.batch();
    const usersCollection = db.collection('users');
    userIds.forEach(userId => {
        const docRef = usersCollection.doc(userId);
        batch.update(docRef, { isDeceased });
    });
    await batch.commit();
};


export const importUsers = async (newUsers: Omit<User, 'id'>[]): Promise<number> => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        throw new Error("Database not initialized. Check server logs for details.");
    }
    const usersCollection = db.collection('users');
    const batch = db.batch();

    for (const u of newUsers) {
        const id = await generateUniqueId(u.surname);
        const userToCreate: Omit<User, 'id'> = {
            ...u,
            status: 'approved',
            profilePictureUrl: u.profilePictureUrl || 'https://placehold.co/150x150.png',
        };
        const docRef = usersCollection.doc(id);
        batch.set(docRef, userToCreate);
    }
    await batch.commit();
    return newUsers.length;
};

export const getUsers = async (options?: { status: 'approved' | 'pending' | 'deleted' }): Promise<User[]> => {
    if (!db) {
        console.error("Firestore database is not initialized. Check server logs for Firebase Admin initialization errors.");
        return [];
    }
    try {
        let query: admin.firestore.Query = db.collection('users');
        if (options?.status) {
            query = query.where('status', '==', options.status);
        }

        const snapshot = await query.get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
        console.error("Failed to get users from Firestore:", error);
        return [];
    }
};

    