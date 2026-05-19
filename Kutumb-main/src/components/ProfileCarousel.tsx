'use client';

import * as React from 'react';
import type { User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { findUserById } from '@/lib/user-utils';
import { cn } from '@/lib/utils';
import Autoplay from 'embla-carousel-autoplay';
import UserAvatar from './UserAvatar';

const getFirstName = (fullName?: string | null) => {
  if (!fullName) return '';
  return fullName.split(' ')[0];
};

const getParentDisplay = (user: User, allUsers: User[]) => {
  const father = findUserById(user.fatherId, allUsers);
  const mother = findUserById(user.motherId, allUsers);
  const fatherName = father ? father.name : getFirstName(user.fatherName);
  const motherName = mother ? mother.name : getFirstName(user.motherName);
  if (!fatherName && !motherName) return null;
  const rel = user.gender === 'male' ? 's/o' : 'd/o';
  if (fatherName && motherName) return `${rel} ${fatherName} & ${motherName}`;
  return `${rel} ${fatherName || motherName}`;
};

// h/o = husband of (male profile: he is husband of this woman)
// w/o = wife of (female profile: she is wife of this man)
const getSpouseDisplay = (user: User, allUsers: User[]) => {
  if (user.maritalStatus !== 'married') return null;
  const spouse = findUserById(user.spouseId, allUsers);
  const spouseName = spouse ? spouse.name : getFirstName(user.spouseName);
  if (!spouseName) return null;
  const rel = user.gender === 'male' ? 'h/o' : 'w/o';
  return `${rel} ${spouseName}`;
};

const ProfileCard = ({ user, allUsers, priority }: { user: User; allUsers: User[]; priority?: boolean }) => {
  if (!user) return null;
  const parentText = getParentDisplay(user, allUsers);
  const spouseText = getSpouseDisplay(user, allUsers);
  const showProfession = !spouseText && user.description;

  return (
    <Link href={`/profile/${user.id}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/30 group-hover:-translate-y-1 bg-card/30 backdrop-blur-lg border-white/10 shadow-lg">
        <CardContent className="p-4 text-center flex flex-col items-center">
          <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
            <UserAvatar
              name={user.name}
              profilePictureUrl={user.profilePictureUrl}
              size={100}
              isDeceased={user.isDeceased}
              priority={priority}
            />
          </div>
          <div className="flex-grow flex flex-col justify-between w-full">
            <div>
              <h3 className="font-semibold text-lg text-primary truncate">{user.name} {user.surname}</h3>
              <div className="text-sm text-muted-foreground mt-2 space-y-1 min-h-[40px]">
                {parentText && <p className="text-balance truncate">{parentText}</p>}
                {spouseText && <p className="text-balance truncate">{spouseText}</p>}
                {showProfession && <p className="text-balance truncate">{user.description}</p>}
              </div>
            </div>
            {user.isDeceased ? (
              <div className="mt-3">
                <Badge variant="secondary" className="bg-amber-400/20 border-amber-400/50 text-amber-700 dark:text-amber-300">
                  स्वर्गस्थ
                </Badge>
              </div>
            ) : user.family ? (
              <div className="mt-3">
                <Badge variant="secondary" className="whitespace-nowrap bg-black/10 border-white/10 text-foreground/80">
                  {user.family}
                </Badge>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default function ProfileCarousel({ users, allUsers }: { users: User[]; allUsers: User[] }) {
  const [shuffledUsers, setShuffledUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    setShuffledUsers([...users].sort(() => 0.5 - Math.random()));
  }, [users]);

  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  if (shuffledUsers.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No featured profiles available.</div>;
  }

  return (
    <Carousel
      opts={{ align: 'start', loop: true }}
      plugins={[autoplayPlugin.current]}
      className="w-full"
    >
      <CarouselContent className="-ml-4">
        {shuffledUsers.map((user, index) => (
          <CarouselItem key={user.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
            <div className="p-1 h-full">
              <ProfileCard user={user} allUsers={allUsers} priority={index < 3} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}
