

import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { findUserById, findGrandparents, sortUsersByAge } from '@/lib/user-utils';
import type { User } from '@/lib/types';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import { getPublicProfileData } from '@/lib/data';
import { findChildrenAction, findSiblingsAction } from '@/actions/users';
import LoadingIndicator from '@/components/LoadingIndicator';
import ProfilePageClient from './_components/ProfilePageClient';

const ProfilePageSkeleton = () => (
    <div className="container mx-auto pt-24 pb-12 px-4 md:px-6 animate-pulse">
        <div className="flex justify-between items-center mb-8">
            <div className="h-10 w-24 bg-muted rounded-md"></div>
            <div className="flex items-center gap-2">
                <div className="h-10 w-32 bg-muted rounded-md"></div>
                <div className="h-10 w-24 bg-muted rounded-md"></div>
            </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 flex flex-col items-center gap-6">
                <div className="h-80 w-full rounded-lg bg-muted"></div>
                <div className="h-64 w-full rounded-lg bg-muted"></div>
            </div>
            <div className="lg:col-span-2 space-y-8">
                <div className="h-40 w-full rounded-lg bg-muted"></div>
                <div className="h-40 w-full rounded-lg bg-muted"></div>
                <div className="h-40 w-full rounded-lg bg-muted"></div>
            </div>
        </div>
    </div>
);

// Helper to fetch children for a list of users
const fetchChildrenForUsers = async (users: User[]) => {
    return Promise.all(
        users.map(async (user) => ({
            ...user,
            children: await findChildrenAction(user.id),
        }))
    );
};

export const dynamic = 'force-dynamic';

// This is the new Server Component that will fetch all data.
export default async function ProfilePage({ params }: { params: { id: string } }) {
    const allUsers = await getPublicProfileData();
    const user = findUserById(params.id, allUsers);

    if (!user) {
        notFound();
    }
    
    // Fetch all family data concurrently for performance
    const [childrenData, siblingsData] = await Promise.all([
        findChildrenAction(user.id),
        findSiblingsAction(user),
    ]);

    const childrenWithTheirChildren = await fetchChildrenForUsers(childrenData);
    const siblingsWithTheirChildren = await fetchChildrenForUsers(siblingsData);

    const sortedChildren = childrenWithTheirChildren.sort(sortUsersByAge);
    const sortedSiblings = siblingsWithTheirChildren.sort(sortUsersByAge);
    
    const father = findUserById(user.fatherId, allUsers);
    const mother = findUserById(user.motherId, allUsers);
    const spouse = findUserById(user.spouseId, allUsers);
    const { paternalGrandfather, paternalGrandmother, maternalGrandfather, maternalGrandmother } = findGrandparents(user, allUsers);
    
    const [paternalGrandfatherChildren, maternalGrandfatherChildren, spouseSiblingsData] = await Promise.all([
      paternalGrandfather ? findChildrenAction(paternalGrandfather.id) : Promise.resolve([]),
      maternalGrandfather ? findChildrenAction(maternalGrandfather.id) : Promise.resolve([]),
      spouse ? findSiblingsAction(spouse) : Promise.resolve([])
    ]);

    const paternalUncles = await fetchChildrenForUsers(paternalGrandfatherChildren.filter(u => u.gender === 'male' && u.id !== father?.id).sort(sortUsersByAge));
    const paternalAunts = await fetchChildrenForUsers(paternalGrandfatherChildren.filter(u => u.gender === 'female').sort(sortUsersByAge));
    
    const maternalUncles = await fetchChildrenForUsers(maternalGrandfatherChildren.filter(u => u.gender === 'male').sort(sortUsersByAge));
    const maternalAunts = await fetchChildrenForUsers(maternalGrandfatherChildren.filter(u => u.gender === 'female' && u.id !== mother?.id).sort(sortUsersByAge));

    const hasPaternalUnclesOrAunts = paternalUncles.length > 0 || paternalAunts.length > 0;
    const hasMaternalUnclesOrAunts = maternalUncles.length > 0 || maternalAunts.length > 0;

    const fatherInLaw = spouse ? findUserById(spouse.fatherId, allUsers) : undefined;
    const motherInLaw = spouse ? findUserById(spouse.motherId, allUsers) : undefined;

    const spouseSiblingsWithChildren = await fetchChildrenForUsers(spouseSiblingsData);

    const husbandBrothers = (user.gender === 'female' && spouse) ? spouseSiblingsWithChildren.filter(u => u.gender === 'male').sort((a, b) => sortUsersByAge(a, b)) : [];
    const husbandSisters = (user.gender === 'female' && spouse) ? spouseSiblingsWithChildren.filter(u => u.gender === 'female').sort(sortUsersByAge) : [];
    const wifeSisters = (user.gender === 'male' && spouse) ? spouseSiblingsWithChildren.filter(u => u.gender === 'female').sort(sortUsersByAge) : [];
    const wifeBrothers = (user.gender === 'male' && spouse) ? spouseSiblingsWithChildren.filter(u => u.gender === 'male').sort(sortUsersByAge) : [];
    
    const familyData = {
        children: sortedChildren,
        siblings: sortedSiblings,
        father,
        mother,
        spouse,
        paternalGrandfather,
        paternalGrandmother,
        maternalGrandfather,
        maternalGrandmother,
        paternalUncles,
        paternalAunts,
        maternalUncles,
        maternalAunts,
        hasPaternalUnclesOrAunts,
        hasMaternalUnclesOrAunts,
        fatherInLaw,
        motherInLaw,
        husbandBrothers,
        husbandSisters,
        wifeBrothers,
        wifeSisters,
    };
    
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
             <div className="absolute inset-0 -z-10 h-full w-full bg-background">
                <div aria-hidden="true" className="aurora-background absolute--full-bleed pointer-events-none" />
            </div>
            <MainHeader />
            <main className="flex-1">
                <Suspense fallback={<ProfilePageSkeleton />}>
                    <ProfilePageClient user={user} allUsers={allUsers} familyData={familyData} />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
