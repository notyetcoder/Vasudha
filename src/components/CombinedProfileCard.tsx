'use client';
import type { User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import UserAvatar from './UserAvatar';
import { Button } from './ui/button';
import { Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { Separator } from './ui/separator';

interface UserWithChildren extends User {
  children?: User[];
}

interface CombinedProfileCardProps {
  person1?: UserWithChildren | null;
  person2?: UserWithChildren | null;
  relationship1: string;
  relationship2: string;
  allUsers?: User[];
}

// Single person tile — entire tile is a link to their profile
const PersonTile = ({ person, relationship }: { person: User; relationship: string }) => (
  <Link
    href={`/profile/${person.id}`}
    className="flex flex-col items-center text-center group min-w-0 flex-1 p-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
    aria-label={`View ${person.name}'s profile — ${relationship}`}
  >
    <UserAvatar
      name={person.name}
      profilePictureUrl={person.profilePictureUrl}
      size={64}
      isDeceased={person.isDeceased}
      className="transition-transform duration-200 group-hover:scale-105"
    />
    <p className="font-semibold text-sm mt-2 text-primary group-hover:underline truncate max-w-full">
      {person.name}
    </p>
    <p className="text-xs text-muted-foreground mt-0.5">{relationship}</p>
    {person.isDeceased && (
      <span className="text-[10px] text-amber-500 mt-0.5">स्वर्गस्थ</span>
    )}
  </Link>
);

// Child row inside the expanded children section
const ChildRow = ({ child }: { child: User }) => (
  <Link
    href={`/profile/${child.id}`}
    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors min-h-[44px]"
    aria-label={`View ${child.name}'s profile`}
  >
    <UserAvatar
      name={child.name}
      profilePictureUrl={child.profilePictureUrl}
      size={32}
      isDeceased={child.isDeceased}
    />
    <div className="min-w-0">
      <p className="text-sm font-medium truncate">{child.name}</p>
      {child.isDeceased && <p className="text-[10px] text-amber-500">स्वर्गस्थ</p>}
    </div>
  </Link>
);

export default function CombinedProfileCard({
  person1,
  person2,
  relationship1,
  relationship2,
}: CombinedProfileCardProps) {
  const [childrenOpen, setChildrenOpen] = useState(false);

  if (!person1 && !person2) return null;

  const children = person1?.children ?? [];
  const hasChildren = children.length > 0;
  const isDeceased = person1?.isDeceased || person2?.isDeceased;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200 bg-card/30 backdrop-blur-lg border-white/10 shadow-lg hover:shadow-xl hover:border-white/20',
        isDeceased && 'bg-muted/20',
      )}
    >
      <CardContent className="p-3">
        {/* Person tiles side by side */}
        <div className="flex justify-around items-start gap-2">
          {person1 && <PersonTile person={person1} relationship={relationship1} />}
          {person2 && <PersonTile person={person2} relationship={relationship2} />}
        </div>

        {/* Children toggle */}
        {hasChildren && (
          <div className="mt-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setChildrenOpen(v => !v)}
              aria-expanded={childrenOpen}
            >
              <Users className="h-3 w-3" />
              {childrenOpen ? 'Hide' : 'Show'} {children.length}{' '}
              {children.length === 1 ? 'child' : 'children'}
              <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', childrenOpen && 'rotate-180')} />
            </Button>
          </div>
        )}
      </CardContent>

      {/* Children list */}
      {childrenOpen && hasChildren && (
        <>
          <Separator />
          <div className="p-3 bg-black/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {children.map(child => (
                <ChildRow key={child.id} child={child} />
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
