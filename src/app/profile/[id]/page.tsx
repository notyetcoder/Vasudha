
'use client';

import React from 'react';
import { findUserById, findChildren, findGrandparents, findSiblings } from '@/lib/user-utils';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Leaf } from 'lucide-react';
import type { User } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import TransparentBackButton from '@/components/TransparentBackButton';
import { getUsers } from '@/actions/users';
import CombinedProfileCard from '@/components/CombinedProfileCard';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode, children: React.ReactNode }) => {
    // Return null if there are no children to render in the section
    const childrenArray = React.Children.toArray(children);
    if (childrenArray.length === 0 || childrenArray.every(child => !child)) {
        return null;
    }
    return (
        <div className="mb-8">
            <h2 className="text-xl flex items-center gap-3 text-primary font-bold mb-4">
                {icon}
                {title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    )
};

const ProfilePageSkeleton = () => (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <MainHeader />
        <main className="flex-1">
            <div className="container mx-auto pt-24 pb-12 px-4 md:px-6">
                 <div className="mb-8 flex justify-between items-center">
                    <TransparentBackButton />
                </div>
                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-1 flex flex-col items-center lg:sticky top-24 gap-6">
                        <Card className="w-full">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <Skeleton className="w-[150px] h-[150px] rounded-full mb-4" />
                                <Skeleton className="h-8 w-40 mb-2" />
                            </CardContent>
                        </Card>
                         <Card className="w-full">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <Skeleton className="w-[120px] h-[120px] rounded-full mb-4" />
                                <Skeleton className="h-6 w-32" />
                            </CardContent>
                        </Card>
                    </div>
                     <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardContent className="p-6">
                                <Skeleton className="h-6 w-48 mb-4" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Skeleton className="h-24" />
                                  <Skeleton className="h-24" />
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardContent className="p-6">
                                <Skeleton className="h-6 w-48 mb-4" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Skeleton className="h-24" />
                                  <Skeleton className="h-24" />
                                </div>
                            </CardContent>
                        </Card>
                     </div>
                </div>
            </div>
        </main>
        <Footer />
    </div>
);


export default function ProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchAllUsers = async () => {
        setIsLoading(true);
        try {
            const usersFromServer = await getUsers();
            setAllUsers(usersFromServer);
            const mainUser = findUserById(id, usersFromServer);
            
            if (mainUser) {
                // On public profiles, only show approved users
                // If a user is not approved, they shouldn't be publicly viewable.
                // An admin would see them via the admin panel's own view link.
                if (mainUser.status !== 'approved') {
                    notFound();
                    return;
                }
                setUser(mainUser);
            } else {
                notFound();
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            // Optionally, handle error state here
        } finally {
            setIsLoading(false);
        }
    };

    fetchAllUsers();
    
  }, [id]);

  const relationships = useMemo(() => {
    if (!user) return null;

    const father = findUserById(user.fatherId, allUsers);
    const mother = findUserById(user.motherId, allUsers);
    const spouse = findUserById(user.spouseId, allUsers);
    const children = findChildren(user, allUsers);
    const siblings = findSiblings(user, allUsers);
    
    const { paternalGrandfather, paternalGrandmother, maternalGrandfather, maternalGrandmother } = findGrandparents(user, allUsers);

    const fatherInLaw = spouse ? findUserById(spouse.fatherId, allUsers) : undefined;
    const motherInLaw = spouse ? findUserById(spouse.motherId, allUsers) : undefined;
    
    const paternalGrandfatherObj = findUserById(father?.fatherId, allUsers);
    const paternalUncles = paternalGrandfatherObj
        ? findChildren(paternalGrandfatherObj, allUsers).filter(u => u.gender === 'male' && u.id !== father?.id)
        : [];
    const paternalAunts = paternalGrandfatherObj
        ? findChildren(paternalGrandfatherObj, allUsers).filter(u => u.gender === 'female' && u.id !== mother?.id)
        : [];
    
    const maternalGrandfatherObj = findUserById(mother?.fatherId, allUsers);
    const maternalUncles = maternalGrandfatherObj
        ? findChildren(maternalGrandfatherObj, allUsers).filter(u => u.gender === 'male') 
        : [];
    const maternalAunts = maternalGrandfatherObj
        ? findChildren(maternalGrandfatherObj, allUsers).filter(u => u.gender === 'female' && u.id !== mother?.id)
        : [];

    return {
      father, mother, spouse, children, siblings,
      paternalGrandfather, paternalGrandmother,
      maternalGrandfather, maternalGrandmother,
      fatherInLaw, motherInLaw,
      paternalAunts, paternalUncles,
      maternalAunts, maternalUncles
    };
  }, [user, allUsers]);

  
  if (isLoading || !user || !relationships) {
    return <ProfilePageSkeleton />;
  }
  
  const { 
      father, mother, spouse, children, siblings,
      paternalGrandfather, paternalGrandmother, 
      maternalGrandfather, maternalGrandmother,
      fatherInLaw, motherInLaw,
      paternalAunts, paternalUncles,
      maternalAunts, maternalUncles
  } = relationships;
  
  const mainProfileUser = findUserById(id, allUsers) || user;
  const spouseProfileUser = findUserById(mainProfileUser.spouseId, allUsers);
  
  const hasPaternalUnclesOrAunts = paternalUncles.length > 0 || paternalAunts.length > 0;
  const hasMaternalUnclesOrAunts = maternalUncles.length > 0 || maternalAunts.length > 0;

  const DeceasedInfo = ({ person }: { person: User }) => {
    if (!person.isDeceased) return null;

    let text = "In Loving Memory";
    if (person.deathDate) {
        try {
            text += ` (Passed on ${format(new Date(person.deathDate), 'd MMM yyyy')})`;
        } catch (e) {
            // date is invalid, ignore it
        }
    }
    
    return (
        <p className="text-sm text-muted-foreground font-semibold mt-1 flex items-center gap-1.5">
            <Leaf className="h-3 w-3" /> {text}
        </p>
    );
  };
  

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <MainHeader />
      <main className="flex-1">
        <div className="container mx-auto pt-24 pb-12 px-4 md:px-6">
          <div className="mb-8 flex justify-between items-center">
            <TransparentBackButton />
          </div>
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Left Sticky Column - Desktop only behavior */}
            <div className="lg:col-span-1 flex flex-col items-center gap-6 lg:sticky lg:top-24">
              <Card className={cn("w-full", mainProfileUser.isDeceased && "bg-muted/50")}>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Image
                    src={mainProfileUser.profilePictureUrl}
                    alt={`${mainProfileUser.name}`}
                    width={150}
                    height={150}
                    data-ai-hint="profile picture"
                    className={cn("rounded-full mb-4 border-4 border-background shadow-lg", mainProfileUser.isDeceased && "grayscale")}
                  />
                  <h1 className="font-headline text-3xl font-bold text-primary">
                    {mainProfileUser.name} {mainProfileUser.surname}
                  </h1>
                  <DeceasedInfo person={mainProfileUser} />
                   <p className="text-muted-foreground mt-2">{mainProfileUser.description || 'Community Member'}</p>
                </CardContent>
              </Card>
              {spouseProfileUser && (
                <Link href={`/profile/${spouseProfileUser.id}`} className="block w-full group">
                  <Card className={cn("w-full transition-all duration-300 group-hover:shadow-lg group-hover:border-primary/30", spouseProfileUser.isDeceased && "bg-muted/50")}>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <Image
                        src={spouseProfileUser.profilePictureUrl}
                        alt={`${spouseProfileUser.name}`}
                        width={120}
                        height={120}
                        data-ai-hint="profile picture"
                        className={cn("rounded-full mb-4 border-4 border-background shadow-lg transition-transform duration-300 group-hover:scale-105", spouseProfileUser.isDeceased && "grayscale")}
                      />
                      <h2 className="font-headline text-2xl font-bold text-primary/80 group-hover:text-primary">
                        {spouseProfileUser.name} {spouseProfileUser.surname}
                      </h2>
                      <DeceasedInfo person={spouseProfileUser} />
                      <p className="text-muted-foreground mt-1">{mainProfileUser.gender === 'male' ? 'Wife' : 'Husband'}</p>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>

            {/* Right Scrollable Column */}
            <div className="lg:col-span-2 space-y-8">
                <Section title="Parents" icon={<Users />}>
                    <CombinedProfileCard
                      person1={father}
                      person2={mother}
                      relationship1="Pappa"
                      relationship2="Mummy"
                      allUsers={allUsers}
                    />
                </Section>
                 <Section title="Grandparents" icon={<Users />}>
                    <CombinedProfileCard
                      person1={paternalGrandfather}
                      person2={paternalGrandmother}
                      relationship1="Dada"
                      relationship2="Dadi"
                      allUsers={allUsers}
                    />
                     <CombinedProfileCard
                      person1={maternalGrandfather}
                      person2={maternalGrandmother}
                      relationship1="Nana"
                      relationship2="Nani"
                      allUsers={allUsers}
                    />
                </Section>
                 {spouseProfileUser && (
                  <Section title="In-Laws" icon={<Users />}>
                     <CombinedProfileCard
                        person1={fatherInLaw}
                        person2={motherInLaw}
                        relationship1="Sasurji"
                        relationship2="Saas"
                        allUsers={allUsers}
                      />
                  </Section>
                )}
                 <Section title="Siblings" icon={<Users />}>
                        {siblings.map(sibling => {
                            const siblingSpouse = findUserById(sibling.spouseId, allUsers);
                            const isBrother = sibling.gender === 'male';
                            return (
                                <CombinedProfileCard
                                    key={sibling.id}
                                    person1={sibling}
                                    person2={siblingSpouse}
                                    relationship1={isBrother ? 'Bhai' : 'Ben'}
                                    relationship2={isBrother ? 'Bhabhi' : 'Banevi'}
                                    allUsers={allUsers}
                                    showChildrenLink
                                />
                            );
                        })}
                    </Section>
                 <Section title="Children" icon={<Users />}>
                    {children.length > 0 ? (
                        children.map(c => {
                            const childSpouse = findUserById(c.spouseId, allUsers);
                            return (
                               <CombinedProfileCard
                                  key={c.id}
                                  person1={c}
                                  person2={childSpouse}
                                  relationship1={c.gender === 'male' ? 'Dikro' : 'Dikri'}
                                  relationship2={c.gender === 'male' ? 'Putra Vadhu' : 'Jamai'}
                                  allUsers={allUsers}
                                  showChildrenLink
                                />
                            )
                        })
                    ) : (
                      <p className="text-muted-foreground italic col-span-full text-center py-4">No children found.</p>
                    )}
                </Section>
                 {hasPaternalUnclesOrAunts && (
                    <Section title="Uncles & Aunts (Paternal)" icon={<Users />}>
                        {paternalUncles.map(uncle => {
                           const aunt = findUserById(uncle.spouseId, allUsers);
                           return <CombinedProfileCard key={uncle.id} person1={uncle} person2={aunt} relationship1="Kaka" relationship2="Kaki" allUsers={allUsers} showChildrenLink />
                        })}
                        {paternalAunts.map(aunt => {
                           const uncle = findUserById(aunt.spouseId, allUsers);
                           return <CombinedProfileCard key={aunt.id} person1={aunt} person2={uncle} relationship1="Foi" relationship2="Fua" allUsers={allUsers} showChildrenLink />
                        })}
                    </Section>
                 )}
                 {hasMaternalUnclesOrAunts && (
                    <Section title="Uncles & Aunts (Maternal)" icon={<Users />}>
                         {maternalUncles.map(uncle => {
                           const aunt = findUserById(uncle.spouseId, allUsers);
                           return <CombinedProfileCard key={uncle.id} person1={uncle} person2={aunt} relationship1="Mama" relationship2="Mami" allUsers={allUsers} showChildrenLink />
                        })}
                        {maternalAunts.map(aunt => {
                           const uncle = findUserById(aunt.spouseId, allUsers);
                           return <CombinedProfileCard key={aunt.id} person1={aunt} person2={uncle} relationship1="Masi" relationship2="Masa" allUsers={allUsers} showChildrenLink />
                        })}
                    </Section>
                 )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

    