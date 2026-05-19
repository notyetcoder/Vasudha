'use client';
import React, { useState } from 'react';
import { findUserById, isPerson1Older } from '@/lib/user-utils';
import UserAvatar from '@/components/UserAvatar';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Leaf, Edit, Share2, GitMerge } from 'lucide-react';
import type { User } from '@/lib/types';
import TransparentBackButton from '@/components/TransparentBackButton';
import CombinedProfileCard from '@/components/CombinedProfileCard';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ShareProfileDialog from '@/components/ShareProfileDialog';
import { Section } from './helpers';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserWithChildren extends User {
  children?: User[];
}

interface FamilyData {
  children:               UserWithChildren[];
  siblings:               UserWithChildren[];
  father?:                User | null;
  mother?:                User | null;
  spouse?:                User | null;
  paternalGrandfather?:   User | null;
  paternalGrandmother?:   User | null;
  maternalGrandfather?:   User | null;
  maternalGrandmother?:   User | null;
  paternalUncles:         UserWithChildren[];
  paternalAunts:          UserWithChildren[];
  maternalUncles:         UserWithChildren[];
  maternalAunts:          UserWithChildren[];
  hasPaternalUnclesOrAunts: boolean;
  hasMaternalUnclesOrAunts: boolean;
  fatherInLaw?:           User | null;
  motherInLaw?:           User | null;
  husbandBrothers:        UserWithChildren[];
  husbandSisters:         UserWithChildren[];
  wifeBrothers:           UserWithChildren[];
  wifeSisters:            UserWithChildren[];
}

// ─── Deceased badge ───────────────────────────────────────────────────────────
const DeceasedInfo = ({ person }: { person: User }) => {
  if (!person.isDeceased) return null;
  let text = 'स्वर्गस्थ';
  if (person.deathDate) {
    try {
      const date = parseISO(person.deathDate);
      if (!isNaN(date.getTime())) {
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = date.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
        const year = date.getUTCFullYear();
        text += ` (${day} ${month} ${year})`;
      }
    } catch { /* ignore */ }
  }
  return (
    <p className="text-sm text-amber-500 font-medium mt-1 flex items-center gap-1.5">
      <Leaf className="h-3 w-3 shrink-0" /> {text}
    </p>
  );
};

// ─── Section title helper — Gujarati + English ───────────────────────────────
interface SectionTitleDef {
  en: string;
  gu: string;
}

function SectionHeader({ title }: { title: SectionTitleDef }) {
  return (
    <div className="flex items-baseline gap-2">
      <span>{title.en}</span>
      <span className="text-xs text-muted-foreground font-normal">({title.gu})</span>
    </div>
  );
}

