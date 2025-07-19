
'use client';
import type { AdminUser } from '@/lib/types';
import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { onAuthStateChanged, type User as FirebaseAuthUser } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { getAdminUser } from '@/actions/auth';
import { usePathname, useRouter } from 'next/navigation';

type AdminContextType = {
    adminUser: AdminUser | null;
    firebaseUser: FirebaseAuthUser | null;
    isLoading: boolean;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setIsLoading(true);
            if (user) {
                try {
                    setFirebaseUser(user);
                    const customAdminData = await getAdminUser(user.uid);
                    if (customAdminData) {
                        setAdminUser(customAdminData);
                    } else {
                        console.error("Authenticated user not found in admins database. Forcing logout.");
                        setAdminUser(null);
                        setFirebaseUser(null);
                        await auth.signOut();
                    }
                } catch (error) {
                    console.error("Error fetching admin user data:", error);
                    setAdminUser(null);
                    setFirebaseUser(null);
                    await auth.signOut();
                } finally {
                    setIsLoading(false);
                }
            } else { // No Firebase user
                setFirebaseUser(null);
                setAdminUser(null);
                
                // If not authenticated, always redirect to login, unless already there.
                // This also handles the case where sign-out was forced above.
                if (pathname !== '/admin/login' && pathname !== '/admin/register') {
                   router.push(`/admin/login?callbackUrl=${encodeURIComponent(pathname)}`);
                }
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router, pathname]);

    return (
        <AdminContext.Provider value={{ adminUser, firebaseUser, isLoading }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}
