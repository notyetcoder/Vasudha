
'use client';
import type { User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from './ui/button';
import { Users, ChevronDown } from 'lucide-react';
import { findChildren, findUserById } from '@/lib/user-utils';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Separator } from './ui/separator';

interface CombinedProfileCardProps {
  person1?: User | null;
  person2?: User | null;
  relationship1: string;
  relationship2: string;
  allUsers: User[];
  showChildrenLink?: boolean;
}

const PersonDisplay = ({ person, relationship, onNameClick, onCardDoubleClick }: { person: User, relationship: string, onNameClick: (e: React.MouseEvent) => void, onCardDoubleClick: () => void }) => (
    <div className="flex flex-col items-center text-center group cursor-pointer" onDoubleClick={onCardDoubleClick}>
        <Image
            src={person.profilePictureUrl}
            alt={person.name}
            width={64}
            height={64}
            data-ai-hint="profile avatar"
            className={cn("rounded-full border-2 border-background shadow-md transition-transform group-hover:scale-110", person.isDeceased && "grayscale")}
        />
        <p 
            className="font-semibold text-sm mt-2 text-primary hover:underline"
            onClick={onNameClick}
        >
            {person.name}
        </p>
        <p className="text-xs text-muted-foreground">{relationship}</p>
    </div>
)

const ChildDisplay = ({ child }: { child: User }) => {
    const router = useRouter();
    return (
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/profile/${child.id}`)}>
             <Image
                src={child.profilePictureUrl}
                alt={child.name}
                width={32}
                height={32}
                data-ai-hint="profile avatar"
                className={cn("rounded-full", child.isDeceased && "grayscale")}
            />
            <p className="text-sm font-medium text-foreground truncate">{child.name}</p>
        </div>
    )
}

export default function CombinedProfileCard({ person1, person2, relationship1, relationship2, allUsers, showChildrenLink }: CombinedProfileCardProps) {
  const router = useRouter();
  const [isChildrenVisible, setIsChildrenVisible] = useState(false);
  
  if (!person1 && !person2) {
    // This case handles a single person card, e.g., a single sibling.
    if(person1) {
       // We can render a simplified card for single person.
    }
    // Or return null if no one is provided.
    return null;
  }

  // If only person1 (the blood relative) exists, we still want to show them.
  // Example: a brother who is not married.
  if (person1 && !person2) {
     return (
        <Card className={cn("overflow-hidden transition-shadow duration-200", (person1?.isDeceased) && "bg-muted/50")}>
            <CardContent className="p-3">
                 <div className="flex justify-around items-start">
                    <PersonDisplay person={person1} relationship={relationship1} onNameClick={(e) => { e.stopPropagation(); handleNavigate(person1.id); }} onCardDoubleClick={() => handleNavigate(person1.id)} />
                </div>
                 {showChildrenLink && findChildren(person1, allUsers).length > 0 && (
                    <div className="mt-2 text-center">
                        <Button variant="link" size="sm" className="text-xs h-auto p-1" onClick={(e) => { e.stopPropagation(); setIsChildrenVisible(!isChildrenVisible); }}>
                            <Users className="mr-1 h-3 w-3" /> {isChildrenVisible ? 'Hide' : 'View'} {findChildren(person1, allUsers).length} {findChildren(person1, allUsers).length > 1 ? 'children' : 'child'} <ChevronDown className={cn("h-3 w-3 ml-1 transition-transform", isChildrenVisible && "rotate-180")} />
                        </Button>
                    </div>
                )}
            </CardContent>
            {isChildrenVisible && findChildren(person1, allUsers).length > 0 && (
                <>
                    <Separator />
                    <div className="p-3 bg-secondary/30">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {findChildren(person1, allUsers).map(child => <ChildDisplay key={child.id} child={child} />)}
                        </div>
                    </div>
                </>
            )}
        </Card>
     )
  }

  const handleNavigate = (id: string) => {
    router.push(`/profile/${id}`);
  };

  const children = person1 ? findChildren(person1, allUsers) : [];

  return (
    <Card className={cn("overflow-hidden transition-shadow duration-200", (person1?.isDeceased || person2?.isDeceased) && "bg-muted/50")}>
        <CardContent className="p-3">
            <div className="flex justify-around items-start">
                {person1 && <PersonDisplay person={person1} relationship={relationship1} onNameClick={(e) => { e.stopPropagation(); handleNavigate(person1.id); }} onCardDoubleClick={() => handleNavigate(person1.id)} />}
                {person2 && <PersonDisplay person={person2} relationship={relationship2} onNameClick={(e) => { e.stopPropagation(); handleNavigate(person2.id); }} onCardDoubleClick={() => handleNavigate(person2.id)} />}
            </div>
            {showChildrenLink && children.length > 0 && person1 && (
                 <div className="mt-2 text-center">
                    <Button 
                        variant="link" 
                        size="sm" 
                        className="text-xs h-auto p-1" 
                        onClick={(e) => { e.stopPropagation(); setIsChildrenVisible(!isChildrenVisible); }}
                    >
                       <Users className="mr-1 h-3 w-3" /> {isChildrenVisible ? 'Hide' : 'View'} {children.length} {children.length > 1 ? 'children' : 'child'} <ChevronDown className={cn("h-3 w-3 ml-1 transition-transform", isChildrenVisible && "rotate-180")} />
                    </Button>
                </div>
            )}
        </CardContent>

         {isChildrenVisible && children.length > 0 && (
            <>
                <Separator />
                <div className="p-3 bg-secondary/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {children.map(child => <ChildDisplay key={child.id} child={child} />)}
                    </div>
                </div>
            </>
        )}
    </Card>
  )
}
