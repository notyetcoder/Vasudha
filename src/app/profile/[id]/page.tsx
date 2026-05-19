import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { findUserById, findGrandparents, sortUsersByAge } from '@/lib/user-utils';
import type { User } from '@/lib/types';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import { getPublicProfileData } from '@/lib/data';
import { findChildren, findSiblings } from '@/lib/server-utils';
import ProfilePageClient from './_components/ProfilePageClient';

const ProfilePageSkeleton = () => (
    <div className="container mx-auto pt-20 pb-12 px-3 sm:px-4 animate-pulse">
        <div className="flex justify-between items-center mb-8">
            <div className="h-10 w-24 bg-muted rounded-md" />
            <div className="flex items-center gap-2">
                <div className="h-9 w-28 bg-muted rounded-md" />
                <div className="h-9 w-20 bg-muted rounded-md" />
                <div className="h-9 w-20 bg-muted rounded-md" />
            </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 space-y-4">
                <div className="h-72 w-full rounded-xl bg-muted" />
                <div className="h-48 w-full rounded-xl bg-muted" />
            </div>
            <div className="lg:col-span-2 space-y-6">
                <div className="h-36 w-full rounded-xl bg-muted" />
                <div className="h-36 w-full rounded-xl bg-muted" />
                <div className="h-36 w-full rounded-xl bg-muted" />
            </div>
        </div>
    </div>
);

// Pure in-memory helper — no extra DB calls
const withChildren = (users: User[], allUsers: User[]) =>
  users.map(u => ({ ...u, children: findChildren(u.id, allUsers) }));

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: { id: string } }) {
    // One single DB fetch — everything resolved in memory after this
    const allUsers = await getPublicProfileData();
    const user = findUserById(params.id, allUsers);

    if (!user) notFound();

    // All lookups below are pure in-memory — zero additional DB calls
    const childrenData     = findChildren(user.id, allUsers).sort(sortUsersByAge);
    const siblingsData     = findSiblings(user, allUsers).sort(sortUsersByAge);

    const sortedChildren = withChildren(childrenData, allUsers);
    const sortedSiblings = withChildren(siblingsData, allUsers);

    const father  = findUserById(user.fatherId, allUsers);
    const mother  = findUserById(user.motherId, allUsers);
    const spouse  = findUserById(user.spouseId, allUsers);

    const {
        paternalGrandfather, paternalGrandmother,
        maternalGrandfather, maternalGrandmother,
    } = findGrandparents(user, allUsers);

    // Paternal uncles/aunts — all in memory
    const paternalGrandfatherChildren = paternalGrandfather
        ? findChildren(paternalGrandfather.id, allUsers)
        : [];
    const maternalGrandfatherChildren = maternalGrandfather
        ? findChildren(maternalGrandfather.id, allUsers)
        : [];
    const spouseSiblings = spouse ? findSiblings(spouse, allUsers) : [];

    const paternalUncles = withChildren(
        paternalGrandfatherChildren.filter(u => u.gender === 'male' && u.id !== father?.id).sort(sortUsersByAge),
        allUsers
    );
    const paternalAunts  = withChildren(
        paternalGrandfatherChildren.filter(u => u.gender === 'female').sort(sortUsersByAge),
        allUsers
    );
    const maternalUncles = withChildren(
        maternalGrandfatherChildren.filter(u => u.gender === 'male').sort(sortUsersByAge),
        allUsers
    );
    const maternalAunts  = withChildren(
        maternalGrandfatherChildren.filter(u => u.gender === 'female' && u.id !== mother?.id).sort(sortUsersByAge),
        allUsers
    );

    const fatherInLaw  = spouse ? findUserById(spouse.fatherId, allUsers) : undefined;
    const motherInLaw  = spouse ? findUserById(spouse.motherId, allUsers) : undefined;

    const spouseSiblingsWithChildren = withChildren(spouseSiblings, allUsers);

    const husbandBrothers = (user.gender === 'female' && spouse)
        ? spouseSiblingsWithChildren.filter(u => u.gender === 'male').sort(sortUsersByAge) : [];
    const husbandSisters  = (user.gender === 'female' && spouse)
        ? spouseSiblingsWithChildren.filter(u => u.gender === 'female').sort(sortUsersByAge) : [];
    const wifeBrothers    = (user.gender === 'male' && spouse)
        ? spouseSiblingsWithChildren.filter(u => u.gender === 'male').sort(sortUsersByAge) : [];
    const wifeSisters     = (user.gender === 'male' && spouse)
        ? spouseSiblingsWithChildren.filter(u => u.gender === 'female').sort(sortUsersByAge) : [];

    const familyData = {
        children: sortedChildren,
        siblings: sortedSiblings,
        father, mother, spouse,
        paternalGrandfather, paternalGrandmother,
        maternalGrandfather, maternalGrandmother,
        paternalUncles, paternalAunts,
        maternalUncles, maternalAunts,
        hasPaternalUnclesOrAunts: paternalUncles.length > 0 || paternalAunts.length > 0,
        hasMaternalUnclesOrAunts: maternalUncles.length > 0 || maternalAunts.length > 0,
        fatherInLaw, motherInLaw,
        husbandBrothers, husbandSisters,
        wifeBrothers, wifeSisters,
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
