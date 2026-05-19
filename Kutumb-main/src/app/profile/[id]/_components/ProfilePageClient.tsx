
'use client';
import React, { useState } from 'react';
import { findUserById, isPerson1Older } from '@/lib/user-utils';
import UserAvatar from '@/components/UserAvatar';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Leaf, Edit, Share2 } from 'lucide-react';
import type { User } from '@/lib/types';
import TransparentBackButton from '@/components/TransparentBackButton';
import CombinedProfileCard from '@/components/CombinedProfileCard';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ShareProfileDialog from '@/components/ShareProfileDialog';
import { Section } from './helpers';


const DeceasedInfo = ({ person }: { person: User }) => {
    if (!person.isDeceased) return null;
    let text = "स्वर्गस्थ";
    if (person.deathDate) {
        try {
            // By parsing as ISO and then formatting, we treat the date as UTC and prevent timezone shifts.
            const date = parseISO(person.deathDate);
             if (!isNaN(date.getTime())) {
                const day = ('0' + date.getUTCDate()).slice(-2);
                const month = date.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
                const year = date.getUTCFullYear();
                text += ` (Passed on ${day} ${month} ${year})`;
            }
        } catch (e) { /* ignore invalid date */ }
    }
    return (
        <p className="text-sm text-muted-foreground font-semibold mt-1 flex items-center gap-1.5">
            <Leaf className="h-3 w-3" /> {text}
        </p>
    );
};