const TITLES: Record<string, SectionTitleDef> = {
  parents:          { en: 'Parents',                   gu: 'માતા-પિતા' },
  grandparents:     { en: 'Grandparents',              gu: 'દાદા-દાદી / નાના-નાની' },
  inLawParents:     { en: 'In-Laws (Parents)',         gu: 'સસરા-સાસુ' },
  siblings:         { en: 'Siblings',                  gu: 'ભાઈ-બહેન' },
  children:         { en: 'Children',                  gu: 'સંતાન' },
  paternalRelatives:{ en: 'Uncles & Aunts (Paternal)', gu: 'કાકા-ફોઈ' },
  maternalRelatives:{ en: 'Uncles & Aunts (Maternal)', gu: 'મામા-માસી' },
  husbandBrothers:  { en: "Husband's Brothers",        gu: 'જેઠ / દિયર' },
  husbandSisters:   { en: "Husband's Sisters",         gu: 'નણંદ' },
  wifeSisters:      { en: "Wife's Sisters",            gu: 'સાળી' },
  wifeBrothers:     { en: "Wife's Brothers",           gu: 'સાળો' },
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProfilePageClient({
  user,
  allUsers,
  familyData,
}: {
  user: User;
  allUsers: User[];
  familyData: FamilyData;
}) {
  const {
    children, siblings, father, mother, spouse,
    paternalGrandfather, paternalGrandmother,
    maternalGrandfather, maternalGrandmother,
    paternalUncles, paternalAunts,
    maternalUncles, maternalAunts,
    hasPaternalUnclesOrAunts, hasMaternalUnclesOrAunts,
    fatherInLaw, motherInLaw,
    husbandBrothers, husbandSisters,
    wifeBrothers, wifeSisters,
  } = familyData;

  const [isShareOpen, setIsShareOpen] = useState(false);
  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
  const profileFullName = `${user.name} ${user.surname}`;
  const editUrl = `/contact?profileId=${user.id}&profileName=${encodeURIComponent(profileFullName)}`;

  return (
    <>
      <div className="container mx-auto pt-20 pb-16 px-3 sm:px-4 md:px-6">

        {/* ── Top action bar ─────────────────────────────────────────────── */}
        <div className="mb-6 flex justify-between items-center gap-2">
          <TransparentBackButton />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button asChild variant="outline" size="sm" className="h-10 px-2.5 sm:px-3">
              <Link href={`/relationships?view=finder&personB=${user.id}`} title="Find how you are related to this person">
                <GitMerge className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5 text-xs">Find Relation</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-10 px-2.5 sm:px-3">
              <Link href={editUrl} title="Request an edit to this profile">
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5 text-xs">Edit</span>
              </Link>
            </Button>
            <Button
              variant="outline" size="sm"
              className="h-10 px-2.5 sm:px-3"
              onClick={() => setIsShareOpen(true)}
              title="Share this profile"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5 text-xs">Share</span>
            </Button>
          </div>
        </div>

        {/* ── Mobile: compact hero row (photo + name side by side) ─────── */}
        <div className="lg:hidden mb-6">
          <Card className={cn('bg-card/30 backdrop-blur-lg border-white/10 shadow-lg', user.isDeceased && 'bg-muted/20')}>
            <CardContent className="p-4 flex items-center gap-4">
              <UserAvatar
                name={user.name}
                profilePictureUrl={user.profilePictureUrl}
                size={80}
                isDeceased={user.isDeceased}
                priority
              />
              <div className="min-w-0 flex-1">
                <h1 className="font-headline text-xl font-bold text-primary leading-tight">
                  {user.name} {user.surname}
                </h1>
                <DeceasedInfo person={user} />
                {!user.isDeceased && user.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{user.description}</p>
                )}
                {!user.isDeceased && !user.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">Community Member</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Main grid ──────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* Left column — desktop only (sticky) */}
          <div className="hidden lg:flex lg:col-span-1 flex-col items-center gap-6 lg:sticky lg:top-24">
            <Card className={cn('w-full bg-card/30 backdrop-blur-lg border-white/10 shadow-lg', user.isDeceased && 'bg-muted/20')}>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <UserAvatar
                  name={user.name}
                  profilePictureUrl={user.profilePictureUrl}
                  size={140}
                  isDeceased={user.isDeceased}
                  className="mb-4"
                  priority
                />
                <h1 className="font-headline text-2xl font-bold text-primary">{user.name} {user.surname}</h1>
                <DeceasedInfo person={user} />
                {!user.isDeceased && user.description && (
                  <p className="text-muted-foreground mt-2 text-sm">{user.description}</p>
                )}
                {!user.isDeceased && !user.description && (
                  <p className="text-muted-foreground mt-2 text-sm">Community Member</p>
                )}
              </CardContent>
            </Card>

            {/* Spouse card — desktop */}
            {spouse && (
              <Link href={`/profile/${spouse.id}`} className="block w-full group">
                <Card className={cn('w-full transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/30 bg-card/30 backdrop-blur-lg border-white/10 shadow-lg', spouse.isDeceased && 'bg-muted/20')}>
                  <CardContent className="p-5 flex flex-col items-center text-center">
                    <UserAvatar
                      name={spouse.name}
                      profilePictureUrl={spouse.profilePictureUrl}
                      size={100}
                      isDeceased={spouse.isDeceased}
                      className="mb-3 transition-transform duration-300 group-hover:scale-105"
                    />
                    <h2 className="font-headline text-xl font-bold text-primary/80 group-hover:text-primary">{spouse.name} {spouse.surname}</h2>
                    <DeceasedInfo person={spouse} />
                    <p className="text-muted-foreground mt-1 text-sm">{spouse.gender === 'male' ? 'Husband (પતિ)' : 'Wife (પત્ની)'}</p>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>

          {/* Right column — family sections */}
          <div className="lg:col-span-2 space-y-6">

            {/* Mobile spouse strip */}
            {spouse && (
              <div className="lg:hidden">
                <Link href={`/profile/${spouse.id}`} className="group block">
                  <Card className={cn('bg-card/30 backdrop-blur-lg border-white/10 shadow-lg hover:border-primary/30 transition-all', spouse.isDeceased && 'bg-muted/20')}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <UserAvatar name={spouse.name} profilePictureUrl={spouse.profilePictureUrl} size={52} isDeceased={spouse.isDeceased} />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{spouse.gender === 'male' ? 'Husband (પતિ)' : 'Wife (પત્ની)'}</p>
                        <p className="font-semibold text-primary truncate">{spouse.name} {spouse.surname}</p>
                        <DeceasedInfo person={spouse} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            )}

            {/* Parents */}
            {(father || mother) && (
              <Section title={<SectionHeader title={TITLES.parents} />} icon={<Users className="h-4 w-4" />}>
                <CombinedProfileCard person1={father} person2={mother} relationship1="પિતા" relationship2="માતા" />
              </Section>
            )}

            {/* Grandparents */}
            {(paternalGrandfather || paternalGrandmother || maternalGrandfather || maternalGrandmother) && (
              <Section title={<SectionHeader title={TITLES.grandparents} />} icon={<Users className="h-4 w-4" />}>
                {(paternalGrandfather || paternalGrandmother) && (
                  <CombinedProfileCard person1={paternalGrandfather} person2={paternalGrandmother} relationship1="દાદા" relationship2="દાદી" />
                )}
                {(maternalGrandfather || maternalGrandmother) && (
                  <CombinedProfileCard person1={maternalGrandfather} person2={maternalGrandmother} relationship1="નાના" relationship2="નાની" />
                )}
              </Section>
            )}

            {/* In-Laws (Parents) */}
            {spouse && (fatherInLaw || motherInLaw) && (
              <Section title={<SectionHeader title={TITLES.inLawParents} />} icon={<Users className="h-4 w-4" />}>
                <CombinedProfileCard person1={fatherInLaw} person2={motherInLaw} relationship1="સસરો" relationship2="સાસુ" />
              </Section>
            )}

            {/* Siblings */}
            {siblings.length > 0 && (
              <Section title={<SectionHeader title={TITLES.siblings} />} icon={<Users className="h-4 w-4" />}>
                {siblings.map((sibling: UserWithChildren) => {
                  const siblingSpouse = findUserById(sibling.spouseId, allUsers);
                  const isBrother = sibling.gender === 'male';
                  let spouseRel = 'બનેવી';
                  if (isBrother) {
                    const isUserOlder = isPerson1Older(user, sibling);
                    if (user.gender === 'male') {
                      spouseRel = isUserOlder === true ? 'પુત્રવધૂ' : isUserOlder === false ? 'ભાભી' : 'ભાભી';
                    } else {
                      spouseRel = 'ભાભી';
                    }
                  }
                  return (
                    <CombinedProfileCard
                      key={sibling.id}
                      person1={sibling}
                      person2={siblingSpouse}
                      relationship1={isBrother ? 'ભાઈ' : 'બહેન'}
                      relationship2={spouseRel}
                    />
                  );
                })}
              </Section>
            )}

            {/* Children */}
            {children.length > 0 && (
              <Section title={<SectionHeader title={TITLES.children} />} icon={<Users className="h-4 w-4" />}>
                {children.map((c: UserWithChildren) => {
                  const childSpouse = findUserById(c.spouseId, allUsers);
                  const isDikro = c.gender === 'male';
                  return (
                    <CombinedProfileCard
                      key={c.id}
                      person1={c}
                      person2={childSpouse}
                      relationship1={isDikro ? 'દીકરો' : 'દીકરી'}
                      relationship2={isDikro ? 'પુત્રવધૂ' : 'જમાઈ'}
                    />
                  );
                })}
              </Section>
            )}

            {/* Paternal Uncles & Aunts */}
            {hasPaternalUnclesOrAunts && (
              <Section title={<SectionHeader title={TITLES.paternalRelatives} />} icon={<Users className="h-4 w-4" />}>
                {paternalUncles.map((uncle: UserWithChildren) => {
                  const kaki = findUserById(uncle.spouseId, allUsers);
                  const isFatherOlder = father ? isPerson1Older(father, uncle) : null;
                  return (
                    <CombinedProfileCard
                      key={uncle.id}
                      person1={uncle}
                      person2={kaki}
                      relationship1={isFatherOlder === false ? 'મોટા કાકા' : 'કાકા'}
                      relationship2={isFatherOlder === false ? 'મોટી કાકી' : 'કાકી'}
                    />
                  );
                })}
                {paternalAunts.map((foi: UserWithChildren) => {
                  const fuwa = findUserById(foi.spouseId, allUsers);
                  return (
                    <CombinedProfileCard key={foi.id} person1={foi} person2={fuwa} relationship1="ફોઈ" relationship2="ફુઆ" />
                  );
                })}
              </Section>
            )}

            {/* Maternal Uncles & Aunts */}
            {hasMaternalUnclesOrAunts && (
              <Section title={<SectionHeader title={TITLES.maternalRelatives} />} icon={<Users className="h-4 w-4" />}>
                {maternalUncles.map((mama: UserWithChildren) => {
                  const mami = findUserById(mama.spouseId, allUsers);
                  return (
                    <CombinedProfileCard key={mama.id} person1={mama} person2={mami} relationship1="મામા" relationship2="મામી" />
                  );
                })}
                {maternalAunts.map((masi: UserWithChildren) => {
                  const masa = findUserById(masi.spouseId, allUsers);
                  return (
                    <CombinedProfileCard key={masi.id} person1={masi} person2={masa} relationship1="માસી" relationship2="માસા" />
                  );
                })}
              </Section>
            )}

            {/* Husband's Brothers (female user only) */}
            {user.gender === 'female' && husbandBrothers.length > 0 && spouse && (
              <Section title={<SectionHeader title={TITLES.husbandBrothers} />} icon={<Users className="h-4 w-4" />}>
                {husbandBrothers.map((bro: UserWithChildren) => {
                  const broSpouse = findUserById(bro.spouseId, allUsers);
                  const isHusbandOlder = isPerson1Older(spouse, bro);
                  const rel1 = isHusbandOlder === true ? 'દિયર' : isHusbandOlder === false ? 'જેઠ' : 'દિયર/જેઠ';
                  const rel2 = isHusbandOlder === true ? 'દેરાણી' : isHusbandOlder === false ? 'જેઠાણી' : 'દેરાણી/જેઠાણી';
                  return <CombinedProfileCard key={bro.id} person1={bro} person2={broSpouse} relationship1={rel1} relationship2={rel2} />;
                })}
              </Section>
            )}

            {/* Husband's Sisters (female user only) */}
            {user.gender === 'female' && husbandSisters.length > 0 && (
              <Section title={<SectionHeader title={TITLES.husbandSisters} />} icon={<Users className="h-4 w-4" />}>
                {husbandSisters.map((nanad: UserWithChildren) => {
                  const nandoi = findUserById(nanad.spouseId, allUsers);
                  return <CombinedProfileCard key={nanad.id} person1={nanad} person2={nandoi} relationship1="નણંદ" relationship2="નંદોઈ" />;
                })}
              </Section>
            )}

            {/* Wife's Sisters (male user only) */}
            {user.gender === 'male' && wifeSisters.length > 0 && (
              <Section title={<SectionHeader title={TITLES.wifeSisters} />} icon={<Users className="h-4 w-4" />}>
                {wifeSisters.map((sali: UserWithChildren) => (
                  <CombinedProfileCard key={sali.id} person1={sali} person2={undefined} relationship1="સાળી" relationship2="" />
                ))}
              </Section>
            )}

            {/* Wife's Brothers (male user only) */}
            {user.gender === 'male' && wifeBrothers.length > 0 && (
              <Section title={<SectionHeader title={TITLES.wifeBrothers} />} icon={<Users className="h-4 w-4" />}>
                {wifeBrothers.map((salo: UserWithChildren) => (
                  <CombinedProfileCard key={salo.id} person1={salo} person2={undefined} relationship1="સાળો" relationship2="" />
                ))}
              </Section>
            )}

          </div>
        </div>

        <ShareProfileDialog
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          profileUrl={profileUrl}
          profileName={profileFullName}
        />
      </div>
    </>
  );
}