export default function ProfilePageClient({ user, allUsers, familyData }: { user: User; allUsers: User[]; familyData: any; }) {
  const {
    children,
    siblings,
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
  } = familyData;

  const [isShareOpen, setIsShareOpen] = useState(false);
  
  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
  const profileFullName = `${user.name} ${user.surname}`;
  const editUrl = `/contact?profileId=${user.id}&profileName=${encodeURIComponent(profileFullName)}`;

  return (
    <>
      <div className="container mx-auto pt-24 pb-12 px-4 md:px-6">
        <div className="mb-8 flex justify-between items-center gap-2">
          <TransparentBackButton />
          <div className='flex items-center gap-2'>
            <Button asChild variant="outline">
              <Link href={editUrl}>
                <Edit className="mr-2 h-4 w-4" /> Request Edit
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setIsShareOpen(true)}>
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 flex flex-col items-center gap-6 lg:sticky lg:top-24">
              <Card className={cn("w-full bg-card/30 backdrop-blur-lg border-white/10 shadow-lg", user.isDeceased && "bg-muted/50")}>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <UserAvatar name={user.name} profilePictureUrl={user.profilePictureUrl} size={150} isDeceased={user.isDeceased} className="mb-4" />
                  <h1 className="font-headline text-3xl font-bold text-primary">{user.name} {user.surname}</h1>
                  <DeceasedInfo person={user} />
                  {user.isDeceased ? (
                    <p className="text-muted-foreground mt-2">स्वर्गस्थ</p>
                  ) : user.description ? (
                    <p className="text-muted-foreground mt-2">{`Profession: ${user.description}`}</p>
                  ) : (
                    <p className="text-muted-foreground mt-2">Community Member</p>
                  )}
                </CardContent>
              </Card>
              {spouse && (
                <a href={`/profile/${spouse.id}`} className="block w-full group">
                  <Card className={cn("w-full transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/30 bg-card/30 backdrop-blur-lg border-white/10 shadow-lg", spouse.isDeceased && "bg-muted/50")}>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <UserAvatar name={spouse.name} profilePictureUrl={spouse.profilePictureUrl} size={120} isDeceased={spouse.isDeceased} className="mb-4 transition-transform duration-300 group-hover:scale-105" />
                      <h2 className="font-headline text-2xl font-bold text-primary/80 group-hover:text-primary">{spouse.name} {spouse.surname}</h2>
                      <DeceasedInfo person={spouse} />
                      <p className="text-muted-foreground mt-1">{spouse.gender === 'male' ? 'Husband' : 'Wife'}</p>
                    </CardContent>
                  </Card>
                </a>
              )}
            </div>
            <div className="lg:col-span-2 space-y-8">
              <Section title="Parents" icon={<Users className="h-5 w-5" />}>
                <CombinedProfileCard person1={father} person2={mother} relationship1="Pappa" relationship2="Mummy" allUsers={allUsers} />
              </Section>
              <Section title="Grandparents" icon={<Users className="h-5 w-5" />}>
                <CombinedProfileCard person1={paternalGrandfather} person2={paternalGrandmother} relationship1="Dada" relationship2="Dadi" allUsers={allUsers} />
                <CombinedProfileCard person1={maternalGrandfather} person2={maternalGrandmother} relationship1="Nana" relationship2="Nani" allUsers={allUsers} />
              </Section>
              {spouse && (
                <Section title="In-Laws (Parents)" icon={<Users className="h-5 w-5" />}>
                  <CombinedProfileCard person1={fatherInLaw} person2={motherInLaw} relationship1="Sasra" relationship2="Sasu" allUsers={allUsers} />
                </Section>
              )}
              <Section title="Siblings" icon={<Users className="h-5 w-5" />}>
                {siblings.map((sibling:any) => {
                  const siblingSpouse = findUserById(sibling.spouseId, allUsers);
                  const isBrother = sibling.gender === 'male';
                  
                  let spouseRelationship = 'Banevi';
                  if (isBrother) {
                    if (user.gender === 'male') {
                      const isUserOlder = isPerson1Older(user, sibling);
                      if (isUserOlder === true) {
                        spouseRelationship = 'Putravadhu';
                      } else if (isUserOlder === false) {
                        spouseRelationship = 'Bhabhi';
                      } else {
                        spouseRelationship = 'Bhabhi/Putravadhu'
                      }
                    } else {
                      spouseRelationship = 'Bhabhi';
                    }
                  }

                  return (
                    <CombinedProfileCard key={sibling.id} person1={sibling} person2={siblingSpouse} relationship1={isBrother ? 'Bhai' : 'Ben'} relationship2={spouseRelationship} allUsers={allUsers} />
                  );
                })}
              </Section>
              <Section title="Children" icon={<Users className="h-5 w-5" />}>
                {children.length > 0 ? (
                  children.map((c:any) => {
                    const childSpouse = findUserById(c.spouseId, allUsers);
                    return (
                      <CombinedProfileCard key={c.id} person1={c} person2={childSpouse} relationship1={c.gender === 'male' ? 'Dikro' : 'Dikri'} relationship2={c.gender === 'male' ? 'Putra Vadhu' : 'Jamai'} allUsers={allUsers} />
                    )
                  })
                ) : (
                  <p className="text-muted-foreground italic col-span-full text-center py-4">No children found.</p>
                )}
              </Section>
              {hasPaternalUnclesOrAunts && (
                <Section title="Uncles & Aunts (Paternal)" icon={<Users className="h-5 w-5" />}>
                  {paternalUncles.map((uncle:any) => {
                    const aunt = findUserById(uncle.spouseId, allUsers);
                    const isFatherOlder = father ? isPerson1Older(father, uncle) : null;
                    const uncleRel = isFatherOlder === false ? "Mota Kaka" : "Kaka";
                    const auntRel = isFatherOlder === false ? "Mota Kaki" : "Kaki";
                    return <CombinedProfileCard key={uncle.id} person1={uncle} person2={aunt} relationship1={uncleRel} relationship2={auntRel} allUsers={allUsers} />
                  })}
                  {paternalAunts.map((aunt:any) => {
                    const uncle = findUserById(aunt.spouseId, allUsers);
                    return <CombinedProfileCard key={aunt.id} person1={aunt} person2={uncle} relationship1="Foi" relationship2="Fua" allUsers={allUsers} />
                  })}
                </Section>
              )}
              {hasMaternalUnclesOrAunts && (
                <Section title="Uncles & Aunts (Maternal)" icon={<Users className="h-5 w-5" />}>
                  {maternalUncles.map((uncle:any) => {
                    const aunt = findUserById(uncle.spouseId, allUsers);
                    return <CombinedProfileCard key={uncle.id} person1={uncle} person2={aunt} relationship1="Mama" relationship2="Mami" allUsers={allUsers} />
                  })}
                  {maternalAunts.map((aunt:any) => {
                    const uncle = findUserById(aunt.spouseId, allUsers);
                    return <CombinedProfileCard key={aunt.id} person1={aunt} person2={uncle} relationship1="Masi" relationship2="Masa" allUsers={allUsers} />
                  })}
                </Section>
              )}
              {user.gender === 'female' && husbandBrothers.length > 0 && spouse && (
                <Section title="In-Laws (Husband's Brothers)" icon={<Users className="h-5 w-5" />}>
                  {husbandBrothers.map((brotherInLaw:any) => {
                    const sisterInLaw = findUserById(brotherInLaw.spouseId, allUsers);
                    const isHusbandOlder = isPerson1Older(spouse, brotherInLaw);
                    const rel1 = isHusbandOlder === true ? "De-ar" : isHusbandOlder === false ? "Jeth" : "De-ar/Jeth";
                    const rel2 = isHusbandOlder === true ? "Derani" : isHusbandOlder === false ? "Jethani" : "Derani/Jethani";
                    return <CombinedProfileCard key={brotherInLaw.id} person1={brotherInLaw} person2={sisterInLaw} relationship1={rel1} relationship2={rel2} allUsers={allUsers} />
                  })}
                </Section>
              )}
              {user.gender === 'female' && husbandSisters.length > 0 && (
                <Section title="In-Laws (Husband's Sisters)" icon={<Users className="h-5 w-5" />}>
                  {husbandSisters.map((sisterInLaw:any) => {
                    const brotherInLaw = findUserById(sisterInLaw.spouseId, allUsers);
                    return <CombinedProfileCard key={sisterInLaw.id} person1={sisterInLaw} person2={brotherInLaw} relationship1="Nanand" relationship2="Nandoi" allUsers={allUsers} />
                  })}
                </Section>
              )}
              {user.gender === 'male' && wifeSisters.length > 0 && (
                <Section title="In-Laws (Wife's Sisters)" icon={<Users className="h-5 w-5" />}>
                  {wifeSisters.map((sisterInLaw:any) => {
                    return <CombinedProfileCard key={sisterInLaw.id} person1={sisterInLaw} person2={undefined} relationship1="Sali" relationship2="" allUsers={allUsers} />
                  })}
                </Section>
              )}
              {user.gender === 'male' && wifeBrothers.length > 0 && (
                <Section title="In-Laws (Wife's Brothers)" icon={<Users className="h-5 w-5" />}>
                  {wifeBrothers.map((brotherInLaw:any) => {
                    return <CombinedProfileCard key={brotherInLaw.id} person1={brotherInLaw} person2={undefined} relationship1="Salo" relationship2="" allUsers={allUsers} />
                  })}
                </Section>
              )}
            </div>
          </div>
        <ShareProfileDialog 
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          profileUrl={profileUrl}
          profileName={`${user.name} ${user.surname}`}
        />
      </div>
    </>
  );
}
